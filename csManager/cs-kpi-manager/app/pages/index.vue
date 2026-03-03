<script setup lang="ts">
import { formatCurrency, formatPercent, formatTrend, formatCompact } from '~/utils/formatters'
import { getLatestConfirmedMonth, getFiscalYear, formatMonthShort } from '~/utils/fiscalYear'
import type { ChartData } from 'chart.js'

const { loadData, loaded } = useDataset()
const { getKpiSummary, getMonthlyData } = usePerformance()
const { getUnitEconomics } = useUnitEconomics()
const { getCurrentMrr, getMonthlyMrr } = useMrr()
const { getSalesRepMetrics } = useStaffMetrics()

await loadData()

const fy = ref(2026)
const currentMonth = computed(() => {
  const latestConfirmed = getLatestConfirmedMonth()
  const latestFY = getFiscalYear(latestConfirmed)
  if (fy.value === latestFY) return latestConfirmed
  if (fy.value < latestFY) {
    // 過去FY → 期末月を返す
    return `${fy.value}/08`
  }
  // 未来FY → 期首月
  return `${fy.value - 1}/09`
})

const summary = computed(() => getKpiSummary(fy.value, 'won', currentMonth.value))
const ue = computed(() => getUnitEconomics(fy.value))
const mrr = computed(() => getCurrentMrr(fy.value, currentMonth.value))

const ltvCacStatus = computed(() => {
  const ratio = ue.value.ltvCacRatio
  if (ratio >= 3) return { color: 'var(--color-success)', badge: 'badge--success', label: '健全' }
  if (ratio >= 1) return { color: 'var(--color-warning)', badge: 'badge--warning', label: '注意' }
  return { color: 'var(--color-error)', badge: 'badge--error', label: '危険' }
})

const mrrTrend = computed(() => formatTrend(mrr.value.current, mrr.value.previous))

// 売上推移チャート
const revenueChartData = computed<ChartData<'line'>>(() => {
  const monthly = getMonthlyData(fy.value, 'won')
  return {
    labels: monthly.map((m) => formatMonthShort(m.month)),
    datasets: [
      {
        label: '売上高',
        data: monthly.map((m) => m.revenue),
        borderColor: '#0052CC',
        backgroundColor: 'rgba(0, 82, 204, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: '粗利高',
        data: monthly.map((m) => m.grossProfit),
        borderColor: '#36B37E',
        backgroundColor: 'rgba(54, 179, 126, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }
})

// MRR推移チャート
const mrrChartData = computed<ChartData<'bar'>>(() => {
  const mrrMonthly = getMonthlyMrr(fy.value, 'won')
  return {
    labels: mrrMonthly.map((m) => formatMonthShort(m.month)),
    datasets: [
      {
        label: 'MRR',
        data: mrrMonthly.map((m) => m.mrr),
        backgroundColor: '#0052CC',
        borderRadius: 4,
      },
    ],
  }
})

// 担当別ランキング Top 5
const topSalesReps = computed(() => getSalesRepMetrics(fy.value, 'won').slice(0, 5))
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>ダッシュボード</h2>
      <p>CS事業部 KPI サマリー - FY{{ fy }}</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      :show-period-filter="false"
      :show-stage-filter="false"
    />

    <!-- KPIサマリーカード -->
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
        label="当月粗利率"
        :value="formatPercent(summary.currentMonth.grossProfitRate)"
        :trend-text="summary.mom.grossProfitRate.text"
        :trend-direction="summary.mom.grossProfitRate.direction"
        :trend-color="summary.mom.grossProfitRate.color"
        trend-label="前月比"
      />
      <KpiCard
        label="LTV/CAC比"
        :value="ue.ltvCacRatio.toFixed(1)"
        :trend-text="ltvCacStatus.label"
        :trend-direction="ue.ltvCacRatio >= 3 ? 'up' : ue.ltvCacRatio >= 1 ? 'flat' : 'down'"
        :trend-color="ltvCacStatus.color"
      />
      <KpiCard
        label="当月MRR"
        :value="formatCurrency(mrr.current)"
        :trend-text="mrrTrend.text"
        :trend-direction="mrrTrend.direction"
        :trend-color="mrrTrend.color"
        trend-label="前月比"
      />
    </div>

    <!-- チャート -->
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">売上・粗利 月次推移</div>
        <ChartsLineChart :data="revenueChartData" />
      </div>
      <div class="chart-card">
        <div class="chart-card__title">MRR 月次推移</div>
        <ChartsBarChart :data="mrrChartData" />
      </div>
    </div>

    <!-- 担当別ランキング -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">営業担当 売上ランキング（Top 5）</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>担当者</th>
            <th class="text-right">売上高</th>
            <th class="text-right">粗利高</th>
            <th class="text-right">案件数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(rep, idx) in topSalesReps" :key="rep.name">
            <td>{{ idx + 1 }}</td>
            <td>{{ rep.name }}</td>
            <td class="text-right">{{ formatCurrency(rep.revenue) }}</td>
            <td class="text-right">{{ formatCurrency(rep.grossProfit) }}</td>
            <td class="text-right">{{ rep.dealCount }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- YTD サマリー -->
    <div class="kpi-grid mt-md">
      <KpiCard
        label="YTD 売上高"
        :value="formatCurrency(summary.ytd.revenue)"
        :trend-text="summary.yoy.revenue.text"
        :trend-direction="summary.yoy.revenue.direction"
        :trend-color="summary.yoy.revenue.color"
        trend-label="前年同期比"
      />
      <KpiCard
        label="YTD 粗利高"
        :value="formatCurrency(summary.ytd.grossProfit)"
        :trend-text="summary.yoy.grossProfit.text"
        :trend-direction="summary.yoy.grossProfit.direction"
        :trend-color="summary.yoy.grossProfit.color"
        trend-label="前年同期比"
      />
    </div>
  </div>
  <div v-else style="display: flex; align-items: center; justify-content: center; height: 50vh; color: var(--color-text-subtle);">
    データを読み込み中...
  </div>
</template>
