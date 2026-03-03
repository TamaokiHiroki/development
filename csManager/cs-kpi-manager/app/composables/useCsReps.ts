const STORAGE_KEY = 'cs-kpi-cs-reps'

export interface CsRep {
  id: string
  name: string
  team: string
  grade: string
  supplement: string
  targets: Record<number, { revenueTarget: number; grossProfitTarget: number }>
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
      csReps.value = raw ? JSON.parse(raw).map((r: any) => {
        // Migration: convert old flat revenueTarget/grossProfitTarget to targets[2026]
        let targets = r.targets || {}
        if (!r.targets && (r.revenueTarget || r.grossProfitTarget)) {
          targets = {
            2026: {
              revenueTarget: r.revenueTarget ?? 0,
              grossProfitTarget: r.grossProfitTarget ?? 0,
            },
          }
        }
        return {
          id: r.id,
          name: r.name,
          team: r.team || '',
          grade: r.grade || '',
          supplement: r.supplement || '',
          targets,
        }
      }) : []
    } catch {
      csReps.value = []
    }
    csRepsLoaded.value = true
  }

  function saveCsReps() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(csReps.value))
  }

  function addCsRep(name: string, team: string, grade: string, supplement: string): CsRep {
    const rep: CsRep = { id: generateId(), name: name.trim(), team, grade, supplement: supplement.trim(), targets: {} }
    csReps.value.push(rep)
    saveCsReps()
    return rep
  }

  function updateCsRep(id: string, name: string, team: string, grade: string, supplement: string) {
    const idx = csReps.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      csReps.value[idx] = { ...csReps.value[idx], name: name.trim(), team, grade, supplement: supplement.trim() }
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

  function getRepTarget(id: string, fy: number): { revenueTarget: number; grossProfitTarget: number } {
    const rep = csReps.value.find((r) => r.id === id)
    return rep?.targets[fy] ?? { revenueTarget: 0, grossProfitTarget: 0 }
  }

  function setRepTarget(id: string, fy: number, revenueTarget: number, grossProfitTarget: number) {
    const rep = csReps.value.find((r) => r.id === id)
    if (rep) {
      rep.targets[fy] = { revenueTarget, grossProfitTarget }
      saveCsReps()
    }
  }

  return {
    csReps,
    loadCsReps,
    addCsRep,
    updateCsRep,
    deleteCsRep,
    getCsRepByName,
    getRepTarget,
    setRepTarget,
  }
}
