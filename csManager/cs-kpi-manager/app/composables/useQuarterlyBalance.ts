import { useDataset } from './useDataset'
import { useGoals } from './useGoals'
import { getFiscalYear, getFiscalQuarter, getMonthsInFiscalYear, getLatestConfirmedMonth } from '~/utils/fiscalYear'

export interface QuarterlyBalance {
  quarter: number
  quarterLabel: string
  months: string[]
  revenue: number
  dealCount: number
  outsourcingCost: number
  grossProfit: number
  grossProfitRate: number
  isConfirmed: boolean
  isPartial: boolean
}

export interface BalanceSheetRow {
  category: '収入' | '支出' | '損益'
  label: string
  q1: number
  q2: number
  q3: number
  q4: number
  ytd: number
  isHeader: boolean
  isSummary: boolean
  format: 'currency' | 'percent' | 'count'
}

export function useQuarterlyBalance() {
  const { wonDeals, plannedDeals } = useDataset()
  const { getGoal } = useGoals()

  function getQuarterlyData(fy: number, stage: 'won' | 'all'): QuarterlyBalance[] {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const fyDeals = deals.filter((d) => getFiscalYear(d.completionMonth) === fy)
    const allMonths = getMonthsInFiscalYear(fy)
    const latestConfirmed = getLatestConfirmedMonth()

    const quarters: QuarterlyBalance[] = []
    for (let q = 0; q < 4; q++) {
      const months = allMonths.slice(q * 3, q * 3 + 3)
      const qDeals = fyDeals.filter((d) => months.includes(d.completionMonth))

      const revenue = qDeals.reduce((s, d) => s + d.totalAmount, 0)
      const outsourcingCost = qDeals.reduce((s, d) => s + d.outsourcingCostTotal, 0)
      const grossProfit = qDeals.reduce((s, d) => s + d.grossProfit, 0)

      const confirmedMonths = months.filter((m) => m <= latestConfirmed)
      const isConfirmed = confirmedMonths.length === 3
      const isPartial = confirmedMonths.length > 0 && confirmedMonths.length < 3

      quarters.push({
        quarter: q + 1,
        quarterLabel: `Q${q + 1}`,
        months,
        revenue,
        dealCount: qDeals.length,
        outsourcingCost,
        grossProfit,
        grossProfitRate: revenue !== 0 ? grossProfit / revenue : 0,
        isConfirmed,
        isPartial,
      })
    }

    return quarters
  }

  function getBalanceSheetRows(quarterlyData: QuarterlyBalance[]): BalanceSheetRow[] {
    const q = quarterlyData
    const ytdRevenue = q.reduce((s, d) => s + d.revenue, 0)
    const ytdOutsourcing = q.reduce((s, d) => s + d.outsourcingCost, 0)
    const ytdGP = q.reduce((s, d) => s + d.grossProfit, 0)
    const ytdDealCount = q.reduce((s, d) => s + d.dealCount, 0)
    const ytdGPR = ytdRevenue !== 0 ? ytdGP / ytdRevenue : 0

    return [
      {
        category: '収入',
        label: '【収入の部】',
        q1: 0, q2: 0, q3: 0, q4: 0, ytd: 0,
        isHeader: true, isSummary: false, format: 'currency',
      },
      {
        category: '収入',
        label: '売上高',
        q1: q[0].revenue, q2: q[1].revenue, q3: q[2].revenue, q4: q[3].revenue,
        ytd: ytdRevenue,
        isHeader: false, isSummary: false, format: 'currency',
      },
      {
        category: '収入',
        label: '案件数',
        q1: q[0].dealCount, q2: q[1].dealCount, q3: q[2].dealCount, q4: q[3].dealCount,
        ytd: ytdDealCount,
        isHeader: false, isSummary: false, format: 'count',
      },
      {
        category: '支出',
        label: '【支出の部】',
        q1: 0, q2: 0, q3: 0, q4: 0, ytd: 0,
        isHeader: true, isSummary: false, format: 'currency',
      },
      {
        category: '支出',
        label: '外注費合計',
        q1: q[0].outsourcingCost, q2: q[1].outsourcingCost, q3: q[2].outsourcingCost, q4: q[3].outsourcingCost,
        ytd: ytdOutsourcing,
        isHeader: false, isSummary: false, format: 'currency',
      },
      {
        category: '損益',
        label: '【損益の部】',
        q1: 0, q2: 0, q3: 0, q4: 0, ytd: 0,
        isHeader: true, isSummary: false, format: 'currency',
      },
      {
        category: '損益',
        label: '粗利高',
        q1: q[0].grossProfit, q2: q[1].grossProfit, q3: q[2].grossProfit, q4: q[3].grossProfit,
        ytd: ytdGP,
        isHeader: false, isSummary: true, format: 'currency',
      },
      {
        category: '損益',
        label: '粗利率',
        q1: q[0].grossProfitRate, q2: q[1].grossProfitRate, q3: q[2].grossProfitRate, q4: q[3].grossProfitRate,
        ytd: ytdGPR,
        isHeader: false, isSummary: false, format: 'percent',
      },
    ]
  }

  function getGoalAchievement(fy: number, ytdRevenue: number, ytdGrossProfit: number) {
    const goal = getGoal(fy)
    if (!goal) return null
    return {
      revenueRate: goal.revenueTarget !== 0 ? ytdRevenue / goal.revenueTarget : 0,
      grossProfitRate: goal.grossProfitTarget !== 0 ? ytdGrossProfit / goal.grossProfitTarget : 0,
    }
  }

  function getCurrentQuarter(): number {
    const latestConfirmed = getLatestConfirmedMonth()
    return getFiscalQuarter(latestConfirmed)
  }

  return {
    getQuarterlyData,
    getBalanceSheetRows,
    getGoalAchievement,
    getCurrentQuarter,
  }
}
