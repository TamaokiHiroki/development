import { parseCSV, type DealRecord } from '~/utils/csvParser'

const STORAGE_KEY = 'cs-kpi-dataset'
const EDITS_KEY = 'cs-kpi-dataset-edits'

const dataset = ref<DealRecord[]>([])
const loading = ref(false)
const loaded = ref(false)

/** Record-level edits stored in localStorage, keyed by dealId */
type RecordEdits = Record<string, Partial<Pick<DealRecord, 'csRep' | 'type'>>>

function loadEditsFromStorage(): RecordEdits {
  if (import.meta.server) return {}
  try {
    const raw = localStorage.getItem(EDITS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveEditsToStorage(edits: RecordEdits) {
  if (import.meta.server) return
  localStorage.setItem(EDITS_KEY, JSON.stringify(edits))
}

function applyEdits(records: DealRecord[]): DealRecord[] {
  const edits = loadEditsFromStorage()
  if (Object.keys(edits).length === 0) return records
  return records.map((r) => {
    const e = edits[r.dealId]
    if (!e) return r
    return { ...r, ...e }
  })
}

export function useDataset() {
  async function loadData() {
    if (loaded.value || loading.value) return
    loading.value = true
    try {
      let text: string | null = null

      // Client-side: check for uploaded dataset in localStorage first
      if (import.meta.client) {
        text = localStorage.getItem(STORAGE_KEY)
      }

      if (!text) {
        if (import.meta.server) {
          const { readFileSync } = await import('node:fs')
          const { resolve } = await import('node:path')
          const filePath = resolve(process.cwd(), 'public/data/dataset20260228.csv')
          text = readFileSync(filePath, 'utf-8')
        } else {
          const res = await fetch('/data/dataset20260228.csv')
          text = await res.text()
        }
      }

      dataset.value = applyEdits(parseCSV(text))
      loaded.value = true
    } catch (e) {
      console.error('Failed to load dataset:', e)
    } finally {
      loading.value = false
    }
  }

  /** Upload a new CSV dataset (stores in localStorage) */
  function uploadDataset(csvText: string): { success: boolean; count: number } {
    try {
      const records = parseCSV(csvText)
      if (records.length === 0) {
        return { success: false, count: 0 }
      }
      localStorage.setItem(STORAGE_KEY, csvText)
      // Clear existing edits when new dataset is uploaded
      localStorage.removeItem(EDITS_KEY)
      dataset.value = records
      return { success: true, count: records.length }
    } catch {
      return { success: false, count: 0 }
    }
  }

  /** Check if using uploaded dataset */
  function hasUploadedDataset(): boolean {
    if (import.meta.server) return false
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  /** Reset to default dataset */
  function resetToDefaultDataset() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(EDITS_KEY)
    loaded.value = false
    loadData()
  }

  /** Update a record's editable fields */
  function updateRecord(dealId: string, updates: Partial<Pick<DealRecord, 'csRep' | 'type'>>) {
    const edits = loadEditsFromStorage()
    edits[dealId] = { ...edits[dealId], ...updates }
    saveEditsToStorage(edits)

    // Apply to in-memory dataset
    const idx = dataset.value.findIndex((r) => r.dealId === dealId)
    if (idx !== -1) {
      dataset.value[idx] = { ...dataset.value[idx], ...updates }
    }
  }

  /** Bulk update multiple records at once */
  function bulkUpdateRecords(dealIds: string[], updates: Partial<Pick<DealRecord, 'csRep' | 'type'>>) {
    const edits = loadEditsFromStorage()
    for (const dealId of dealIds) {
      edits[dealId] = { ...edits[dealId], ...updates }
    }
    saveEditsToStorage(edits)
    const idSet = new Set(dealIds)
    for (let i = 0; i < dataset.value.length; i++) {
      if (idSet.has(dataset.value[i].dealId)) {
        dataset.value[i] = { ...dataset.value[i], ...updates }
      }
    }
  }

  /** Get all unique types in dataset */
  const uniqueTypes = computed(() => {
    const types = new Set<string>()
    for (const d of dataset.value) {
      if (d.type) types.add(d.type)
    }
    return Array.from(types).sort()
  })

  /** Get all unique CS reps in dataset */
  const uniqueCsReps = computed(() => {
    const reps = new Set<string>()
    for (const d of dataset.value) {
      if (d.csRep) reps.add(d.csRep)
    }
    return Array.from(reps).sort()
  })

  const wonDeals = computed(() =>
    dataset.value.filter((d) => d.stage === '7 受注'),
  )

  const plannedDeals = computed(() =>
    dataset.value.filter((d) => d.stage === '8 予定'),
  )

  return {
    dataset,
    loading,
    loaded,
    loadData,
    uploadDataset,
    hasUploadedDataset,
    resetToDefaultDataset,
    updateRecord,
    bulkUpdateRecords,
    uniqueTypes,
    uniqueCsReps,
    wonDeals,
    plannedDeals,
  }
}
