<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { getCurrentFiscalYear } from '~/utils/fiscalYear'

const { loadData, loaded } = useDataset()
const { getKpiSummary } = usePerformance()
const { goals, loadGoals, setGoal, deleteGoal, getGoal } = useGoals()
const { success: toastSuccess } = useToast()

await loadData()

onMounted(() => {
  loadGoals()
})

const selectedFY = ref(getCurrentFiscalYear())
const availableFYs = [2026, 2025, 2027]

// Form
const formRevenue = ref('')
const formGrossProfit = ref('')
const formError = ref('')

// Load existing goal when FY changes
watch(selectedFY, () => {
  loadFormFromGoal()
}, { immediate: true })

// Also reload when goals are loaded from localStorage
watch(() => goals.value.length, () => {
  loadFormFromGoal()
})

function loadFormFromGoal() {
  const existing = getGoal(selectedFY.value)
  if (existing) {
    formRevenue.value = existing.revenueTarget.toString()
    formGrossProfit.value = existing.grossProfitTarget.toString()
  } else {
    formRevenue.value = ''
    formGrossProfit.value = ''
  }
  formError.value = ''
}

function handleSave() {
  const revenue = parseInt(formRevenue.value.replace(/,/g, ''), 10)
  const gp = parseInt(formGrossProfit.value.replace(/,/g, ''), 10)

  if (isNaN(revenue) || revenue <= 0) {
    formError.value = '売上高目標を正しく入力してください'
    return
  }
  if (isNaN(gp) || gp <= 0) {
    formError.value = '粗利高目標を正しく入力してください'
    return
  }

  setGoal(selectedFY.value, revenue, gp)
  toastSuccess(`FY${selectedFY.value}の年度目標を保存しました`)
  formError.value = ''
}

function handleDelete() {
  if (confirm(`FY${selectedFY.value}の目標を削除しますか？`)) {
    deleteGoal(selectedFY.value)
    formRevenue.value = ''
    formGrossProfit.value = ''
    toastSuccess(`FY${selectedFY.value}の年度目標を削除しました`)
  }
}

// 実績との比較
const currentMonth = '2026/02'
const summary = computed(() => getKpiSummary(selectedFY.value, 'won', currentMonth))
const currentGoal = computed(() => getGoal(selectedFY.value))

const revenueProgress = computed(() => {
  if (!currentGoal.value || currentGoal.value.revenueTarget === 0) return null
  return summary.value.ytd.revenue / currentGoal.value.revenueTarget
})

const gpProgress = computed(() => {
  if (!currentGoal.value || currentGoal.value.grossProfitTarget === 0) return null
  return summary.value.ytd.grossProfit / currentGoal.value.grossProfitTarget
})
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>年度目標設定</h2>
      <p>会計年度ごとの売上高・粗利高の目標を設定します</p>
    </div>

    <!-- 年度選択 -->
    <div class="filter-bar">
      <div class="filter-group">
        <span class="filter-label">会計年度</span>
        <select v-model="selectedFY" class="filter-select">
          <option v-for="fy in availableFYs" :key="fy" :value="fy">FY{{ fy }}</option>
        </select>
      </div>
    </div>

    <!-- 目標設定フォーム -->
    <div class="card mb-lg">
      <div class="card-header">
        <span class="card-title">FY{{ selectedFY }} 年度目標</span>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">売上高目標（円）</label>
          <input
            v-model="formRevenue"
            type="text"
            class="form-input"
            placeholder="例: 300000000"
            inputmode="numeric"
          >
          <div class="form-hint">数値を入力してください（例: 3億円 → 300000000）</div>
        </div>
        <div class="form-group">
          <label class="form-label">粗利高目標（円）</label>
          <input
            v-model="formGrossProfit"
            type="text"
            class="form-input"
            placeholder="例: 150000000"
            inputmode="numeric"
          >
          <div class="form-hint">数値を入力してください（例: 1.5億円 → 150000000）</div>
        </div>
      </div>

      <div v-if="formError" class="form-error mb-md">{{ formError }}</div>

      <div style="display: flex; gap: var(--space-sm);">
        <button class="btn btn--primary" @click="handleSave">保存</button>
        <button
          v-if="currentGoal"
          class="btn btn--danger"
          @click="handleDelete"
        >
          削除
        </button>
      </div>
    </div>

    <!-- 目標一覧 -->
    <div class="data-table-wrapper mb-lg">
      <div class="data-table-header">
        <span class="data-table-title">登録済み年度目標</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>会計年度</th>
            <th class="text-right">売上高目標</th>
            <th class="text-right">粗利高目標</th>
            <th class="text-right">目標粗利率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="goal in goals" :key="goal.fiscalYear">
            <td style="font-weight: 500;">FY{{ goal.fiscalYear }}</td>
            <td class="text-right">{{ formatCurrency(goal.revenueTarget) }}</td>
            <td class="text-right">{{ formatCurrency(goal.grossProfitTarget) }}</td>
            <td class="text-right">
              {{ goal.revenueTarget > 0 ? formatPercent(goal.grossProfitTarget / goal.revenueTarget) : '―' }}
            </td>
          </tr>
          <tr v-if="goals.length === 0">
            <td colspan="4" style="text-align: center; padding: 24px; color: var(--color-text-subtle);">
              年度目標が登録されていません
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 進捗状況（目標が設定されている場合） -->
    <div v-if="currentGoal" class="card">
      <div class="card-header">
        <span class="card-title">FY{{ selectedFY }} 目標達成状況（YTD）</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-card__label">売上高 達成率</div>
          <div
            class="kpi-card__value"
            :style="{ color: revenueProgress && revenueProgress >= 0.5 ? 'var(--color-success)' : 'var(--color-warning)' }"
          >
            {{ revenueProgress ? formatPercent(revenueProgress) : '―' }}
          </div>
          <div class="kpi-card__trend">
            <span class="kpi-card__trend-label">
              {{ formatCurrency(summary.ytd.revenue) }} / {{ formatCurrency(currentGoal.revenueTarget) }}
            </span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-card__label">粗利高 達成率</div>
          <div
            class="kpi-card__value"
            :style="{ color: gpProgress && gpProgress >= 0.5 ? 'var(--color-success)' : 'var(--color-warning)' }"
          >
            {{ gpProgress ? formatPercent(gpProgress) : '―' }}
          </div>
          <div class="kpi-card__trend">
            <span class="kpi-card__trend-label">
              {{ formatCurrency(summary.ytd.grossProfit) }} / {{ formatCurrency(currentGoal.grossProfitTarget) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
