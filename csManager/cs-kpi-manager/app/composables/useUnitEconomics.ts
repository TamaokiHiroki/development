import { useDataset } from './useDataset'
import { getFiscalYear, getMonthsInFiscalYear } from '~/utils/fiscalYear'
import type { DealRecord } from '~/utils/csvParser'

const AD_SOURCES = ['01_LP（広告）']

export interface UnitEconomicsData {
  ltv: number
  cac: number
  ltvCacRatio: number
  uniqueCustomers: number
  newCustomers: number
  totalGP: number
  totalAdCost: number
}

export interface CustomerSegment {
  accountName: string
  totalGP: number
  totalRevenue: number
  grossProfitRate: number
  dealCount: number
  avgDealSize: number
  tenureMonths: number
  firstMonth: string
  lastMonth: string
}

export interface TenureSegment {
  label: string
  minMonths: number
  maxMonths: number
  customerCount: number
  totalRevenue: number
  totalGP: number
  grossProfitRate: number
  avgLtv: number
  avgDealCount: number
}

export interface CustomerUnitEconomics {
  accountName: string
  ltv: number
  totalRevenue: number
  totalGP: number
  grossProfitRate: number
  dealCount: number
  avgDealSize: number
  tenureMonths: number
  revenuePerMonth: number
  gpPerMonth: number
}

function isAdSource(source: string): boolean {
  return AD_SOURCES.some((s) => source.startsWith(s.substring(0, 4)))
}

export function useUnitEconomics() {
  const { wonDeals } = useDataset()

  function getUnitEconomics(fy: number): UnitEconomicsData {
    const fyDeals = wonDeals.value.filter((d) => getFiscalYear(d.completionMonth) === fy)

    // LTV: 累計粗利 / ユニーク顧客数
    const customerGP = new Map<string, number>()
    for (const d of fyDeals) {
      const prev = customerGP.get(d.accountName) || 0
      customerGP.set(d.accountName, prev + d.grossProfit)
    }
    const uniqueCustomers = customerGP.size
    const totalGP = fyDeals.reduce((s, d) => s + d.grossProfit, 0)
    const ltv = uniqueCustomers > 0 ? totalGP / uniqueCustomers : 0

    // CAC: 広告系外注費合計 / 新規顧客数
    const adDeals = fyDeals.filter((d) => isAdSource(d.acquisitionSource))
    const totalAdCost = adDeals.reduce((s, d) => s + d.outsourcingCostTotal, 0)
    const newCustomerNames = new Set(adDeals.map((d) => d.accountName))
    const newCustomers = newCustomerNames.size
    const cac = newCustomers > 0 ? totalAdCost / newCustomers : 0

    const ltvCacRatio = cac > 0 ? ltv / cac : 0

    return { ltv, cac, ltvCacRatio, uniqueCustomers, newCustomers, totalGP, totalAdCost }
  }

  function getMonthlyLtvCac(fy: number) {
    const months = getMonthsInFiscalYear(fy)
    const deals = wonDeals.value.filter((d) => getFiscalYear(d.completionMonth) === fy)

    return months.map((month) => {
      const cumulativeDeals = deals.filter((d) => d.completionMonth <= month)
      const customerGP = new Map<string, number>()
      for (const d of cumulativeDeals) {
        const prev = customerGP.get(d.accountName) || 0
        customerGP.set(d.accountName, prev + d.grossProfit)
      }

      const uniqueCustomers = customerGP.size
      const totalGP = cumulativeDeals.reduce((s, d) => s + d.grossProfit, 0)
      const ltv = uniqueCustomers > 0 ? totalGP / uniqueCustomers : 0

      const adDeals = cumulativeDeals.filter((d) => isAdSource(d.acquisitionSource))
      const totalAdCost = adDeals.reduce((s, d) => s + d.outsourcingCostTotal, 0)
      const newCustomers = new Set(adDeals.map((d) => d.accountName)).size
      const cac = newCustomers > 0 ? totalAdCost / newCustomers : 0

      return {
        month,
        ltv,
        cac,
        ltvCacRatio: cac > 0 ? ltv / cac : 0,
      }
    })
  }

  function getCustomerSegments(fy: number): CustomerSegment[] {
    const fyDeals = wonDeals.value.filter((d) => getFiscalYear(d.completionMonth) === fy)
    const customerMap = new Map<string, { totalGP: number; totalRevenue: number; dealCount: number; months: Set<string> }>()

    for (const d of fyDeals) {
      const entry = customerMap.get(d.accountName) || { totalGP: 0, totalRevenue: 0, dealCount: 0, months: new Set<string>() }
      entry.totalGP += d.grossProfit
      entry.totalRevenue += d.totalAmount
      entry.dealCount++
      entry.months.add(d.completionMonth)
      customerMap.set(d.accountName, entry)
    }

    return Array.from(customerMap.entries())
      .map(([accountName, data]) => {
        const sortedMonths = Array.from(data.months).sort()
        return {
          accountName,
          totalGP: data.totalGP,
          totalRevenue: data.totalRevenue,
          grossProfitRate: data.totalRevenue !== 0 ? data.totalGP / data.totalRevenue : 0,
          dealCount: data.dealCount,
          avgDealSize: data.dealCount > 0 ? data.totalGP / data.dealCount : 0,
          tenureMonths: data.months.size,
          firstMonth: sortedMonths[0],
          lastMonth: sortedMonths[sortedMonths.length - 1],
        }
      })
      .sort((a, b) => b.totalGP - a.totalGP)
  }

  function getTenureSegments(fy: number): TenureSegment[] {
    const customers = getCustomerSegments(fy)
    const ranges = [
      { label: '1ヶ月', minMonths: 1, maxMonths: 1 },
      { label: '2〜3ヶ月', minMonths: 2, maxMonths: 3 },
      { label: '4〜6ヶ月', minMonths: 4, maxMonths: 6 },
      { label: '7ヶ月以上', minMonths: 7, maxMonths: Infinity },
    ]

    return ranges.map(({ label, minMonths, maxMonths }) => {
      const group = customers.filter(
        (c) => c.tenureMonths >= minMonths && c.tenureMonths <= maxMonths,
      )
      const totalRevenue = group.reduce((s, c) => s + c.totalRevenue, 0)
      const totalGP = group.reduce((s, c) => s + c.totalGP, 0)
      const totalDeals = group.reduce((s, c) => s + c.dealCount, 0)

      return {
        label,
        minMonths,
        maxMonths,
        customerCount: group.length,
        totalRevenue,
        totalGP,
        grossProfitRate: totalRevenue !== 0 ? totalGP / totalRevenue : 0,
        avgLtv: group.length > 0 ? totalGP / group.length : 0,
        avgDealCount: group.length > 0 ? totalDeals / group.length : 0,
      }
    })
  }

  function getCustomerUnitEconomicsList(fy: number): CustomerUnitEconomics[] {
    const customers = getCustomerSegments(fy)
    return customers.map((c) => ({
      accountName: c.accountName,
      ltv: c.totalGP,
      totalRevenue: c.totalRevenue,
      totalGP: c.totalGP,
      grossProfitRate: c.grossProfitRate,
      dealCount: c.dealCount,
      avgDealSize: c.avgDealSize,
      tenureMonths: c.tenureMonths,
      revenuePerMonth: c.tenureMonths > 0 ? c.totalRevenue / c.tenureMonths : 0,
      gpPerMonth: c.tenureMonths > 0 ? c.totalGP / c.tenureMonths : 0,
    }))
  }

  return {
    getUnitEconomics,
    getMonthlyLtvCac,
    getCustomerSegments,
    getTenureSegments,
    getCustomerUnitEconomicsList,
  }
}
