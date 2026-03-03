const STORAGE_KEY = 'cs-kpi-segments'

export interface Segment {
  id: string
  name: string
  sortOrder: number
}

export interface SegmentConfig {
  fiscalYear: number
  segments: Segment[]
  mappings: Record<string, string>       // 種類名 → segmentId
  targets: Record<string, {              // segmentId → 目標
    revenueTarget: number
    grossProfitTarget: number
  }>
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

const segmentConfigs = ref<SegmentConfig[]>([])
const segmentsLoaded = ref(false)

export function useSegments() {
  function loadSegmentConfigs() {
    if (segmentsLoaded.value || import.meta.server) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      segmentConfigs.value = raw ? JSON.parse(raw) : []
    } catch {
      segmentConfigs.value = []
    }
    segmentsLoaded.value = true
  }

  function saveConfigs() {
    if (import.meta.server) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(segmentConfigs.value))
  }

  function getConfig(fy: number): SegmentConfig | undefined {
    return segmentConfigs.value.find(c => c.fiscalYear === fy)
  }

  function ensureConfig(fy: number): SegmentConfig {
    let config = getConfig(fy)
    if (!config) {
      config = { fiscalYear: fy, segments: [], mappings: {}, targets: {} }
      segmentConfigs.value.push(config)
      saveConfigs()
    }
    return config
  }

  function setConfig(config: SegmentConfig) {
    const idx = segmentConfigs.value.findIndex(c => c.fiscalYear === config.fiscalYear)
    if (idx !== -1) {
      segmentConfigs.value[idx] = config
    } else {
      segmentConfigs.value.push(config)
    }
    saveConfigs()
  }

  function addSegment(fy: number, name: string): Segment {
    const config = ensureConfig(fy)
    const maxOrder = config.segments.length > 0
      ? Math.max(...config.segments.map(s => s.sortOrder))
      : 0
    const segment: Segment = { id: generateId(), name: name.trim(), sortOrder: maxOrder + 1 }
    config.segments.push(segment)
    saveConfigs()
    return segment
  }

  function updateSegment(fy: number, segmentId: string, name: string, sortOrder: number) {
    const config = getConfig(fy)
    if (!config) return
    const seg = config.segments.find(s => s.id === segmentId)
    if (seg) {
      seg.name = name.trim()
      seg.sortOrder = sortOrder
      saveConfigs()
    }
  }

  function deleteSegment(fy: number, segmentId: string) {
    const config = getConfig(fy)
    if (!config) return
    config.segments = config.segments.filter(s => s.id !== segmentId)
    // Remove mappings pointing to this segment
    for (const [typeName, sid] of Object.entries(config.mappings)) {
      if (sid === segmentId) {
        delete config.mappings[typeName]
      }
    }
    // Remove target for this segment
    delete config.targets[segmentId]
    saveConfigs()
  }

  function setMapping(fy: number, typeName: string, segmentId: string) {
    const config = ensureConfig(fy)
    config.mappings[typeName] = segmentId
    saveConfigs()
  }

  function setMappingsBulk(fy: number, mappings: Record<string, string>) {
    const config = ensureConfig(fy)
    config.mappings = { ...config.mappings, ...mappings }
    saveConfigs()
  }

  function setSegmentTarget(fy: number, segmentId: string, revenueTarget: number, grossProfitTarget: number) {
    const config = ensureConfig(fy)
    config.targets[segmentId] = { revenueTarget, grossProfitTarget }
    saveConfigs()
  }

  function copyFromPreviousYear(fy: number) {
    const prevConfig = getConfig(fy - 1)
    if (!prevConfig) return false

    const newConfig: SegmentConfig = {
      fiscalYear: fy,
      segments: prevConfig.segments.map(s => ({ ...s, id: generateId() })),
      mappings: {},
      targets: {},
    }

    // Copy mappings with new segment IDs
    const idMap = new Map<string, string>()
    prevConfig.segments.forEach((oldSeg, idx) => {
      idMap.set(oldSeg.id, newConfig.segments[idx].id)
    })
    for (const [typeName, oldSegId] of Object.entries(prevConfig.mappings)) {
      const newSegId = idMap.get(oldSegId)
      if (newSegId) {
        newConfig.mappings[typeName] = newSegId
      }
    }
    // Targets are reset (not copied)

    setConfig(newConfig)
    return true
  }

  function getSegmentForType(fy: number, typeName: string): string | undefined {
    const config = getConfig(fy)
    return config?.mappings[typeName]
  }

  function getSortedSegments(fy: number): Segment[] {
    const config = getConfig(fy)
    if (!config) return []
    return [...config.segments].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  return {
    segmentConfigs,
    loadSegmentConfigs,
    getConfig,
    setConfig,
    addSegment,
    updateSegment,
    deleteSegment,
    setMapping,
    setMappingsBulk,
    setSegmentTarget,
    copyFromPreviousYear,
    getSegmentForType,
    getSortedSegments,
  }
}
