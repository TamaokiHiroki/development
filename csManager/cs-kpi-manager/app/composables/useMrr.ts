import { useDataset } from './useDataset'
import { getFiscalYear, getMonthsInFiscalYear } from '~/utils/fiscalYear'
import type { DealRecord } from '~/utils/csvParser'

const MRR_TYPES = ['GEPPY CRM', 'システム/アプリ保守', 'サイト運用保守', 'SNS運用']

export interface MonthlyMrr {
  month: string
  mrr: number
  customerCount: number
}

export interface NrrData {
  month: string
  nrr: number
  expansion: number
  contraction: number
  churn: number
  baseMrr: number
}

function isMrrType(type: string): boolean {
  return MRR_TYPES.includes(type)
}

export function useMrr() {
  const { wonDeals, plannedDeals } = useDataset()

  function getMonthlyMrr(fy: number, stage: 'won' | 'all'): MonthlyMrr[] {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    const mrrDeals = deals.filter((d) => isMrrType(d.type) && getFiscalYear(d.completionMonth) === fy)
    const months = getMonthsInFiscalYear(fy)

    return months.map((month) => {
      const monthDeals = mrrDeals.filter((d) => d.completionMonth === month)
      const mrr = monthDeals.reduce((s, d) => s + d.totalAmount, 0)
      const customerCount = new Set(monthDeals.map((d) => d.accountName)).size
      return { month, mrr, customerCount }
    })
  }

  function getNrrData(fy: number): NrrData[] {
    const deals = wonDeals.value.filter((d) => isMrrType(d.type))
    const months = getMonthsInFiscalYear(fy)

    // 前年度の月リストも取得して前月データを参照できるようにする
    const prevFyMonths = getMonthsInFiscalYear(fy - 1)
    const allMonths = [...prevFyMonths, ...months]

    // 月別・顧客別のMRRを集計
    const monthCustomerMrr = new Map<string, Map<string, number>>()
    for (const m of allMonths) {
      const monthDeals = deals.filter((d) => d.completionMonth === m)
      const customerMrr = new Map<string, number>()
      for (const d of monthDeals) {
        const prev = customerMrr.get(d.accountName) || 0
        customerMrr.set(d.accountName, prev + d.totalAmount)
      }
      monthCustomerMrr.set(m, customerMrr)
    }

    return months.map((month, idx) => {
      const prevMonth = idx === 0 ? prevFyMonths[prevFyMonths.length - 1] : months[idx - 1]
      const currentMrr = monthCustomerMrr.get(month) || new Map()
      const prevMrrMap = monthCustomerMrr.get(prevMonth) || new Map()

      const baseMrr = Array.from(prevMrrMap.values()).reduce((s, v) => s + v, 0)
      let expansion = 0
      let contraction = 0
      let churn = 0

      // 前月の顧客を確認
      for (const [customer, prevVal] of prevMrrMap) {
        const currentVal = currentMrr.get(customer) || 0
        if (currentVal === 0) {
          churn += prevVal
        } else if (currentVal > prevVal) {
          expansion += currentVal - prevVal
        } else if (currentVal < prevVal) {
          contraction += prevVal - currentVal
        }
      }

      // 新規顧客(前月にいなかった)をexpansionに加算
      for (const [customer, currentVal] of currentMrr) {
        if (!prevMrrMap.has(customer)) {
          expansion += currentVal
        }
      }

      const nrr = baseMrr > 0 ? (baseMrr + expansion - contraction - churn) / baseMrr : 1

      return { month, nrr, expansion, contraction, churn, baseMrr }
    })
  }

  function getCurrentMrr(fy: number, currentMonth: string) {
    const mrrData = getMonthlyMrr(fy, 'won')
    const current = mrrData.find((d) => d.month === currentMonth)
    const months = getMonthsInFiscalYear(fy)
    const prevIdx = months.indexOf(currentMonth) - 1
    const prevMonth = prevIdx >= 0 ? months[prevIdx] : null
    const prev = prevMonth ? mrrData.find((d) => d.month === prevMonth) : null

    return {
      current: current?.mrr || 0,
      previous: prev?.mrr || 0,
      customerCount: current?.customerCount || 0,
    }
  }

  function getMonthlyDealList(fy: number, month: string, stage: 'won' | 'all') {
    const deals = stage === 'won' ? wonDeals.value : [...wonDeals.value, ...plannedDeals.value]
    return deals
      .filter((d) => d.completionMonth === month && getFiscalYear(d.completionMonth) === fy)
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }

  return {
    getMonthlyMrr,
    getNrrData,
    getCurrentMrr,
    getMonthlyDealList,
    MRR_TYPES,
  }
}
