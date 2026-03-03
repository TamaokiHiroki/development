<script setup lang="ts">
import { formatCurrency, formatPercent, formatTrend } from '~/utils/formatters'
import { formatMonthShort, formatMonth, getLatestConfirmedMonth } from '~/utils/fiscalYear'
import type { ChartData, ChartOptions } from 'chart.js'

const { loadData, loaded } = useDataset()
const { getMonthlyMrr, getNrrData, getCurrentMrr, getMonthlyDealList, MRR_TYPES } = useMrr()

await loadData()

const fy = ref(2026)
const stage = ref<'won' | 'all'>('won')
const currentMonth = getLatestConfirmedMonth()

const mrrSummary = computed(() => getCurrentMrr(fy.value, currentMonth))
const monthlyMrr = computed(() => getMonthlyMrr(fy.value, stage.value))
const nrrData = computed(() => getNrrData(fy.value))

const mrrMomTrend = computed(() => formatTrend(mrrSummary.value.current, mrrSummary.value.previous))

const avgNrr = computed(() => {
  const values = nrrData.value.filter((d) => d.baseMrr > 0)
  if (values.length === 0) return 0
  return values.reduce((s, d) => s + d.nrr, 0) / values.length
})

// 月別ドリルダウン
const selectedMonth = ref<string | null>(null)

const selectedMonthDeals = computed(() => {
  if (!selectedMonth.value) return []
  return getMonthlyDealList(fy.value, selectedMonth.value, stage.value)
})

const selectedMonthSummary = computed(() => {
  if (!selectedMonth.value) return null
  const deals = selectedMonthDeals.value
  const totalRevenue = deals.reduce((s, d) => s + d.totalAmount, 0)
  const totalGP = deals.reduce((s, d) => s + d.grossProfit, 0)
  return {
    dealCount: deals.length,
    totalRevenue,
    totalGP,
    grossProfitRate: totalRevenue !== 0 ? totalGP / totalRevenue : 0,
  }
})

function toggleMonth(month: string) {
  // monthlyMrr のmonthから元のYYYY/MM形式を取得
  const entry = monthlyMrr.value.find((m) => formatMonthShort(m.month) === month)
  if (!entry) return
  selectedMonth.value = selectedMonth.value === entry.month ? null : entry.month
}

// MRR推移チャート
const mrrChartData = computed<ChartData<'bar'>>(() => ({
  labels: monthlyMrr.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: 'MRR',
      data: monthlyMrr.value.map((m) => m.mrr),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
  ],
}))

// NRR推移チャート
const nrrChartData = computed<ChartData<'line'>>(() => ({
  labels: nrrData.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: '売上継続率（NRR）',
      data: nrrData.value.map((m) => m.nrr * 100),
      borderColor: '#0052CC',
      backgroundColor: 'rgba(0, 82, 204, 0.1)',
      fill: true,
      tension: 0.3,
    },
    {
      label: '100%ライン',
      data: nrrData.value.map(() => 100),
      borderColor: '#6B778C',
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
    },
  ],
}))

const nrrChartOptions: ChartOptions<'line'> = {
  scales: {
    y: {
      ticks: {
        callback: (v) => `${v}%`,
      },
    },
  },
}

// NRR構成要素チャート（日本語ラベル）
const nrrComponentChartData = computed<ChartData<'bar'>>(() => ({
  labels: nrrData.value.map((m) => formatMonthShort(m.month)),
  datasets: [
    {
      label: '拡大（Expansion）',
      data: nrrData.value.map((m) => m.expansion),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
    {
      label: '縮小（Contraction）',
      data: nrrData.value.map((m) => -m.contraction),
      backgroundColor: '#FFAB00',
      borderRadius: 4,
    },
    {
      label: '解約（Churn）',
      data: nrrData.value.map((m) => -m.churn),
      backgroundColor: '#FF5630',
      borderRadius: 4,
    },
  ],
}))

const nrrComponentChartOptions: ChartOptions<'bar'> = {
  scales: {
    x: { stacked: true },
    y: { stacked: true },
  },
}

// 案件詳細テーブル
const dealDetailColumns = [
  { key: 'dealName', label: '商談名', sortable: true },
  { key: 'accountName', label: '取引先名', sortable: true },
  { key: 'type', label: '種類', sortable: true },
  { key: 'totalAmount', label: '総額', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'csRep', label: '業務担当', sortable: true },
  { key: 'salesRep', label: '営業担当', sortable: true },
]

const dealDetailRows = computed(() =>
  selectedMonthDeals.value.map((d) => ({
    dealName: d.dealName,
    accountName: d.accountName,
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
      <h2>MRR・NRR</h2>
      <p>月次経常収益（MRR）とネット売上継続率（NRR）を分析します</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      v-model:stage="stage"
      :show-period-filter="false"
    />

    <div class="mrr-types-note">
      MRR対象種類: {{ MRR_TYPES.join('、') }}
    </div>

    <!-- KPIカード -->
    <div class="kpi-grid">
      <KpiCard
        label="当月MRR"
        :value="formatCurrency(mrrSummary.current)"
        :trend-text="mrrMomTrend.text"
        :trend-direction="mrrMomTrend.direction"
        :trend-color="mrrMomTrend.color"
        trend-label="前月比"
      />
      <KpiCard
        label="前月MRR"
        :value="formatCurrency(mrrSummary.previous)"
      />
      <KpiCard
        label="MRR顧客数"
        :value="`${mrrSummary.customerCount}社`"
      />
      <KpiCard
        label="平均NRR（売上継続率）"
        :value="formatPercent(avgNrr)"
        :trend-text="avgNrr >= 1 ? '健全' : '注意'"
        :trend-direction="avgNrr >= 1 ? 'up' : 'down'"
        :trend-color="avgNrr >= 1 ? 'var(--color-success)' : 'var(--color-warning)'"
      />
    </div>

    <!-- チャート -->
    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">MRR 月次推移</div>
        <ChartsBarChart :data="mrrChartData" />
      </div>
      <div class="chart-card">
        <div class="chart-card__title">NRR（売上継続率）月次推移</div>
        <ChartsLineChart :data="nrrChartData" :options="nrrChartOptions" />
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-card__title">NRR構成要素（拡大 / 縮小 / 解約）</div>
        <ChartsBarChart :data="nrrComponentChartData" :options="nrrComponentChartOptions" />
      </div>
    </div>

    <!-- MRR月次テーブル（ドリルダウン対応） -->
    <div class="mrr-table-section">
      <h3 class="section-title">月次MRRデータ</h3>
      <p class="section-desc">月をクリックすると、該当月の案件詳細を表示します</p>

      <div class="data-table-wrapper">
        <div class="data-table-header">
          <span class="data-table-title">MRR月次データ</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>月</th>
              <th class="text-right">MRR</th>
              <th class="text-right">顧客数</th>
              <th class="text-right">前月比</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, idx) in monthlyMrr" :key="row.month">
              <tr
                class="mrr-row"
                :class="{ 'mrr-row--selected': selectedMonth === row.month }"
                @click="toggleMonth(formatMonthShort(row.month))"
              >
                <td>
                  <span class="month-link">{{ formatMonthShort(row.month) }}</span>
                </td>
                <td class="text-right">{{ formatCurrency(row.mrr) }}</td>
                <td class="text-right">{{ row.customerCount }}社</td>
                <td class="text-right">
                  <template v-if="idx > 0 && monthlyMrr[idx - 1].mrr > 0">
                    <span :style="{ color: formatTrend(row.mrr, monthlyMrr[idx - 1].mrr).color }">
                      {{ formatTrend(row.mrr, monthlyMrr[idx - 1].mrr).text }}
                    </span>
                  </template>
                  <template v-else>
                    <span style="color: var(--color-text-subtle);">-</span>
                  </template>
                </td>
                <td class="text-right">
                  <span class="drill-icon" :class="{ 'drill-icon--open': selectedMonth === row.month }">
                    &#9654;
                  </span>
                </td>
              </tr>
              <!-- ドリルダウン: 月次案件詳細 -->
              <tr v-if="selectedMonth === row.month" class="drill-down-row">
                <td colspan="5" class="drill-down-cell">
                  <div class="drill-down-panel">
                    <div class="drill-down-header">
                      <h4>{{ formatMonth(selectedMonth) }} の案件詳細</h4>
                      <div v-if="selectedMonthSummary" class="drill-down-summary">
                        <span>案件数: <strong>{{ selectedMonthSummary.dealCount }}件</strong></span>
                        <span>売上高: <strong>{{ formatCurrency(selectedMonthSummary.totalRevenue) }}</strong></span>
                        <span>粗利高: <strong>{{ formatCurrency(selectedMonthSummary.totalGP) }}</strong></span>
                        <span>粗利率: <strong>{{ formatPercent(selectedMonthSummary.grossProfitRate) }}</strong></span>
                      </div>
                    </div>
                    <CommonDataTable
                      :columns="dealDetailColumns"
                      :rows="dealDetailRows"
                      :page-size="10"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mrr-types-note {
  margin-bottom: var(--space-md);
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--color-text-subtle);
  margin-bottom: var(--space-md);
}

.mrr-table-section {
  margin-top: var(--space-lg);
}

.mrr-row {
  cursor: pointer;
  transition: background 0.1s;
}

.mrr-row:hover {
  background: var(--color-background);
}

.mrr-row--selected {
  background: #F4F5F7;
}

.month-link {
  color: var(--color-primary);
  font-weight: 500;
}

.drill-icon {
  display: inline-block;
  font-size: 0.625rem;
  color: var(--color-text-subtle);
  transition: transform 0.15s;
}

.drill-icon--open {
  transform: rotate(90deg);
}

.drill-down-row {
  background: var(--color-background);
}

.drill-down-cell {
  padding: 0 !important;
}

.drill-down-panel {
  padding: var(--space-md) var(--space-lg);
  border-top: 2px solid var(--color-primary);
}

.drill-down-header {
  margin-bottom: var(--space-md);
}

.drill-down-header h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-text);
}

.drill-down-summary {
  display: flex;
  gap: var(--space-lg);
  font-size: 0.875rem;
  color: var(--color-text-subtle);
  flex-wrap: wrap;
}

.drill-down-summary strong {
  color: var(--color-text);
}
</style>
