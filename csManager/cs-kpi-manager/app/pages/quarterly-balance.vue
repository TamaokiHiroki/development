<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import type { ChartData, ChartOptions } from 'chart.js'

const { loadData, loaded } = useDataset()
const { loadGoals } = useGoals()
const { getQuarterlyData, getBalanceSheetRows, getGoalAchievement, getCurrentQuarter } = useQuarterlyBalance()

await loadData()

const fy = ref(2026)
const stage = ref<'won' | 'all'>('won')

onMounted(() => {
  loadGoals()
})

const quarterlyData = computed(() => getQuarterlyData(fy.value, stage.value))
const balanceRows = computed(() => getBalanceSheetRows(quarterlyData.value))

const ytdRevenue = computed(() => quarterlyData.value.reduce((s, q) => s + q.revenue, 0))
const ytdGrossProfit = computed(() => quarterlyData.value.reduce((s, q) => s + q.grossProfit, 0))
const ytdGrossProfitRate = computed(() => ytdRevenue.value !== 0 ? ytdGrossProfit.value / ytdRevenue.value : 0)

const goalAchievement = computed(() => getGoalAchievement(fy.value, ytdRevenue.value, ytdGrossProfit.value))

const currentQuarter = getCurrentQuarter()

function formatCell(row: { format: string }, value: number): string {
  if (row.format === 'currency') return formatCurrency(value)
  if (row.format === 'percent') return formatPercent(value)
  if (row.format === 'count') return value.toLocaleString('ja-JP')
  return String(value)
}

function getGprColor(rate: number): string {
  if (rate >= 0.3) return 'var(--color-success)'
  if (rate >= 0.15) return 'var(--color-warning)'
  return 'var(--color-error)'
}

function isQuarterDimmed(q: number): boolean {
  const qData = quarterlyData.value[q]
  return !qData.isConfirmed && !qData.isPartial
}

// チャート1: 売上高 vs 外注費
const revenueVsCostChartData = computed<ChartData<'bar'>>(() => ({
  labels: quarterlyData.value.map((q) => q.quarterLabel),
  datasets: [
    {
      label: '売上高',
      data: quarterlyData.value.map((q) => q.revenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: '外注費',
      data: quarterlyData.value.map((q) => q.outsourcingCost),
      backgroundColor: '#FF5630',
      borderRadius: 4,
    },
  ],
}))

// チャート2: 粗利高推移
const gpChartData = computed<ChartData<'bar'>>(() => ({
  labels: quarterlyData.value.map((q) => q.quarterLabel),
  datasets: [
    {
      label: '粗利高',
      data: quarterlyData.value.map((q) => q.grossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// チャート3: 粗利率推移
const gprChartData = computed<ChartData<'bar'>>(() => ({
  labels: quarterlyData.value.map((q) => q.quarterLabel),
  datasets: [
    {
      label: '粗利率',
      data: quarterlyData.value.map((q) => q.grossProfitRate * 100),
      backgroundColor: quarterlyData.value.map((q) =>
        q.grossProfitRate >= 0.3 ? '#36B37E' : q.grossProfitRate >= 0.15 ? '#FFAB00' : '#FF5630',
      ),
      borderRadius: 4,
    },
  ],
}))

const gprChartOptions = computed<ChartOptions<'bar'>>(() => ({
  scales: {
    y: {
      ticks: {
        callback: (v) => `${v}%`,
      },
    },
  },
}))

// 詳細テーブル
const detailColumns = [
  { key: 'quarterLabel', label: '四半期', sortable: false },
  { key: 'period', label: '期間', sortable: false },
  { key: 'status', label: 'ステータス', sortable: false },
  { key: 'revenue', label: '売上高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'outsourcingCost', label: '外注費', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const },
]

const detailRows = computed(() =>
  quarterlyData.value.map((q) => {
    const startMonth = q.months[0].split('/').map(Number)
    const endMonth = q.months[2].split('/').map(Number)
    return {
      quarterLabel: q.quarterLabel,
      period: `${startMonth[0]}年${startMonth[1]}月〜${endMonth[0]}年${endMonth[1]}月`,
      status: q.isConfirmed ? '確定' : q.isPartial ? '一部確定' : '未確定',
      revenue: q.revenue,
      outsourcingCost: q.outsourcingCost,
      grossProfit: q.grossProfit,
      grossProfitRate: q.grossProfitRate,
      dealCount: q.dealCount,
    }
  }),
)
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>四半期別バランスシート</h2>
      <p>四半期ごとの収入・支出・損益を簡易バランスシート形式で表示します</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      v-model:stage="stage"
      :show-period-filter="false"
    />

    <!-- KPI サマリー -->
    <div class="kpi-grid">
      <KpiCard
        label="YTD 売上高"
        :value="formatCurrency(ytdRevenue)"
      />
      <KpiCard
        label="YTD 粗利高"
        :value="formatCurrency(ytdGrossProfit)"
      />
      <KpiCard
        label="YTD 粗利率"
        :value="formatPercent(ytdGrossProfitRate)"
      />
      <KpiCard
        v-if="goalAchievement"
        label="目標達成率（売上）"
        :value="formatPercent(goalAchievement.revenueRate)"
      />
    </div>

    <!-- バランスシートテーブル -->
    <div class="data-table-wrapper" style="margin-top: var(--space-lg);">
      <div class="table-title">簡易バランスシート</div>
      <table class="balance-sheet-table">
        <thead>
          <tr>
            <th class="bs-col-label">勘定科目</th>
            <th
              v-for="q in quarterlyData"
              :key="q.quarter"
              class="bs-col-value"
              :class="{ 'bs-dimmed': isQuarterDimmed(q.quarter - 1) }"
            >
              {{ q.quarterLabel }}
              <span v-if="q.isPartial" class="bs-badge bs-badge--partial">一部確定</span>
              <span v-else-if="!q.isConfirmed" class="bs-badge bs-badge--unconfirmed">未確定</span>
            </th>
            <th class="bs-col-value bs-col-ytd">YTD</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in balanceRows"
            :key="idx"
            :class="{
              'bs-header-row': row.isHeader,
              'bs-summary-row': row.isSummary,
            }"
          >
            <td class="bs-col-label" :class="{ 'bs-indent': !row.isHeader }">
              {{ row.label }}
            </td>
            <template v-if="!row.isHeader">
              <td
                v-for="qKey in (['q1', 'q2', 'q3', 'q4'] as const)"
                :key="qKey"
                class="bs-col-value"
                :class="{ 'bs-dimmed': isQuarterDimmed(Number(qKey.slice(1)) - 1) }"
                :style="row.format === 'percent' ? { color: getGprColor(row[qKey]) } : {}"
              >
                {{ formatCell(row, row[qKey]) }}
              </td>
              <td
                class="bs-col-value bs-col-ytd"
                :style="row.format === 'percent' ? { color: getGprColor(row.ytd) } : {}"
              >
                {{ formatCell(row, row.ytd) }}
              </td>
            </template>
            <template v-else>
              <td v-for="i in 5" :key="i" class="bs-col-value" />
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- チャート -->
    <div class="chart-grid" style="margin-top: var(--space-lg);">
      <div class="chart-card">
        <div class="chart-card__title">売上高 vs 外注費（四半期別）</div>
        <ChartsBarChart :data="revenueVsCostChartData" />
      </div>
      <div class="chart-card">
        <div class="chart-card__title">粗利高推移（四半期別）</div>
        <ChartsBarChart :data="gpChartData" />
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">粗利率推移（四半期別）</div>
        <ChartsBarChart :data="gprChartData" :options="gprChartOptions" />
      </div>
    </div>

    <!-- 四半期別詳細データ -->
    <CommonDataTable
      title="四半期別詳細データ"
      :columns="detailColumns"
      :rows="detailRows"
      :page-size="4"
    />
  </div>
</template>

<style scoped>
.table-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  padding: var(--space-md);
  border-bottom: 1px solid var(--color-border);
}

.balance-sheet-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.balance-sheet-table th,
.balance-sheet-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
}

.balance-sheet-table thead th {
  background: var(--color-bg);
  font-weight: 600;
  color: var(--color-text-subtle);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bs-col-label {
  text-align: left;
  min-width: 140px;
}

.bs-col-value {
  text-align: right;
  min-width: 120px;
  font-variant-numeric: tabular-nums;
}

.bs-col-ytd {
  font-weight: 600;
  background: rgba(0, 82, 204, 0.03);
}

.bs-indent {
  padding-left: 32px !important;
}

.bs-header-row {
  background: var(--color-bg);
}

.bs-header-row td {
  font-weight: 700;
  color: var(--color-text);
  font-size: 13px;
}

.bs-summary-row td {
  font-weight: 700;
  border-top: 2px solid var(--color-text);
}

.bs-dimmed {
  opacity: 0.4;
}

.bs-badge {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  margin-left: 4px;
  font-weight: 500;
  vertical-align: middle;
}

.bs-badge--partial {
  background: rgba(255, 171, 0, 0.15);
  color: var(--color-warning);
}

.bs-badge--unconfirmed {
  background: rgba(107, 119, 140, 0.1);
  color: var(--color-text-subtle);
}
</style>
