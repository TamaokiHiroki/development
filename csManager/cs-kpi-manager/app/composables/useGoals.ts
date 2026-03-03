const STORAGE_KEY = 'cs-kpi-goals'

export interface FiscalYearGoal {
  fiscalYear: number
  revenueTarget: number
  grossProfitTarget: number
}

const goals = ref<FiscalYearGoal[]>([])
const goalsLoaded = ref(false)

export function useGoals() {
  function loadGoals() {
    if (goalsLoaded.value || import.meta.server) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      goals.value = raw ? JSON.parse(raw) : []
    } catch {
      goals.value = []
    }
    goalsLoaded.value = true
  }

  function saveGoals() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals.value))
  }

  function setGoal(fiscalYear: number, revenueTarget: number, grossProfitTarget: number) {
    const idx = goals.value.findIndex((g) => g.fiscalYear === fiscalYear)
    if (idx !== -1) {
      goals.value[idx] = { fiscalYear, revenueTarget, grossProfitTarget }
    } else {
      goals.value.push({ fiscalYear, revenueTarget, grossProfitTarget })
    }
    saveGoals()
  }

  function getGoal(fiscalYear: number): FiscalYearGoal | undefined {
    return goals.value.find((g) => g.fiscalYear === fiscalYear)
  }

  function deleteGoal(fiscalYear: number) {
    goals.value = goals.value.filter((g) => g.fiscalYear !== fiscalYear)
    saveGoals()
  }

  return {
    goals,
    loadGoals,
    setGoal,
    getGoal,
    deleteGoal,
  }
}
