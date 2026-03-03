import { useDataset } from './useDataset'
import { getFiscalYear } from '~/utils/fiscalYear'

export interface StaffMetrics {
  name: string
  revenue: number
  grossProfit: number
  grossProfitRate: number
  dealCount: number
}

export function useStaffMetrics() {
  const { wonDeals, plannedDeals } = useDataset()

  function getSalesRepMetrics(fy: number, stage: 'won' | 'all'): StaffMetrics[] {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const fyDeals = deals.filter((d) => getFiscalYear(d.completionMonth) === fy && d.salesRep)

    const map = new Map<string, StaffMetrics>()
    for (const d of fyDeals) {
      if (!map.has(d.salesRep)) {
        map.set(d.salesRep, { name: d.salesRep, revenue: 0, grossProfit: 0, grossProfitRate: 0, dealCount: 0 })
      }
      const entry = map.get(d.salesRep)!
      entry.revenue += d.totalAmount
      entry.grossProfit += d.grossProfit
      entry.dealCount++
    }

    for (const entry of map.values()) {
      entry.grossProfitRate = entry.revenue !== 0 ? entry.grossProfit / entry.revenue : 0
    }

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }

  function getCsRepMetrics(fy: number, stage: 'won' | 'all'): StaffMetrics[] {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const fyDeals = deals.filter((d) => getFiscalYear(d.completionMonth) === fy && d.csRep)

    const map = new Map<string, StaffMetrics>()
    for (const d of fyDeals) {
      if (!map.has(d.csRep)) {
        map.set(d.csRep, { name: d.csRep, revenue: 0, grossProfit: 0, grossProfitRate: 0, dealCount: 0 })
      }
      const entry = map.get(d.csRep)!
      entry.revenue += d.totalAmount
      entry.grossProfit += d.grossProfit
      entry.dealCount++
    }

    for (const entry of map.values()) {
      entry.grossProfitRate = entry.revenue !== 0 ? entry.grossProfit / entry.revenue : 0
    }

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }

  function getStaffList(fy: number): string[] {
    const deals = wonDeals.value.filter((d) => getFiscalYear(d.completionMonth) === fy)
    const names = new Set<string>()
    for (const d of deals) {
      if (d.salesRep) names.add(d.salesRep)
      if (d.csRep) names.add(d.csRep)
    }
    return Array.from(names).sort()
  }

  return {
    getSalesRepMetrics,
    getCsRepMetrics,
    getStaffList,
  }
}
