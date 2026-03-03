<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { formatMonthShort, getLatestConfirmedMonth } from '~/utils/fiscalYear'
const { loadData, loaded } = useDataset()
const { getMonthlyData, getKpiSummary } = usePerformance()

await loadData()

const fy = ref(2026)
const period = ref('monthly')
const stage = ref<'won' | 'all'>('won')

const currentMonth = getLatestConfirmedMonth()
const summary = computed(() => getKpiSummary(fy.value, stage.value, currentMonth))

const monthlyData = computed(() => getMonthlyData(fy.value, stage.value))

// 統合チャート: 売上高・粗利高（棒グラフ / 左軸）+ 粗利率（折れ線 / 右軸）
const consolidatedChartData = computed(() => {
  const labels = monthlyData.value.map((m) => formatMonthShort(m.month))
  const datasets: any[] = [
    {
      type: 'bar' as const,
      label: '売上高',
      data: monthlyData.value.map((m) => m.revenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
      yAxisID: 'y',
      order: 2,
    },
    {
      type: 'bar' as const,
      label: '粗利高',
      data: monthlyData.value.map((m) => m.grossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
      yAxisID: 'y',
      order: 3,
    },
    {
      type: 'line' as const,
      label: '粗利率',
      data: monthlyData.value.map((m) => m.grossProfitRate * 100),
      borderColor: '#FF5630',
      backgroundColor: 'rgba(255, 86, 48, 0.08)',
      pointBackgroundColor: '#FF5630',
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      tension: 0.3,
      fill: false,
      yAxisID: 'y1',
      order: 1,
    },
  ]

  return { labels, datasets }
})

const consolidatedChartOptions = computed(() => ({
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          if (ctx.dataset.yAxisID === 'y1') {
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`
          }
          return `${ctx.dataset.label}: ¥${ctx.parsed.y.toLocaleString('ja-JP')}`
        },
      },
    },
  },
  scales: {
    y: {
      type: 'linear' as const,
      position: 'left' as const,
      title: {
        display: true,
        text: '金額（円）',
        color: '#6B778C',
        font: { size: 12, weight: 600 as const },
      },
      grid: { color: '#DFE1E6' },
      ticks: {
        color: '#6B778C',
        font: { size: 11 },
        callback: (v: any) => `¥${Number(v).toLocaleString('ja-JP')}`,
      },
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      title: {
        display: true,
        text: '粗利率（%）',
        color: '#FF5630',
        font: { size: 12, weight: 600 as const },
      },
      grid: { drawOnChartArea: false },
      ticks: {
        color: '#FF5630',
        font: { size: 11 },
        callback: (v: any) => `${v}%`,
      },
      min: 0,
      suggestedMax: 60,
    },
  },
}))

// 月次データテーブル
const tableColumns = [
  { key: 'month', label: '月', sortable: false },
  { key: 'revenue', label: '売上高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const },
]

const tableRows = computed(() =>
  monthlyData.value.map((m) => ({
    month: formatMonthShort(m.month),
    revenue: m.revenue,
    grossProfit: m.grossProfit,
    grossProfitRate: m.grossProfitRate,
    dealCount: m.dealCount,
  })),
)
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>業績管理</h2>
      <p>月次の売上高・粗利高・粗利率を管理します</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      v-model:period="period"
      v-model:stage="stage"
    />

    <!-- KPI サマリー -->
    <div class="kpi-grid">
      <KpiCard
        label="当月売上高"
        :value="formatCurrency(summary.currentMonth.revenue)"
        :trend-text="summary.mom.revenue.text"
        :trend-direction="summary.mom.revenue.direction"
        :trend-color="summary.mom.revenue.color"
        trend-label="前月比"
      />
      <KpiCard
        label="当月粗利高"
        :value="formatCurrency(summary.currentMonth.grossProfit)"
        :trend-text="summary.mom.grossProfit.text"
        :trend-direction="summary.mom.grossProfit.direction"
        :trend-color="summary.mom.grossProfit.color"
        trend-label="前月比"
      />
      <KpiCard
        label="当月粗利率"
        :value="formatPercent(summary.currentMonth.grossProfitRate)"
        :trend-text="summary.mom.grossProfitRate.text"
        :trend-direction="summary.mom.grossProfitRate.direction"
        :trend-color="summary.mom.grossProfitRate.color"
        trend-label="前月比"
      />
      <KpiCard
        label="YTD 売上高"
        :value="formatCurrency(summary.ytd.revenue)"
        :trend-text="summary.yoy.revenue.text"
        :trend-direction="summary.yoy.revenue.direction"
        :trend-color="summary.yoy.revenue.color"
        trend-label="前年同期比"
      />
    </div>

    <!-- 統合チャート: 売上高・粗利高・粗利率 -->
    <div class="chart-card chart-card--full">
      <div class="chart-card__title">月次業績推移（売上高・粗利高・粗利率）</div>
      <ChartsMixedChart :data="consolidatedChartData" :options="consolidatedChartOptions" />
    </div>

    <!-- 月次データテーブル -->
    <CommonDataTable
      title="月次業績データ"
      :columns="tableColumns"
      :rows="tableRows"
      :page-size="12"
    />
  </div>
</template>
