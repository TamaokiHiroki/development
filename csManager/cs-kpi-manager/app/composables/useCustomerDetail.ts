import { useDataset } from './useDataset'
import { getFiscalYear, getMonthsInFiscalYear, getLatestConfirmedMonth } from '~/utils/fiscalYear'
import { formatCurrency, formatPercent } from '~/utils/formatters'

export interface CustomerMonthlyMetrics {
  month: string
  revenue: number
  grossProfit: number
  grossProfitRate: number
  dealCount: number
}

export interface CustomerKpiSummary {
  totalRevenue: number
  totalGrossProfit: number
  grossProfitRate: number
  dealCount: number
  tenureMonths: number
  avgDealSize: number
  ltv: number
  revenuePerMonth: number
  gpPerMonth: number
}

export interface CustomerAnalysis {
  indicators: { label: string; value: string; status: 'success' | 'warning' | 'error' }[]
  evaluation: string
  improvementPoints: string[]
  actionProposals: string[]
  riskLevel: 'at-risk' | 'stable' | 'growth'
  followUpRecommendation: string
}

export function useCustomerDetail() {
  const { wonDeals } = useDataset()

  function getCustomerMonthlyMetrics(fy: number, accountName: string): CustomerMonthlyMetrics[] {
    const deals = wonDeals.value.filter(
      (d) => d.accountName === accountName && getFiscalYear(d.completionMonth) === fy,
    )

    const map = new Map<string, CustomerMonthlyMetrics>()
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

    const months = getMonthsInFiscalYear(fy)
    return months.map(
      (m) => map.get(m) || { month: m, revenue: 0, grossProfit: 0, grossProfitRate: 0, dealCount: 0 },
    )
  }

  function getCustomerKpiSummary(fy: number, accountName: string): CustomerKpiSummary {
    const confirmedMonth = getLatestConfirmedMonth()
    const deals = wonDeals.value.filter(
      (d) =>
        d.accountName === accountName &&
        getFiscalYear(d.completionMonth) === fy &&
        d.completionMonth <= confirmedMonth,
    )

    const totalRevenue = deals.reduce((s, d) => s + d.totalAmount, 0)
    const totalGrossProfit = deals.reduce((s, d) => s + d.grossProfit, 0)
    const activeMonths = new Set(deals.map((d) => d.completionMonth))
    const tenureMonths = activeMonths.size

    return {
      totalRevenue,
      totalGrossProfit,
      grossProfitRate: totalRevenue !== 0 ? totalGrossProfit / totalRevenue : 0,
      dealCount: deals.length,
      tenureMonths,
      avgDealSize: deals.length > 0 ? totalRevenue / deals.length : 0,
      ltv: totalGrossProfit,
      revenuePerMonth: tenureMonths > 0 ? totalRevenue / tenureMonths : 0,
      gpPerMonth: tenureMonths > 0 ? totalGrossProfit / tenureMonths : 0,
    }
  }

  function getDealList(fy: number, accountName: string) {
    const confirmedMonth = getLatestConfirmedMonth()
    return wonDeals.value
      .filter(
        (d) =>
          d.accountName === accountName &&
          getFiscalYear(d.completionMonth) === fy &&
          d.completionMonth <= confirmedMonth,
      )
      .sort((a, b) => a.completionMonth.localeCompare(b.completionMonth))
  }

  function generateCustomerAnalysis(fy: number, accountName: string): CustomerAnalysis {
    const summary = getCustomerKpiSummary(fy, accountName)
    const monthly = getCustomerMonthlyMetrics(fy, accountName)
    const confirmedMonth = getLatestConfirmedMonth()

    const indicators: CustomerAnalysis['indicators'] = []

    // 粗利率
    const gprStatus: 'success' | 'warning' | 'error' =
      summary.grossProfitRate >= 0.3 ? 'success' : summary.grossProfitRate >= 0.15 ? 'warning' : 'error'
    indicators.push({
      label: '粗利率',
      value: formatPercent(summary.grossProfitRate),
      status: gprStatus,
    })

    // LTV（累計粗利）
    indicators.push({
      label: 'LTV（累計粗利）',
      value: formatCurrency(summary.ltv),
      status: summary.ltv > 0 ? 'success' : 'warning',
    })

    // 継続月
    const tenureStatus: 'success' | 'warning' | 'error' =
      summary.tenureMonths >= 4 ? 'success' : summary.tenureMonths >= 2 ? 'warning' : 'error'
    indicators.push({
      label: '継続月',
      value: `${summary.tenureMonths}ヶ月`,
      status: tenureStatus,
    })

    // 月あたり粗利
    const gpPerMonthStatus: 'success' | 'warning' | 'error' =
      summary.gpPerMonth >= 200000 ? 'success' : summary.gpPerMonth >= 50000 ? 'warning' : 'error'
    indicators.push({
      label: '月あたり粗利',
      value: formatCurrency(Math.round(summary.gpPerMonth)),
      status: gpPerMonthStatus,
    })

    // 平均案件単価
    indicators.push({
      label: '平均案件単価',
      value: formatCurrency(Math.round(summary.avgDealSize)),
      status: summary.avgDealSize >= 500000 ? 'success' : summary.avgDealSize >= 100000 ? 'warning' : 'error',
    })

    // ARPU（月平均売上）
    const arpuStatus: 'success' | 'warning' | 'error' =
      summary.revenuePerMonth >= 300000 ? 'success' : summary.revenuePerMonth >= 100000 ? 'warning' : 'error'
    indicators.push({
      label: 'ARPU（月平均売上）',
      value: formatCurrency(Math.round(summary.revenuePerMonth)),
      status: arpuStatus,
    })

    // トレンド判定
    const confirmedMonthly = monthly.filter((m) => m.month <= confirmedMonth && m.dealCount > 0)
    const firstHalf = confirmedMonthly.slice(0, Math.ceil(confirmedMonthly.length / 2))
    const secondHalf = confirmedMonthly.slice(Math.ceil(confirmedMonthly.length / 2))

    const firstAvgGP =
      firstHalf.length > 0 ? firstHalf.reduce((s, m) => s + m.grossProfit, 0) / firstHalf.length : 0
    const secondAvgGP =
      secondHalf.length > 0 ? secondHalf.reduce((s, m) => s + m.grossProfit, 0) / secondHalf.length : 0

    const trendUp = secondHalf.length > 0 && secondAvgGP > firstAvgGP * 1.1
    const trendDown = secondHalf.length > 0 && secondAvgGP < firstAvgGP * 0.9

    // 評価文
    let evaluation = ''
    if (summary.dealCount === 0) {
      evaluation = '当該会計年度において取引実績がありません。過去の取引履歴を確認し、再アプローチの可能性を検討してください。'
    } else if (gprStatus === 'success' && tenureStatus === 'success') {
      evaluation = `安定した取引関係が継続しており、粗利率も良好です。${summary.tenureMonths}ヶ月にわたり計${summary.dealCount}件の受注があり、優良顧客と評価できます。`
    } else if (gprStatus === 'success' && tenureStatus !== 'success') {
      evaluation = `粗利率は良好ですが、取引期間が${summary.tenureMonths}ヶ月と短期です。継続的な取引関係の構築に注力することで、さらなるLTV向上が見込めます。`
    } else if (gprStatus === 'warning') {
      evaluation = `粗利率が注意水準にあります。案件内容を精査し、高付加価値サービスの提案や原価構造の見直しを検討する必要があります。`
    } else {
      evaluation = `粗利率が改善必要な水準です。外注費比率やサービス単価を見直し、利益率の改善を最優先課題として取り組んでください。`
    }

    if (trendUp) {
      evaluation += ' 直近の取引では粗利が上昇傾向にあり、好ましい推移です。'
    } else if (trendDown) {
      evaluation += ' 直近の取引では粗利が下降傾向にあり、要因分析が必要です。'
    }

    // 改善ポイント
    const improvementPoints: string[] = []
    if (gprStatus !== 'success') {
      improvementPoints.push('粗利率の改善: サービス単価の見直しや外注費の最適化を検討する')
    }
    if (tenureStatus !== 'success') {
      improvementPoints.push('取引継続性の向上: 定期的なフォローアップと追加提案により、リピート率を高める')
    }
    if (trendDown) {
      improvementPoints.push('下降トレンドへの対応: 直近の案件を分析し、粗利低下の原因を特定する')
    }
    if (summary.dealCount <= 2) {
      improvementPoints.push('取引深耕: 案件数が少ないため、クロスセル・アップセルの機会を積極的に探る')
    }
    if (improvementPoints.length === 0) {
      improvementPoints.push('現在の良好な取引関係を維持しつつ、更なるサービス拡大の機会を模索する')
    }

    // アクション提案
    const actionProposals: string[] = []
    if (gprStatus !== 'success') {
      actionProposals.push('次回提案時に付加価値の高いオプションサービスを組み合わせ、案件単価と利益率の向上を図る')
    }
    if (tenureStatus !== 'success') {
      actionProposals.push('定期的な業務レビューミーティングを設定し、顧客ニーズを継続的に把握する')
    }
    if (summary.tenureMonths >= 4 && gprStatus === 'success') {
      actionProposals.push('優良顧客として他サービスの横展開や長期契約の提案を行う')
    }
    actionProposals.push('CS担当者と営業担当が連携し、顧客の満足度向上とリテンション施策を定期的に見直す')

    // リスク分類
    let riskLevel: 'at-risk' | 'stable' | 'growth'
    let followUpRecommendation: string

    if ((summary.tenureMonths <= 2 && trendDown) || summary.grossProfitRate < 0.15) {
      riskLevel = 'at-risk'
      followUpRecommendation = '早急なフォローアップが必要です。担当者による訪問・ヒアリングを実施し、取引継続に向けた課題を特定してください。粗利率改善のための価格・サービス見直しも検討してください。'
    } else if (summary.grossProfitRate >= 0.30 && trendUp) {
      riskLevel = 'growth'
      followUpRecommendation = 'アップセル・クロスセルの好機です。追加サービスの提案や取引拡大に向けた戦略的アプローチを検討してください。優良顧客としてリレーション強化を図りましょう。'
    } else {
      riskLevel = 'stable'
      followUpRecommendation = '安定した取引関係を維持しています。定期的なフォローアップを継続し、顧客満足度の維持と新たなニーズの発掘に努めてください。'
    }

    return {
      indicators,
      evaluation,
      improvementPoints,
      actionProposals,
      riskLevel,
      followUpRecommendation,
    }
  }

  function getUniqueCustomers(fy: number): string[] {
    const deals = wonDeals.value.filter((d) => getFiscalYear(d.completionMonth) === fy)
    const names = new Set<string>()
    for (const d of deals) {
      if (d.accountName) names.add(d.accountName)
    }
    return Array.from(names).sort()
  }

  return {
    getCustomerMonthlyMetrics,
    getCustomerKpiSummary,
    getDealList,
    generateCustomerAnalysis,
    getUniqueCustomers,
  }
}
