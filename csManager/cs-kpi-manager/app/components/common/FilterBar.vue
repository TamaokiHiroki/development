<script setup lang="ts">
interface Props {
  fiscalYears?: number[]
  showPeriodFilter?: boolean
  showStageFilter?: boolean
  showStaffFilter?: boolean
  staffList?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  fiscalYears: () => [2026, 2025],
  showPeriodFilter: true,
  showStageFilter: true,
  showStaffFilter: false,
  staffList: () => [],
})

const selectedFY = defineModel<number>('fiscalYear', { default: 2026 })
const selectedPeriod = defineModel<string>('period', { default: 'monthly' })
const selectedStage = defineModel<string>('stage', { default: 'won' })
const selectedStaff = defineModel<string>('staff', { default: 'all' })
</script>

<template>
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">会計年度</span>
      <select v-model="selectedFY" class="filter-select">
        <option v-for="fy in fiscalYears" :key="fy" :value="fy">
          FY{{ fy }}
        </option>
      </select>
    </div>

    <div v-if="showPeriodFilter" class="filter-group">
      <span class="filter-label">期間</span>
      <select v-model="selectedPeriod" class="filter-select">
        <option value="monthly">月次</option>
        <option value="quarterly">四半期</option>
      </select>
    </div>

    <div v-if="showStageFilter" class="filter-group">
      <span class="filter-label">ステージ</span>
      <select v-model="selectedStage" class="filter-select">
        <option value="won">受注のみ</option>
        <option value="all">予定含む</option>
      </select>
    </div>

    <div v-if="showStaffFilter && staffList.length > 0" class="filter-group">
      <span class="filter-label">担当者</span>
      <select v-model="selectedStaff" class="filter-select">
        <option value="all">全員</option>
        <option v-for="s in staffList" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>
  </div>
</template>
