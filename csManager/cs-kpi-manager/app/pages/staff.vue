<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import type { ChartData } from 'chart.js'

const { loadData, loaded } = useDataset()
const { getSalesRepMetrics, getCsRepMetrics, getStaffList } = useStaffMetrics()

await loadData()

const fy = ref(2026)
const stage = ref<'won' | 'all'>('won')

const salesReps = computed(() => getSalesRepMetrics(fy.value, stage.value))
const csReps = computed(() => getCsRepMetrics(fy.value, stage.value))

// 営業担当チャート
const salesChartData = computed<ChartData<'bar'>>(() => ({
  labels: salesReps.value.map((r) => r.name),
  datasets: [
    {
      label: '売上高',
      data: salesReps.value.map((r) => r.revenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: '粗利高',
      data: salesReps.value.map((r) => r.grossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// CS担当チャート
const csChartData = computed<ChartData<'bar'>>(() => ({
  labels: csReps.value.map((r) => r.name),
  datasets: [
    {
      label: '売上高',
      data: csReps.value.map((r) => r.revenue),
      backgroundColor: '#0052CC',
      borderRadius: 4,
    },
    {
      label: '粗利高',
      data: csReps.value.map((r) => r.grossProfit),
      backgroundColor: '#36B37E',
      borderRadius: 4,
    },
  ],
}))

// テーブル列定義
const staffColumns = [
  { key: 'name', label: '担当者', sortable: true },
  { key: 'revenue', label: '売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfit', label: '粗利高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'grossProfitRate', label: '粗利率', align: 'right' as const, sortable: true, format: (v: number) => formatPercent(v) },
  { key: 'dealCount', label: '案件数', align: 'right' as const, sortable: true },
]
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>営業担当別パフォーマンス</h2>
      <p>営業担当・業務担当ごとの業績を比較します</p>
    </div>

    <CommonFilterBar
      v-model:fiscal-year="fy"
      v-model:stage="stage"
      :show-period-filter="false"
    />

    <!-- 営業担当 -->
    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-md);">営業担当（商談の担当者）</h3>

    <div class="chart-grid mb-lg">
      <div class="chart-card">
        <div class="chart-card__title">営業担当別 売上・粗利</div>
        <ChartsBarChart :data="salesChartData" />
      </div>
    </div>

    <div class="mb-lg">
      <CommonDataTable
        title="営業担当パフォーマンス"
        :columns="staffColumns"
        :rows="salesReps"
        :page-size="10"
      />
    </div>

    <!-- 業務担当 -->
    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: var(--space-md);">業務担当</h3>

    <div class="chart-grid mb-lg">
      <div class="chart-card">
        <div class="chart-card__title">業務担当別 売上・粗利</div>
        <ChartsBarChart :data="csChartData" />
      </div>
    </div>

    <CommonDataTable
      title="業務担当パフォーマンス"
      :columns="staffColumns"
      :rows="csReps"
      :page-size="10"
    />
  </div>
</template>
