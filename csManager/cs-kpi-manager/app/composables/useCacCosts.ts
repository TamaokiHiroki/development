const STORAGE_KEY = 'cs-kpi-cac-costs'

// Record<dealId, cacCost(円)>
const cacCosts = ref<Record<string, number>>({})
const cacLoaded = ref(false)

export function useCacCosts() {
  function loadCacCosts() {
    if (cacLoaded.value || import.meta.server) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      cacCosts.value = raw ? JSON.parse(raw) : {}
    } catch {
      cacCosts.value = {}
    }
    cacLoaded.value = true
  }

  function save() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cacCosts.value))
  }

  function setCacCost(dealId: string, cost: number) {
    cacCosts.value[dealId] = cost
    save()
  }

  function removeCacCost(dealId: string) {
    delete cacCosts.value[dealId]
    save()
  }

  function getCacCost(dealId: string): number | undefined {
    return cacCosts.value[dealId]
  }

  function getCustomerCacTotal(dealIds: string[]): number {
    return dealIds.reduce((sum, id) => sum + (cacCosts.value[id] || 0), 0)
  }

  return {
    cacCosts,
    loadCacCosts,
    setCacCost,
    removeCacCost,
    getCacCost,
    getCustomerCacTotal,
  }
}
