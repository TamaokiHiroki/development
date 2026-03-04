<script setup lang="ts">
import { formatCurrency, formatCurrencyMan, formatPercent } from '~/utils/formatters'
import { formatMonthShort } from '~/utils/fiscalYear'
import type { ChartData } from 'chart.js'

const { loadData, loaded } = useDataset()
const { getUnitEconomics, getMonthlyLtvCac, getCustomerSegments, getTenureSegments, getCustomerUnitEconomicsList } = useUnitEconomics()

await loadData()

const fy = ref(2026)

const ue = computed(() => getUnitEconomics(fy.value))
const monthlyLtvCac = computed(() => getMonthlyLtvCac(fy.value))
const segments = computed(() => getCustomerSegments(fy.value))
const tenureSegments = computed(() => getTenureSegments(fy.value))
const customerUeList = computed(() => getCustomerUnitEconomicsList(fy.value))

const ltvCacStatus = computed(() => {
  const ratio = ue.value.ltvCacRatio
  if (ratio >= 3) return { color: 'var(--color-success)', badge: 'badge--success', label: '健全' }
  if (ratio >= 1) return { color: 'var(--color-warning)', badge: 'badge--warning', label: '注意' }
  return { color: 'var(--color-error)', badge: 'badge--error', label: '危険' }
})

// LTV/CAC比 推移チャート
const ltvCacChartData = computed<ChartData<'line'>>(() => ({
  labels: monthlyLtvCac.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: 'LTV/CAC比',
      data: monthlyLtvCac.value.map((m) => m.ltvCacRatio),
      borderColor: '#0052CC',
      backgroundColor: 'rgba(0, 82, 204, 0.1)',
      fill: true,
      tension: 0.3,
    },
    {
      label: '健全ライン（3.0）',
      data: monthlyLtvCac.value.map(() => 3),
      borderColor: '#36B37E',
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    },
  ],
}))

// LTV・CAC 推移チャート
const ltvCacAbsChartData = computed<ChartData<'line'>>(() => ({
  labels: monthlyLtvCac.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: 'LTV',
      data: monthlyLtvCac.value.map((m) => m.ltv),
      borderColor: '#0052CC',
      tension: 0.3,
    },
    {
      label: 'CAC',
      data: monthlyLtvCac.value.map((m) => m.cac),
      borderColor: '#FF5630',
      tension: 0.3,
    },
  ],
}))

// 継続月別セグメント チャート
const tenureChartData = computed<ChartData<'bar'>>(() => ({
  labels: tenureSegments.value.map((s) => s.label),
  datasets: [
    {
      label: '顧客数',
      data: tenureSegments.value.map((s) => s.customerCount),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
  ],
}))

const tenureGpChartData = computed<ChartData<'bar'>>(() => ({
  labels: tenureSegments.value.map((s) => s.label),
  datasets: [
    {
      label: '売上高',
      data: tenureSegments.value.map((s) => s.totalRevenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: '粗利高',
      data: tenureSegments.value.map((s) => s.totalGP),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// 継続月別テーブル
const tenureColumns = [
  { key: 'label', label: '継続月', sortable: false },
  { key: 'customerCount', label: '顧客数', align: 'right' as const, sortable: true },
  { key: 'totalRevenue', label: '売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'totalGP', label: '粗利高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, sortable: true, format: (v: number) => formatPercent(v) },
  { key: 'avgLtv', label: '平均LTV', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(Math.round(v)) },
  { key: 'avgDealCount', label: '平均案件数', align: 'right' as const, sortable: true, format: (v: number) => v.toFixed(1) },
]

// 顧客別ユニットエコノミクス テーブル
const customerUeColumns = [
  { key: 'accountName', label: '取引先名', sortable: true },
  { key: 'tenureMonths', label: '継続月', align: 'right' as const, sortable: true, format: (v: number) => `${v}ヶ月` },
  { key: 'totalRevenue', label: '売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'totalGP', label: '粗利高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, sortable: true, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const, sortable: true },
  { key: 'gpPerMonth', label: '月あたり粗利', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(Math.round(v)) },
]

// 顧客セグメントテーブル（リンク付き）
const segmentColumns = [
  { key: 'accountName', label: '取引先名', sortable: true },
  { key: 'totalRevenue', label: '売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'totalGP', label: '累計粗利', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, sortable: true, format: (v: number) => formatPercent(v) },
  { key: 'tenureMonths', label: '継続月', align: 'right' as const, sortable: true, format: (v: number) => `${v}ヶ月` },
  { key: 'dealCount', label: '案件数', align: 'right' as const, sortable: true },
  { key: 'avgDealSize', label: '平均粗利', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
]

// Top10 顧客のドーナツチャート
const topCustomersChart = computed<ChartData<'doughnut'>>(() => {
  const top10 = segments.value.slice(0, 10)
  const others = segments.value.slice(10)
  const othersGP = others.reduce((s, c) => s + c.totalGP, 0)

  const labels = [...top10.map((c) => c.accountName)]
  const data = [...top10.map((c) => c.totalGP)]

  if (othersGP > 0) {
    labels.push('その他')
    data.push(othersGP)
  }

  const colors = [
    '#0052CC', '#00B8D9', '#36B37E', '#FFAB00', '#FF5630',
    '#6554C0', '#00875A', '#0065FF', '#FF8B00', '#403294',
    '#6B778C',
  ]

  return {
    labels,
    datasets: [{
      data,
      backgroundColor: colors.slice(0, labels.length),
    }],
  }
})

// タブ管理
const activeTab = ref<'tenure' | 'customer'>('tenure')
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>ユニットエコノミクス</h2>
      <p>LTV/CAC分析と顧客セグメント分析</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      :show-period-filter="false"
      :show-stage-filter="false"
    />

    <!-- KPIカード -->
    <div class="kpi-grid">
      <KpiCard
        label="LTV:CAC比"
        :value="ue.ltvCacRatio.toFixed(1)"
        :trend-text="ltvCacStatus.label"
        :trend-direction="ue.ltvCacRatio >= 3 ? 'up' : ue.ltvCacRatio >= 1 ? 'flat' : 'down'"
        :trend-color="ltvCacStatus.color"
      />
      <KpiCard
        label="LTV（平均顧客生涯価値）"
        :value="formatCurrencyMan(ue.ltv)"
      />
      <KpiCard
        label="CAC（顧客獲得コスト）"
        :value="formatCurrencyMan(ue.cac)"
      />
      <KpiCard
        label="ARPU（月次）"
        :value="formatCurrencyMan(ue.arpu)"
      />
      <KpiCard
        label="ユニーク顧客数"
        :value="`${ue.uniqueCustomers}社`"
      />
    </div>

    <!-- チャート -->
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">LTV/CAC比 推移（累計）</div>
        <ChartsLineChart :data="ltvCacChartData" />
      </div>
      <div class="chart-card">
        <div class="chart-card__title">LTV・CAC 推移（累計）</div>
        <ChartsLineChart :data="ltvCacAbsChartData" />
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">顧客別粗利構成（Top 10）</div>
        <ChartsDoughnutChart :data="topCustomersChart" />
      </div>
    </div>

    <!-- セグメント分析タブ -->
    <div class="segment-section">
      <h3 class="section-title">セグメント分析</h3>
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'tenure' }"
          @click="activeTab = 'tenure'"
        >
          継続月別
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'customer' }"
          @click="activeTab = 'customer'"
        >
          顧客別ユニットエコノミクス
        </button>
      </div>

      <!-- 継続月別タブ -->
      <div v-if="activeTab === 'tenure'">
        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-card__title">継続月別 顧客数</div>
            <ChartsBarChart :data="tenureChartData" />
          </div>
          <div class="chart-card">
            <div class="chart-card__title">継続月別 売上・粗利</div>
            <ChartsBarChart :data="tenureGpChartData" />
          </div>
        </div>

        <CommonDataTable
          title="継続月別セグメント"
          :columns="tenureColumns"
          :rows="tenureSegments"
          :page-size="10"
        />
      </div>

      <!-- 顧客別ユニットエコノミクス タブ -->
      <div v-if="activeTab === 'customer'">
        <CommonDataTable
          title="顧客別ユニットエコノミクス"
          :columns="customerUeColumns"
          :rows="customerUeList"
          :page-size="15"
        />
      </div>
    </div>

    <!-- 顧客セグメント一覧（リンク付き） -->
    <div class="segment-section">
      <h3 class="section-title">顧客セグメント一覧</h3>
      <p class="section-desc">取引先名をクリックすると顧客詳細ページに遷移します</p>
      <div class="customer-segment-table">
        <div class="data-table-wrapper">
          <div class="data-table-header">
            <span class="data-table-title">顧客別セグメント</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="col in segmentColumns" :key="col.key" :class="col.align === 'right' ? 'text-right' : ''">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seg in segments" :key="seg.accountName">
                <td>
                  <NuxtLink :to="`/customer/${encodeURIComponent(seg.accountName)}`" class="customer-link">
                    {{ seg.accountName }}
                  </NuxtLink>
                </td>
                <td class="text-right">{{ formatCurrency(seg.totalRevenue) }}</td>
                <td class="text-right">{{ formatCurrency(seg.totalGP) }}</td>
                <td class="text-right">{{ formatPercent(seg.grossProfitRate) }}</td>
                <td class="text-right">{{ seg.tenureMonths }}ヶ月</td>
                <td class="text-right">{{ seg.dealCount }}</td>
                <td class="text-right">{{ formatCurrency(seg.avgDealSize) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.section-desc {
  font-size: 0.875rem;
  color: var(--color-text-subtle);
  margin-bottom: var(--space-md);
}

.segment-section {
  margin-top: var(--space-xl);
}

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: var(--space-lg);
  border-bottom: 2px solid var(--color-border);
}

.tab-btn {
  padding: var(--space-sm) var(--space-md);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-subtle);
  transition: color 0.15s, border-color 0.15s;
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.customer-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.customer-link:hover {
  text-decoration: underline;
}
</style>
