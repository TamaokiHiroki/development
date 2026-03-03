<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { formatMonthShort, getCurrentFiscalYear } from '~/utils/fiscalYear'
import type { ChartData, ChartOptions } from 'chart.js'

const route = useRoute()
const { loadData, loaded } = useDataset()
const {
  getCustomerMonthlyMetrics,
  getCustomerKpiSummary,
  getDealList,
  generateCustomerAnalysis,
} = useCustomerDetail()

await loadData()

const fy = ref(getCurrentFiscalYear())
const customerName = computed(() => decodeURIComponent(route.params.name as string))

// KPI
const kpiSummary = computed(() => getCustomerKpiSummary(fy.value, customerName.value))

// 月次データ
const monthlyMetrics = computed(() => getCustomerMonthlyMetrics(fy.value, customerName.value))

// 案件一覧
const dealList = computed(() => getDealList(fy.value, customerName.value))

// 分析
const analysis = computed(() => generateCustomerAnalysis(fy.value, customerName.value))

// 月次売上・粗利チャート
const monthlyChartData = computed<ChartData<'bar'>>(() => ({
  labels: monthlyMetrics.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: '売上高',
      data: monthlyMetrics.value.map((m) => m.revenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: '粗利高',
      data: monthlyMetrics.value.map((m) => m.grossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// 粗利率チャート
const gprChartData = computed<ChartData<'bar'>>(() => ({
  labels: monthlyMetrics.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: '粗利率',
      data: monthlyMetrics.value.map((m) => m.grossProfitRate * 100),
      backgroundColor: monthlyMetrics.value.map((m) =>
        m.grossProfitRate >= 0.3 ? '#36B37E' : m.grossProfitRate >= 0.15 ? '#FFAB00' : m.dealCount > 0 ? '#FF5630' : '#DFE1E6',
      ),
      borderRadius: 4,
    },
  ],
}))

const gprChartOptions: ChartOptions<'bar'> = {
  scales: {
    y: {
      ticks: {
        callback: (v) => `${v}%`,
      },
    },
  },
}

// 月次テーブル
const monthlyColumns = [
  { key: 'month', label: '月', sortable: false },
  { key: 'revenue', label: '売上高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const },
]

const monthlyRows = computed(() =>
  monthlyMetrics.value.map((m) => ({
    month: formatMonthShort(m.month),
    revenue: m.revenue,
    grossProfit: m.grossProfit,
    grossProfitRate: m.grossProfitRate,
    dealCount: m.dealCount,
  })),
)

// 案件一覧テーブル
const dealColumns = [
  { key: 'completionMonth', label: '完了月', sortable: true },
  { key: 'dealName', label: '商談名', sortable: true },
  { key: 'type', label: '種類', sortable: true },
  { key: 'totalAmount', label: '売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'csRep', label: '業務担当', sortable: true },
  { key: 'salesRep', label: '営業担当', sortable: true },
]

const dealRows = computed(() =>
  dealList.value.map((d) => ({
    completionMonth: d.completionMonth,
    dealName: d.dealName,
    type: d.type,
    totalAmount: d.totalAmount,
    grossProfit: d.grossProfit,
    csRep: d.csRep,
    salesRep: d.salesRep,
  })),
)
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <div class="page-header__breadcrumb">
        <NuxtLink to="/customer" class="breadcrumb-link">顧客分析</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>顧客詳細</span>
      </div>
      <h2>{{ customerName }}</h2>
      <p>顧客別ユニットエコノミクスと評価分析</p>
    </div>

    <!-- フィルター -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">会計年度</label>
        <select v-model="fy" class="filter-select">
          <option :value="2026">FY2026</option>
          <option :value="2025">FY2025</option>
        </select>
      </div>
    </div>

    <!-- データなし -->
    <div v-if="kpiSummary.dealCount === 0" class="empty-state">
      <p class="empty-state__text">当該会計年度における取引データがありません</p>
    </div>

    <template v-else>
      <!-- KPIサマリーカード -->
      <div class="kpi-grid">
        <KpiCard label="売上高" :value="formatCurrency(kpiSummary.totalRevenue)" />
        <KpiCard label="粗利高" :value="formatCurrency(kpiSummary.totalGrossProfit)" />
        <KpiCard label="粗利率" :value="formatPercent(kpiSummary.grossProfitRate)" />
        <KpiCard label="案件数" :value="`${kpiSummary.dealCount}件`" />
      </div>
      <div class="kpi-grid">
        <KpiCard label="継続月" :value="`${kpiSummary.tenureMonths}ヶ月`" />
        <KpiCard label="LTV（累計粗利）" :value="formatCurrency(kpiSummary.ltv)" />
        <KpiCard label="平均案件単価" :value="formatCurrency(Math.round(kpiSummary.avgDealSize))" />
        <KpiCard label="月あたり粗利" :value="formatCurrency(Math.round(kpiSummary.gpPerMonth))" />
        <KpiCard label="ARPU（月平均売上）" :value="formatCurrency(Math.round(kpiSummary.revenuePerMonth))" />
      </div>

      <!-- 月次推移チャート -->
      <h3 class="section-title">月次推移</h3>
      <div class="chart-grid">
        <div class="chart-card">
          <div class="chart-card__title">月次 売上・粗利推移</div>
          <ChartsBarChart :data="monthlyChartData" />
        </div>
        <div class="chart-card">
          <div class="chart-card__title">月次 粗利率推移</div>
          <ChartsBarChart :data="gprChartData" :options="gprChartOptions" />
        </div>
      </div>

      <!-- 月次データテーブル -->
      <CommonDataTable
        title="月次パフォーマンス"
        :columns="monthlyColumns"
        :rows="monthlyRows"
        :page-size="12"
      />

      <!-- 案件一覧 -->
      <div class="section-gap">
        <CommonDataTable
          title="案件一覧"
          :columns="dealColumns"
          :rows="dealRows"
          :page-size="15"
        />
      </div>

      <!-- 評価分析 -->
      <div v-if="analysis" class="analysis-section">
        <h3 class="section-title">評価分析</h3>

        <!-- 指標カード -->
        <div class="analysis-indicators">
          <div
            v-for="(ind, idx) in analysis.indicators"
            :key="idx"
            class="analysis-indicator-card"
            :class="`analysis-indicator-card--${ind.status}`"
          >
            <div class="analysis-indicator-card__label">{{ ind.label }}</div>
            <div class="analysis-indicator-card__value">{{ ind.value }}</div>
          </div>
        </div>

        <!-- 評価 -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">評価</h4>
          </div>
          <div class="card-body">
            <p>{{ analysis.evaluation }}</p>
          </div>
        </div>

        <!-- フォローアップ推奨 -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">
              フォローアップ推奨
              <span
                class="risk-badge"
                :class="{
                  'risk-badge--error': analysis.riskLevel === 'at-risk',
                  'risk-badge--warning': analysis.riskLevel === 'stable',
                  'risk-badge--success': analysis.riskLevel === 'growth',
                }"
              >
                {{ analysis.riskLevel === 'at-risk' ? 'リスクあり' : analysis.riskLevel === 'growth' ? 'アップセル機会' : '安定' }}
              </span>
            </h4>
          </div>
          <div class="card-body">
            <p>{{ analysis.followUpRecommendation }}</p>
          </div>
        </div>

        <!-- 改善ポイント -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">改善ポイント</h4>
          </div>
          <div class="card-body">
            <ul class="analysis-list">
              <li v-for="(point, idx) in analysis.improvementPoints" :key="idx">{{ point }}</li>
            </ul>
          </div>
        </div>

        <!-- 具体的なアクション提案 -->
        <div class="card">
          <div class="card-header">
            <h4 class="card-title">具体的なアクション提案</h4>
          </div>
          <div class="card-body">
            <ul class="analysis-list">
              <li v-for="(action, idx) in analysis.actionProposals" :key="idx">{{ action }}</li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-header__breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.8125rem;
  margin-bottom: var(--space-xs);
}

.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  color: var(--color-text-subtle);
}

.filter-bar {
  display: flex;
  gap: var(--space-md);
  align-items: flex-end;
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-card);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: var(--color-text);
  background: var(--color-card);
  min-width: 200px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.2);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl) var(--space-lg);
  text-align: center;
  color: var(--color-text-subtle);
}

.empty-state__text {
  font-size: 1rem;
  margin: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
}

.section-gap {
  margin-top: var(--space-lg);
}

.analysis-section {
  margin-top: var(--space-xl);
}

.analysis-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.analysis-indicator-card {
  padding: var(--space-md);
  background: var(--color-card);
  border-radius: var(--radius);
  border-left: 4px solid;
}

.analysis-indicator-card--success {
  border-left-color: var(--color-success);
}

.analysis-indicator-card--warning {
  border-left-color: var(--color-warning);
}

.analysis-indicator-card--error {
  border-left-color: var(--color-error);
}

.analysis-indicator-card__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  margin-bottom: var(--space-xs);
}

.analysis-indicator-card__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.card {
  background: var(--color-card);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  margin-bottom: var(--space-md);
}

.card-header {
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.card-body {
  padding: var(--space-md);
}

.card-body p {
  margin: 0;
  line-height: 1.7;
  color: var(--color-text);
}

.analysis-list {
  margin: 0;
  padding-left: 1.25rem;
  list-style: disc;
}

.analysis-list li {
  margin-bottom: var(--space-sm);
  line-height: 1.6;
  color: var(--color-text);
}

.analysis-list li:last-child {
  margin-bottom: 0;
}

.risk-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  margin-left: var(--space-sm);
  vertical-align: middle;
}

.risk-badge--error {
  background: var(--color-error-light, #FFEBE6);
  color: var(--color-error);
}

.risk-badge--warning {
  background: #FFF0B3;
  color: #FF8B00;
}

.risk-badge--success {
  background: #E3FCEF;
  color: #006644;
}
</style>
