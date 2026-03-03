const STORAGE_KEY = 'cs-kpi-cs-reps'

export interface CsRep {
  id: string
  name: string
  title: string
  team: string
  grade: string
  supplement: string
  revenueTarget: number
  grossProfitTarget: number
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

const csReps = ref<CsRep[]>([])
const csRepsLoaded = ref(false)

export function useCsReps() {
  function loadCsReps() {
    if (csRepsLoaded.value || import.meta.server) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      csReps.value = raw ? JSON.parse(raw).map((r: any) => ({
        ...r,
        team: r.team || '',
        grade: r.grade || '',
        supplement: r.supplement || '',
        revenueTarget: r.revenueTarget ?? 0,
        grossProfitTarget: r.grossProfitTarget ?? 0,
      })) : []
    } catch {
      csReps.value = []
    }
    csRepsLoaded.value = true
  }

  function saveCsReps() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(csReps.value))
  }

  function addCsRep(name: string, title: string, team: string, grade: string, supplement: string, revenueTarget = 0, grossProfitTarget = 0): CsRep {
    const rep: CsRep = { id: generateId(), name: name.trim(), title: title.trim(), team, grade, supplement: supplement.trim(), revenueTarget, grossProfitTarget }
    csReps.value.push(rep)
    saveCsReps()
    return rep
  }

  function updateCsRep(id: string, name: string, title: string, team: string, grade: string, supplement: string, revenueTarget = 0, grossProfitTarget = 0) {
    const idx = csReps.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      csReps.value[idx] = { ...csReps.value[idx], name: name.trim(), title: title.trim(), team, grade, supplement: supplement.trim(), revenueTarget, grossProfitTarget }
      saveCsReps()
    }
  }

  function deleteCsRep(id: string) {
    csReps.value = csReps.value.filter((r) => r.id !== id)
    saveCsReps()
  }

  function getCsRepByName(name: string): CsRep | undefined {
    return csReps.value.find((r) => r.name === name)
  }

  return {
    csReps,
    loadCsReps,
    addCsRep,
    updateCsRep,
    deleteCsRep,
    getCsRepByName,
  }
}
