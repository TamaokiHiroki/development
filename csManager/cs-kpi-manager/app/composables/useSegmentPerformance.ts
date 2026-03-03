import { getFiscalYear, getLatestConfirmedMonth, getElapsedMonths } from '~/utils/fiscalYear'

export interface SegmentMetrics {
  segmentId: string
  segmentName: string
  ytdRevenue: number
  ytdGrossProfit: number
  ytdGrossProfitRate: number
  ytdDealCount: number
  prevYtdRevenue: number
  prevYtdGrossProfit: number
  yoyRevenueChange: number
  yoyGpChange: number
  revenueTarget: number
  grossProfitTarget: number
  revenueProgress: number
  gpProgress: number
  revenuePaceStatus: 'success' | 'warning' | 'error'
  gpPaceStatus: 'success' | 'warning' | 'error'
}

function getPaceStatus(actualPercent: number, pacePercent: number): 'success' | 'warning' | 'error' {
  if (actualPercent >= pacePercent) return 'success'
  if (actualPercent >= pacePercent - 5) return 'warning'
  return 'error'
}

export function useSegmentPerformance() {
  const { wonDeals, plannedDeals } = useDataset()
  const { getConfig, getSortedSegments } = useSegments()

  function getSegmentMetrics(fy: number, stage: 'won' | 'all'): SegmentMetrics[] {
    const config = getConfig(fy)
    if (!config || config.segments.length === 0) return []

    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const confirmedMonth = getLatestConfirmedMonth()
    const elapsedMonths = getElapsedMonths(fy)
    const pacePercent = (elapsedMonths / 12) * 100

    // Current FY deals (YTD)
    const fyDeals = deals.filter(
      d => getFiscalYear(d.completionMonth) === fy && d.completionMonth <= confirmedMonth,
    )

    // Previous FY deals (YTD equivalent - same elapsed months)
    const prevConfig = getConfig(fy - 1)
    const prevFyDeals = deals.filter(d => getFiscalYear(d.completionMonth) === fy - 1)

    // Calculate previous FY confirmed month equivalent
    // Use the same number of elapsed months from previous year
    const prevConfirmedMonths = new Set<string>()
    if (elapsedMonths > 0) {
      const prevStartYear = fy - 2
      for (let i = 0; i < elapsedMonths; i++) {
        const m = i < 4 ? 9 + i : i - 4 + 1
        const y = m >= 9 ? prevStartYear : prevStartYear + 1
        prevConfirmedMonths.add(`${y}/${String(m).padStart(2, '0')}`)
      }
    }
    const prevYtdDeals = prevFyDeals.filter(d => prevConfirmedMonths.has(d.completionMonth))

    // Group deals by segment
    const sortedSegments = getSortedSegments(fy)
    const UNCLASSIFIED_ID = '__unclassified__'

    const segmentBuckets = new Map<string, { revenue: number; gp: number; count: number }>()
    const prevBuckets = new Map<string, { revenue: number; gp: number }>()

    // Initialize buckets
    for (const seg of sortedSegments) {
      segmentBuckets.set(seg.id, { revenue: 0, gp: 0, count: 0 })
    }
    segmentBuckets.set(UNCLASSIFIED_ID, { revenue: 0, gp: 0, count: 0 })

    // Aggregate current FY
    for (const deal of fyDeals) {
      const segId = config.mappings[deal.type] || UNCLASSIFIED_ID
      const bucket = segmentBuckets.get(segId) || segmentBuckets.get(UNCLASSIFIED_ID)!
      bucket.revenue += deal.totalAmount
      bucket.gp += deal.grossProfit
      bucket.count++
    }

    // Aggregate previous FY
    for (const seg of sortedSegments) {
      prevBuckets.set(seg.id, { revenue: 0, gp: 0 })
    }
    prevBuckets.set(UNCLASSIFIED_ID, { revenue: 0, gp: 0 })

    for (const deal of prevYtdDeals) {
      // Use previous FY config for mapping
      const prevSegId = prevConfig?.mappings[deal.type]
      // Try to find matching segment name in current config
      let currentSegId = UNCLASSIFIED_ID
      if (prevSegId && prevConfig) {
        const prevSegName = prevConfig.segments.find(s => s.id === prevSegId)?.name
        if (prevSegName) {
          const currentSeg = sortedSegments.find(s => s.name === prevSegName)
          if (currentSeg) currentSegId = currentSeg.id
        }
      }
      const bucket = prevBuckets.get(currentSegId) || prevBuckets.get(UNCLASSIFIED_ID)!
      bucket.revenue += deal.totalAmount
      bucket.gp += deal.grossProfit
    }

    // Build metrics
    const results: SegmentMetrics[] = []

    const allSegIds = [...sortedSegments.map(s => s.id)]
    // Only include unclassified if there are unclassified deals
    const unclassifiedBucket = segmentBuckets.get(UNCLASSIFIED_ID)!
    if (unclassifiedBucket.count > 0) {
      allSegIds.push(UNCLASSIFIED_ID)
    }

    for (const segId of allSegIds) {
      const seg = sortedSegments.find(s => s.id === segId)
      const segName = seg?.name || '未分類'
      const bucket = segmentBuckets.get(segId) || { revenue: 0, gp: 0, count: 0 }
      const prev = prevBuckets.get(segId) || { revenue: 0, gp: 0 }
      const target = config.targets[segId] || { revenueTarget: 0, grossProfitTarget: 0 }

      const ytdGrossProfitRate = bucket.revenue !== 0 ? bucket.gp / bucket.revenue : 0
      const yoyRevenueChange = prev.revenue !== 0 ? ((bucket.revenue - prev.revenue) / prev.revenue) * 100 : 0
      const yoyGpChange = prev.gp !== 0 ? ((bucket.gp - prev.gp) / prev.gp) * 100 : 0
      const revenueProgress = target.revenueTarget > 0 ? (bucket.revenue / target.revenueTarget) * 100 : 0
      const gpProgress = target.grossProfitTarget > 0 ? (bucket.gp / target.grossProfitTarget) * 100 : 0

      results.push({
        segmentId: segId,
        segmentName: segName,
        ytdRevenue: bucket.revenue,
        ytdGrossProfit: bucket.gp,
        ytdGrossProfitRate,
        ytdDealCount: bucket.count,
        prevYtdRevenue: prev.revenue,
        prevYtdGrossProfit: prev.gp,
        yoyRevenueChange,
        yoyGpChange,
        revenueTarget: target.revenueTarget,
        grossProfitTarget: target.grossProfitTarget,
        revenueProgress,
        gpProgress,
        revenuePaceStatus: target.revenueTarget > 0 ? getPaceStatus(revenueProgress, pacePercent) : 'success',
        gpPaceStatus: target.grossProfitTarget > 0 ? getPaceStatus(gpProgress, pacePercent) : 'success',
      })
    }

    return results
  }

  return {
    getSegmentMetrics,
  }
}
