<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { getCurrentFiscalYear } from '~/utils/fiscalYear'

const { loadData, loaded, uniqueCsReps } = useDataset()
const { loadCsReps, getCsRepByName } = useCsReps()
const { getRepKpiSummary } = useRepReport()

await loadData()
onMounted(() => {
  loadCsReps()
})

const fy = ref(getCurrentFiscalYear())

// 全業務担当者のYTDサマリー行を生成
const tableRows = computed(() =>
  uniqueCsReps.value.map((name) => {
    const kpi = getRepKpiSummary(fy.value, name)
    const repInfo = getCsRepByName(name)
    return {
      name,
      team: repInfo?.team || '―',
      grade: repInfo?.grade || '―',
      ytdRevenue: kpi.ytdRevenue,
      ytdGrossProfit: kpi.ytdGrossProfit,
      ytdGrossProfitRate: kpi.ytdGrossProfitRate,
      ytdDealCount: kpi.ytdDealCount,
    }
  }),
)

const tableColumns = [
  { key: 'name', label: '担当者名', sortable: true },
  { key: 'team', label: 'チーム', sortable: true },
  { key: 'grade', label: 'グレード', sortable: true },
  { key: 'ytdRevenue', label: 'YTD売上高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'ytdGrossProfit', label: 'YTD粗利高', align: 'right' as const, sortable: true, format: (v: number) => formatCurrency(v) },
  { key: 'ytdGrossProfitRate', label: 'YTD粗利率', align: 'right' as const, sortable: true, format: (v: number) => formatPercent(v) },
  { key: 'ytdDealCount', label: 'YTD案件数', align: 'right' as const, sortable: true },
  { key: 'action', label: '', sortable: false },
]
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>業務担当者別レポート</h2>
      <p>業務担当者ごとの業績サマリーと詳細レポートへのリンク</p>
    </div>

    <!-- フィルター -->
    <CommonFilterBar
      v-model:fiscal-year="fy"
      :show-stage-filter="false"
      :show-period-filter="false"
    />

    <!-- 業務担当者一覧テーブル -->
    <div class="data-table-wrapper">
      <div class="data-table-header">
        <span class="data-table-title">業務担当者一覧（{{ tableRows.length }}名）</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>担当者名</th>
            <th>チーム</th>
            <th>グレード</th>
            <th class="text-right">YTD売上高</th>
            <th class="text-right">YTD粗利高</th>
            <th class="text-right">YTD粗利率</th>
            <th class="text-right">YTD案件数</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.name">
            <td style="font-weight: 500;">{{ row.name }}</td>
            <td>{{ row.team }}</td>
            <td>{{ row.grade }}</td>
            <td class="text-right">{{ formatCurrency(row.ytdRevenue) }}</td>
            <td class="text-right">{{ formatCurrency(row.ytdGrossProfit) }}</td>
            <td class="text-right">{{ formatPercent(row.ytdGrossProfitRate) }}</td>
            <td class="text-right">{{ row.ytdDealCount }}件</td>
            <td>
              <NuxtLink
                :to="`/staff-report/${encodeURIComponent(row.name)}`"
                class="btn btn--default btn--sm"
              >
                レポート詳細 &rarr;
              </NuxtLink>
            </td>
          </tr>
          <tr v-if="tableRows.length === 0">
            <td colspan="8" style="text-align: center; padding: 32px; color: var(--color-text-subtle);">
              業務担当者のデータがありません
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
