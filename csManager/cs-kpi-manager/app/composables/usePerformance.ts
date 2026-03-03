import { useDataset } from './useDataset'
import { getFiscalYear, getMonthsInFiscalYear } from '~/utils/fiscalYear'
import { formatTrend } from '~/utils/formatters'
import type { DealRecord } from '~/utils/csvParser'

export interface MonthlyMetrics {
  month: string
  revenue: number
  grossProfit: number
  grossProfitRate: number
  dealCount: number
}

function aggregateByMonth(deals: DealRecord[]): Map<string, MonthlyMetrics> {
  const map = new Map<string, MonthlyMetrics>()
  for (const d of deals) {
    const m = d.completionMonth
    if (!map.has(m)) {
      map.set(m, { month: m, revenue: 0, grossProfit: 0, grossProfitRate: 0, dealCount: 0 })
    }
    const entry = map.get(m)!
    entry.revenue += d.totalAmount
    entry.grossProfit += d.grossProfit
    entry.dealCount++
  }
  for (const entry of map.values()) {
    entry.grossProfitRate = entry.revenue !== 0 ? entry.grossProfit / entry.revenue : 0
  }
  return map
}

export function usePerformance() {
  const { wonDeals, plannedDeals } = useDataset()

  function getMonthlyData(fy: number, stage: 'won' | 'all') {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const fyDeals = deals.filter((d) => getFiscalYear(d.completionMonth) === fy)
    const map = aggregateByMonth(fyDeals)
    const months = getMonthsInFiscalYear(fy)
    return months.map((m) => map.get(m) || { month: m, revenue: 0, grossProfit: 0, grossProfitRate: 0, dealCount: 0 })
  }

  function getKpiSummary(fy: number, stage: 'won' | 'all', currentMonth: string) {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const fyDeals = deals.filter((d) => getFiscalYear(d.completionMonth) === fy)

    const currentDeals = fyDeals.filter((d) => d.completionMonth === currentMonth)
    const currentRevenue = currentDeals.reduce((s, d) => s + d.totalAmount, 0)
    const currentGP = currentDeals.reduce((s, d) => s + d.grossProfit, 0)
    const currentGPR = currentRevenue !== 0 ? currentGP / currentRevenue : 0

    // 前月
    const [cy, cm] = currentMonth.split('/').map(Number)
    const prevMonth = cm === 1
      ? `${cy - 1}/12`
      : `${cy}/${String(cm - 1).padStart(2, '0')}`
    const prevDeals = fyDeals.filter((d) => d.completionMonth === prevMonth)
    const prevRevenue = prevDeals.reduce((s, d) => s + d.totalAmount, 0)
    const prevGP = prevDeals.reduce((s, d) => s + d.grossProfit, 0)
    const prevGPR = prevRevenue !== 0 ? prevGP / prevRevenue : 0

    // 前年同期
    const yoyMonth = `${cy - 1}/${String(cm).padStart(2, '0')}`
    const allDeals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const yoyDeals = allDeals.filter((d) => d.completionMonth === yoyMonth)
    const yoyRevenue = yoyDeals.reduce((s, d) => s + d.totalAmount, 0)
    const yoyGP = yoyDeals.reduce((s, d) => s + d.grossProfit, 0)

    // 累計
    const ytdRevenue = fyDeals.filter((d) => d.completionMonth <= currentMonth).reduce((s, d) => s + d.totalAmount, 0)
    const ytdGP = fyDeals.filter((d) => d.completionMonth <= currentMonth).reduce((s, d) => s + d.grossProfit, 0)

    return {
      currentMonth: {
        revenue: currentRevenue,
        grossProfit: currentGP,
        grossProfitRate: currentGPR,
        dealCount: currentDeals.length,
      },
      mom: {
        revenue: formatTrend(currentRevenue, prevRevenue),
        grossProfit: formatTrend(currentGP, prevGP),
        grossProfitRate: formatTrend(currentGPR, prevGPR),
      },
      yoy: {
        revenue: formatTrend(currentRevenue, yoyRevenue),
        grossProfit: formatTrend(currentGP, yoyGP),
      },
      ytd: {
        revenue: ytdRevenue,
        grossProfit: ytdGP,
        grossProfitRate: ytdRevenue !== 0 ? ytdGP / ytdRevenue : 0,
      },
    }
  }

  return {
    getMonthlyData,
    getKpiSummary,
  }
}
