<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { formatMonthShort, getCurrentFiscalYear } from '~/utils/fiscalYear'
import type { ChartData } from 'chart.js'

const route = useRoute()
const { loadData, loaded } = useDataset()
const { loadCsReps, getCsRepByName } = useCsReps()
const { loadGoals } = useGoals()
const { getRepMonthlyMetrics, getRepKpiSummary, generateRepAnalysis, classifyRole } = useRepReport()

await loadData()
onMounted(() => {
  loadCsReps()
  loadGoals()
})

const fy = ref(getCurrentFiscalYear())
const repName = computed(() => decodeURIComponent(route.params.name as string))

const csRepInfo = computed(() => getCsRepByName(repName.value))
const isRegistered = computed(() => !!csRepInfo.value)
const repTitle = computed(() => csRepInfo.value?.title || '')
const repTeam = computed(() => csRepInfo.value?.team || '')
const repGrade = computed(() => csRepInfo.value?.grade || '')
const repSupplement = computed(() => csRepInfo.value?.supplement || '')
const roleCategory = computed(() => classifyRole(repGrade.value))

const roleBadgeLabel = computed(() => {
  switch (roleCategory.value) {
    case 'manager': return 'マネージャー'
    case 'leader': return 'リーダー'
    default: return 'メンバー'
  }
})

const roleBadgeClass = computed(() => {
  switch (roleCategory.value) {
    case 'manager': return 'role-badge--manager'
    case 'leader': return 'role-badge--leader'
    default: return 'role-badge--member'
  }
})

// KPIサマリー
const kpiSummary = computed(() => getRepKpiSummary(fy.value, repName.value))

// 月次メトリクス
const monthlyMetrics = computed(() => getRepMonthlyMetrics(fy.value, repName.value))

// 月次チャート
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

// 月次テーブル
const tableColumns = [
  { key: 'month', label: '月', sortable: false },
  { key: 'revenue', label: '売上高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const },
]

const tableRows = computed(() =>
  monthlyMetrics.value.map((m) => ({
    month: formatMonthShort(m.month),
    revenue: m.revenue,
    grossProfit: m.grossProfit,
    grossProfitRate: m.grossProfitRate,
    dealCount: m.dealCount,
  })),
)

// 役職分析
const analysis = computed(() => generateRepAnalysis(
  fy.value, repName.value, repGrade.value, repSupplement.value,
  csRepInfo.value?.revenueTarget ?? 0,
  csRepInfo.value?.grossProfitTarget ?? 0,
))
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <div class="page-header__breadcrumb">
        <NuxtLink to="/staff-report" class="breadcrumb-link">業務担当者別レポート</NuxtLink>
        <span class="breadcrumb-sep">/</span>
        <span>{{ repName }}</span>
      </div>
      <h2>{{ repName }} のレポート詳細</h2>
      <p>業務担当者の業績と役職に応じた分析を表示します</p>
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

    <!-- マスタ未登録案内 -->
    <div v-if="!isRegistered" class="info-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span>業務担当者管理ページでグレードを登録すると、より詳細な分析が表示されます</span>
    </div>

    <!-- 担当者プロフィール -->
    <div v-if="isRegistered && (repTeam || repGrade)" class="profile-section">
      <div class="profile-items">
        <span v-if="repTeam" class="profile-item">チーム: <strong>{{ repTeam }}</strong></span>
        <span v-if="repTeam && repGrade" class="profile-sep">|</span>
        <span v-if="repGrade" class="profile-item">グレード: <strong>{{ repGrade }}</strong></span>
      </div>
      <div v-if="repSupplement" class="profile-supplement">
        補足事項: {{ repSupplement }}
      </div>
    </div>

    <template v-if="kpiSummary">
      <!-- KPIサマリーカード -->
      <div class="kpi-grid">
        <KpiCard
          label="YTD 売上高"
          :value="formatCurrency(kpiSummary.ytdRevenue)"
        />
        <KpiCard
          label="YTD 粗利高"
          :value="formatCurrency(kpiSummary.ytdGrossProfit)"
        />
        <KpiCard
          label="YTD 粗利率"
          :value="formatPercent(kpiSummary.ytdGrossProfitRate)"
        />
        <KpiCard
          label="YTD 案件数"
          :value="`${kpiSummary.ytdDealCount}件`"
        />
      </div>

      <!-- 目標KPIカード -->
      <div v-if="csRepInfo?.revenueTarget || csRepInfo?.grossProfitTarget" class="kpi-grid">
        <KpiCard v-if="csRepInfo?.revenueTarget" label="売上目標" :value="formatCurrency(csRepInfo.revenueTarget)" />
        <KpiCard v-if="csRepInfo?.grossProfitTarget" label="粗利目標" :value="formatCurrency(csRepInfo.grossProfitTarget)" />
      </div>

      <!-- 月ごとの振り返り -->
      <h3 class="section-title">月ごとの振り返り</h3>

      <div class="chart-grid mb-lg">
        <div class="chart-card">
          <div class="chart-card__title">月次 売上・粗利推移</div>
          <ChartsBarChart :data="monthlyChartData" />
        </div>
      </div>

      <CommonDataTable
        title="月次パフォーマンス"
        :columns="tableColumns"
        :rows="tableRows"
        :page-size="12"
      />

      <!-- 役職に応じた分析 -->
      <div v-if="analysis" class="analysis-section">
        <h3 class="section-title">
          役職に応じた分析
          <span class="role-badge" :class="roleBadgeClass">{{ roleBadgeLabel }}</span>
          <span v-if="repGrade" class="role-title-label">（{{ repGrade }}）</span>
        </h3>

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

.info-banner {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-lg);
  background: #FFFAE6;
  border: 1px solid #FFE380;
  border-radius: var(--radius);
  color: var(--color-text);
  font-size: 0.875rem;
}

.info-banner svg {
  flex-shrink: 0;
  color: var(--color-warning);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.role-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
}

.role-badge--manager {
  background: #DEEBFF;
  color: #0747A6;
}

.role-badge--leader {
  background: #E3FCEF;
  color: #006644;
}

.role-badge--member {
  background: #F4F5F7;
  color: #42526E;
}

.role-title-label {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-subtle);
}

.analysis-section {
  margin-top: var(--space-lg);
}

.analysis-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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

.profile-section {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.profile-items {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text);
}

.profile-sep {
  color: var(--color-text-subtle);
}

.profile-supplement {
  margin-top: var(--space-sm);
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
  line-height: 1.5;
}
</style>
