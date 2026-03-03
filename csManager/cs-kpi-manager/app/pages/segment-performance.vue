<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { getCurrentFiscalYear, formatFiscalYear, getElapsedMonths } from '~/utils/fiscalYear'
import type { ChartData } from 'chart.js'

const { loadData, loaded } = useDataset()
const { loadSegmentConfigs, getConfig } = useSegments()
const { getSegmentMetrics } = useSegmentPerformance()

await loadData()

onMounted(() => {
  loadSegmentConfigs()
})

const selectedFY = ref(getCurrentFiscalYear())
const selectedStage = ref<'won' | 'all'>('won')

const config = computed(() => getConfig(selectedFY.value))
const hasSegments = computed(() => (config.value?.segments.length ?? 0) > 0)
const metrics = computed(() => getSegmentMetrics(selectedFY.value, selectedStage.value))
const pacePercent = computed(() => (getElapsedMonths(selectedFY.value) / 12) * 100)

// Chart data
const barChartData = computed<ChartData<'bar'>>(() => ({
  labels: metrics.value.map(m => m.segmentName),
  datasets: [
    {
      label: 'YTD 売上高',
      data: metrics.value.map(m => m.ytdRevenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: 'YTD 粗利高',
      data: metrics.value.map(m => m.ytdGrossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// Table columns
const tableColumns = [
  { key: 'segmentName', label: 'セグメント', sortable: true },
  { key: 'ytdRevenue', label: 'YTD 売上高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'ytdGrossProfit', label: 'YTD 粗利高', align: 'right' as const, format: (v: number) => formatCurrency(v) },
  { key: 'ytdGrossProfitRate', label: '粗利率', align: 'right' as const, format: (v: number) => formatPercent(v) },
  { key: 'ytdDealCount', label: '案件数', align: 'right' as const },
  { key: 'yoyRevenueChange', label: '売上YoY', align: 'right' as const, format: (v: number) => v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%` },
  { key: 'yoyGpChange', label: '粗利YoY', align: 'right' as const, format: (v: number) => v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%` },
]

const tableRows = computed(() => metrics.value.map(m => ({ ...m })))

function yoyArrow(val: number): string {
  if (val > 0) return '↑'
  if (val < 0) return '↓'
  return '→'
}

function yoyColor(val: number): string {
  if (val > 0) return 'var(--color-success)'
  if (val < 0) return 'var(--color-error)'
  return 'var(--color-text-subtle)'
}

function paceStatusColor(status: 'success' | 'warning' | 'error'): string {
  switch (status) {
    case 'success': return 'var(--color-success)'
    case 'warning': return 'var(--color-warning)'
    case 'error': return 'var(--color-error)'
  }
}
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>事業セグメント別業績</h2>
      <p>セグメントごとのYTD業績・目標進捗・昨対比を表示します</p>
    </div>

    <!-- フィルター -->
    <CommonFilterBar
      v-model:fiscal-year="selectedFY"
      v-model:stage="selectedStage"
      :show-period-filter="false"
      :show-staff-filter="false"
    />

    <!-- セグメント未設定時の案内 -->
    <div v-if="!hasSegments" class="info-banner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span>
        セグメントが設定されていません。
        <NuxtLink to="/segments" style="color: var(--color-primary);">事業セグメント設定</NuxtLink>
        からセグメントの登録とマッピングを行ってください。
      </span>
    </div>

    <template v-if="hasSegments && metrics.length > 0">
      <!-- セグメントカードグリッド -->
      <div class="segment-grid">
        <div v-for="m in metrics" :key="m.segmentId" class="segment-card">
          <div class="segment-card__header">
            <h3 class="segment-card__name">{{ m.segmentName }}</h3>
            <span class="segment-card__deals">{{ m.ytdDealCount }}件</span>
          </div>

          <!-- KPI値 -->
          <div class="segment-card__kpis">
            <div class="segment-kpi">
              <span class="segment-kpi__label">YTD 売上高</span>
              <span class="segment-kpi__value">{{ formatCurrency(m.ytdRevenue) }}</span>
              <span class="segment-kpi__yoy" :style="{ color: yoyColor(m.yoyRevenueChange) }">
                {{ yoyArrow(m.yoyRevenueChange) }} {{ m.yoyRevenueChange > 0 ? '+' : '' }}{{ m.yoyRevenueChange.toFixed(1) }}%
              </span>
            </div>
            <div class="segment-kpi">
              <span class="segment-kpi__label">YTD 粗利高</span>
              <span class="segment-kpi__value">{{ formatCurrency(m.ytdGrossProfit) }}</span>
              <span class="segment-kpi__yoy" :style="{ color: yoyColor(m.yoyGpChange) }">
                {{ yoyArrow(m.yoyGpChange) }} {{ m.yoyGpChange > 0 ? '+' : '' }}{{ m.yoyGpChange.toFixed(1) }}%
              </span>
            </div>
            <div class="segment-kpi">
              <span class="segment-kpi__label">YTD 粗利率</span>
              <span class="segment-kpi__value">{{ formatPercent(m.ytdGrossProfitRate) }}</span>
            </div>
          </div>

          <!-- 売上進捗バー -->
          <div v-if="m.revenueTarget > 0" class="progress-section">
            <div class="progress-header">
              <span class="progress-label">売上進捗</span>
              <span class="progress-percent">{{ m.revenueProgress.toFixed(1) }}%</span>
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: Math.min(m.revenueProgress, 100) + '%', backgroundColor: paceStatusColor(m.revenuePaceStatus) }"
              ></div>
              <div
                class="progress-pace-marker"
                :style="{ left: Math.min(pacePercent, 100) + '%' }"
                :title="`経過月ペース: ${pacePercent.toFixed(1)}%`"
              >
                <span class="pace-marker-icon">&#x25BC;</span>
              </div>
            </div>
            <div class="progress-labels">
              <span>{{ formatCurrency(m.ytdRevenue) }}</span>
              <span>目標: {{ formatCurrency(m.revenueTarget) }}</span>
            </div>
          </div>

          <!-- 粗利進捗バー -->
          <div v-if="m.grossProfitTarget > 0" class="progress-section">
            <div class="progress-header">
              <span class="progress-label">粗利進捗</span>
              <span class="progress-percent">{{ m.gpProgress.toFixed(1) }}%</span>
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar"
                :style="{ width: Math.min(m.gpProgress, 100) + '%', backgroundColor: paceStatusColor(m.gpPaceStatus) }"
              ></div>
              <div
                class="progress-pace-marker"
                :style="{ left: Math.min(pacePercent, 100) + '%' }"
                :title="`経過月ペース: ${pacePercent.toFixed(1)}%`"
              >
                <span class="pace-marker-icon">&#x25BC;</span>
              </div>
            </div>
            <div class="progress-labels">
              <span>{{ formatCurrency(m.ytdGrossProfit) }}</span>
              <span>目標: {{ formatCurrency(m.grossProfitTarget) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 比較テーブル -->
      <CommonDataTable
        title="セグメント比較"
        :columns="tableColumns"
        :rows="tableRows"
        :page-size="20"
      />

      <!-- 比較棒グラフ -->
      <div class="chart-card mt-lg">
        <div class="chart-card__title">セグメント別 売上・粗利比較</div>
        <ChartsBarChart :data="barChartData" />
      </div>
    </template>
  </div>
</template>

<style scoped>
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

.segment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.segment-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.segment-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border);
}

.segment-card__name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text);
}

.segment-card__deals {
  font-size: 0.75rem;
  color: var(--color-text-subtle);
  background: var(--color-bg);
  padding: 2px 8px;
  border-radius: 12px;
}

.segment-card__kpis {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.segment-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.segment-kpi__label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.segment-kpi__value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text);
}

.segment-kpi__yoy {
  font-size: 0.75rem;
  font-weight: 500;
}

/* 進捗バー */
.progress-section {
  margin-bottom: var(--space-sm);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--color-text-subtle);
}

.progress-percent {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.progress-bar-container {
  position: relative;
  height: 20px;
  background: #F4F5F7;
  border-radius: 10px;
  overflow: visible;
}

.progress-bar {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
  min-width: 2px;
}

.progress-pace-marker {
  position: absolute;
  top: -6px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.pace-marker-icon {
  font-size: 10px;
  color: var(--color-text);
  line-height: 1;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 0.6875rem;
  color: var(--color-text-subtle);
}

.mt-lg {
  margin-top: var(--space-lg);
}
</style>
