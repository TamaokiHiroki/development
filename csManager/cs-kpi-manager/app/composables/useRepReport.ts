import { useDataset } from './useDataset'
import { useCsReps } from './useCsReps'
import { useGoals } from './useGoals'
import { getFiscalYear, getMonthsInFiscalYear, getLatestConfirmedMonth } from '~/utils/fiscalYear'
import { formatCurrency, formatPercent } from '~/utils/formatters'

export interface RepMonthlyMetrics {
  month: string
  revenue: number
  grossProfit: number
  grossProfitRate: number
  dealCount: number
}

export interface RepKpiSummary {
  ytdRevenue: number
  ytdGrossProfit: number
  ytdGrossProfitRate: number
  ytdDealCount: number
}

export interface RoleAnalysis {
  indicators: { label: string; value: string; status: 'success' | 'warning' | 'error' }[]
  evaluation: string
  improvementPoints: string[]
  actionProposals: string[]
}

type RoleCategory = 'manager' | 'leader' | 'member'

function classifyRole(grade: string): RoleCategory {
  if (['エバンジェリスト', 'プロデューサー', 'マネージャー'].includes(grade)) return 'manager'
  if (['リーダー', 'スペシャリスト'].includes(grade)) return 'leader'
  return 'member'
}

export function useRepReport() {
  const { wonDeals } = useDataset()
  const { getCsRepByName } = useCsReps()
  const { getGoal } = useGoals()

  function getRepMonthlyMetrics(fy: number, repName: string): RepMonthlyMetrics[] {
    const fyRepDeals = wonDeals.value.filter(
      (d) => d.csRep === repName && getFiscalYear(d.completionMonth) === fy,
    )

    const map = new Map<string, RepMonthlyMetrics>()
    for (const d of fyRepDeals) {
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

  function getRepKpiSummary(fy: number, repName: string): RepKpiSummary {
    const confirmedMonth = getLatestConfirmedMonth()
    const fyRepDeals = wonDeals.value.filter(
      (d) =>
        d.csRep === repName &&
        getFiscalYear(d.completionMonth) === fy &&
        d.completionMonth <= confirmedMonth,
    )

    const ytdRevenue = fyRepDeals.reduce((s, d) => s + d.totalAmount, 0)
    const ytdGrossProfit = fyRepDeals.reduce((s, d) => s + d.grossProfit, 0)

    return {
      ytdRevenue,
      ytdGrossProfit,
      ytdGrossProfitRate: ytdRevenue !== 0 ? ytdGrossProfit / ytdRevenue : 0,
      ytdDealCount: fyRepDeals.length,
    }
  }

  function generateRepAnalysis(fy: number, repName: string, grade: string, supplement: string, revenueTarget = 0, grossProfitTarget = 0): RoleAnalysis {
    const role = classifyRole(grade)
    const monthly = getRepMonthlyMetrics(fy, repName)
    const summary = getRepKpiSummary(fy, repName)
    const goal = getGoal(fy)

    const indicators: RoleAnalysis['indicators'] = []

    // 共通指標: 粗利率
    const gprStatus: 'success' | 'warning' | 'error' =
      summary.ytdGrossProfitRate >= 0.3 ? 'success' : summary.ytdGrossProfitRate >= 0.15 ? 'warning' : 'error'
    indicators.push({
      label: 'YTD粗利率',
      value: formatPercent(summary.ytdGrossProfitRate),
      status: gprStatus,
    })

    // 共通指標: YTD売上高
    indicators.push({
      label: 'YTD売上高',
      value: formatCurrency(summary.ytdRevenue),
      status: summary.ytdRevenue > 0 ? 'success' : 'warning',
    })

    // 役職別指標
    if (role === 'manager' && goal) {
      const achieveRate = goal.revenueTarget > 0 ? summary.ytdRevenue / goal.revenueTarget : 0
      const achieveStatus: 'success' | 'warning' | 'error' =
        achieveRate >= 0.8 ? 'success' : achieveRate >= 0.5 ? 'warning' : 'error'
      indicators.push({
        label: 'FY目標達成率（売上）',
        value: formatPercent(achieveRate),
        status: achieveStatus,
      })
    }

    // 個人目標達成率（全ロール共通、目標設定時のみ）
    let personalRevenueAchieveRate = 0
    let personalGpAchieveRate = 0
    if (revenueTarget > 0) {
      personalRevenueAchieveRate = summary.ytdRevenue / revenueTarget
      const revStatus: 'success' | 'warning' | 'error' =
        personalRevenueAchieveRate >= 0.8 ? 'success' : personalRevenueAchieveRate >= 0.5 ? 'warning' : 'error'
      indicators.push({
        label: '売上目標達成率',
        value: formatPercent(personalRevenueAchieveRate),
        status: revStatus,
      })
    }
    if (grossProfitTarget > 0) {
      personalGpAchieveRate = summary.ytdGrossProfit / grossProfitTarget
      const gpStatus: 'success' | 'warning' | 'error' =
        personalGpAchieveRate >= 0.8 ? 'success' : personalGpAchieveRate >= 0.5 ? 'warning' : 'error'
      indicators.push({
        label: '粗利目標達成率',
        value: formatPercent(personalGpAchieveRate),
        status: gpStatus,
      })
    }

    if (role === 'manager') {
      const avgDealSize =
        summary.ytdDealCount > 0 ? summary.ytdRevenue / summary.ytdDealCount : 0
      indicators.push({
        label: '平均案件単価',
        value: formatCurrency(avgDealSize),
        status: avgDealSize >= 500000 ? 'success' : avgDealSize >= 200000 ? 'warning' : 'error',
      })
    }

    if (role === 'leader' || role === 'member') {
      const confirmedMonth = getLatestConfirmedMonth()
      const confirmedMonths = getMonthsInFiscalYear(fy).filter((m) => m <= confirmedMonth)
      const monthCount = confirmedMonths.length || 1
      const avgDealsPerMonth = summary.ytdDealCount / monthCount
      const dealStatus: 'success' | 'warning' | 'error' =
        avgDealsPerMonth >= 10 ? 'success' : avgDealsPerMonth >= 5 ? 'warning' : 'error'
      indicators.push({
        label: '月平均案件数',
        value: `${avgDealsPerMonth.toFixed(1)}件`,
        status: dealStatus,
      })
    }

    // トレンド判定: 直近3ヶ月 vs 最初3ヶ月
    const confirmedMonth = getLatestConfirmedMonth()
    const confirmedMonthly = monthly.filter((m) => m.month <= confirmedMonth)
    const firstThree = confirmedMonthly.slice(0, 3)
    const lastThree = confirmedMonthly.slice(-3)

    const firstAvgGP =
      firstThree.length > 0
        ? firstThree.reduce((s, m) => s + m.grossProfit, 0) / firstThree.length
        : 0
    const lastAvgGP =
      lastThree.length > 0
        ? lastThree.reduce((s, m) => s + m.grossProfit, 0) / lastThree.length
        : 0

    const trendUp = lastAvgGP > firstAvgGP * 1.05
    const trendDown = lastAvgGP < firstAvgGP * 0.95

    // 評価文
    let evaluation = ''
    if (role === 'manager') {
      if (gprStatus === 'success' && !trendDown) {
        evaluation = '全体的に安定した収益構造を維持しています。チーム全体の粗利率も良好で、持続的な成長が期待できます。'
      } else if (gprStatus === 'warning') {
        evaluation = '粗利率が注意水準にあります。原価構造の見直しや高収益案件へのシフトを検討する必要があります。'
      } else {
        evaluation = '粗利率が改善必要な水準です。案件ポートフォリオの抜本的な見直しが求められます。'
      }
    } else if (role === 'leader') {
      if (gprStatus === 'success' && !trendDown) {
        evaluation = 'チームを牽引する実績を上げています。粗利率も良好で、メンバー育成の観点でもロールモデルとなっています。'
      } else if (gprStatus === 'warning') {
        evaluation = '一定の成果は出ていますが、粗利率に改善の余地があります。案件の選別と効率化を意識しましょう。'
      } else {
        evaluation = '粗利率が低い水準です。案件の進め方や工数管理を見直し、利益率の改善を優先してください。'
      }
    } else {
      if (gprStatus === 'success' && !trendDown) {
        evaluation = '安定した成果を出しています。引き続き案件品質を維持しながら、対応幅を広げていきましょう。'
      } else if (gprStatus === 'warning') {
        evaluation = '粗利率が注意水準です。高単価案件への取り組みや、外注比率の見直しを検討してください。'
      } else {
        evaluation = '粗利率の改善が必要です。上長と相談し、案件構成の見直しやスキルアップに取り組みましょう。'
      }
    }

    if (trendUp) {
      evaluation += ' なお、直近の粗利推移は上昇傾向にあり、改善が進んでいます。'
    } else if (trendDown) {
      evaluation += ' 直近の粗利推移は下降傾向にあり、早期の対策が求められます。'
    }

    if (supplement) {
      evaluation += ` 補足情報「${supplement}」を踏まえ、個別の状況に応じたフォローが推奨されます。`
    }

    // 個人目標に関する評価
    if (revenueTarget > 0) {
      if (personalRevenueAchieveRate >= 1.0) {
        evaluation += ' 売上目標を達成しており、優秀な成果です。'
      } else if (personalRevenueAchieveRate >= 0.8) {
        evaluation += ' 売上目標の達成の見込みがあります。'
      } else if (personalRevenueAchieveRate >= 0.5) {
        evaluation += ' 売上目標の達成に向けてペースアップが必要です。'
      } else {
        evaluation += ' 売上目標の達成率が低く、緊急の対策が求められます。'
      }
    }
    if (grossProfitTarget > 0 && personalGpAchieveRate < 0.5) {
      evaluation += ' 粗利目標の達成率が低く、案件構成の見直しが必要です。'
    }

    // 改善ポイント
    const improvementPoints: string[] = []
    if (gprStatus !== 'success') {
      improvementPoints.push('粗利率の向上: 外注費の最適化や高付加価値サービスの提案を強化する')
    }
    if (trendDown) {
      improvementPoints.push('下降トレンドの歯止め: 直近の案件内容を精査し、収益悪化の要因を特定する')
    }
    if (summary.ytdDealCount === 0) {
      improvementPoints.push('案件獲得: 担当案件がないため、パイプラインの確認とアサインの見直しが必要')
    }
    if (role === 'leader' || role === 'member') {
      const confirmedMonths = getMonthsInFiscalYear(fy).filter((m) => m <= confirmedMonth)
      const monthCount = confirmedMonths.length || 1
      const avgDeals = summary.ytdDealCount / monthCount
      if (avgDeals < 5) {
        improvementPoints.push('案件数の増加: 月平均案件数が少ないため、パイプライン強化に取り組む')
      }
    }
    if (revenueTarget > 0 && personalRevenueAchieveRate < 0.8) {
      improvementPoints.push('売上目標の達成: 残期間の売上計画を見直し、パイプラインの充実を図る')
    }
    if (grossProfitTarget > 0 && personalGpAchieveRate < 0.8) {
      improvementPoints.push('粗利目標の達成: 高利益率案件の獲得を優先し、外注費の最適化を検討する')
    }
    if (improvementPoints.length === 0) {
      improvementPoints.push('現状の水準を維持しつつ、さらなる成長機会を探る')
    }

    // アクション提案
    const actionProposals: string[] = []
    if (role === 'manager') {
      if (gprStatus !== 'success') {
        actionProposals.push('高単価・高利益率案件のポートフォリオ比率を引き上げる戦略を策定する')
      }
      if (goal) {
        const achieveRate = goal.revenueTarget > 0 ? summary.ytdRevenue / goal.revenueTarget : 0
        if (achieveRate < 0.8) {
          actionProposals.push('目標達成に向けた月次アクションプランを再策定し、進捗を週次で確認する')
        }
      }
      actionProposals.push('チームメンバーの案件状況を定期的にレビューし、必要に応じてリソース配分を調整する')
    } else if (role === 'leader') {
      if (gprStatus !== 'success') {
        actionProposals.push('担当案件の原価構造を見直し、外注費削減や内製化の可能性を検討する')
      }
      actionProposals.push('メンバーの育成計画を立て、ナレッジ共有の場を定期開催する')
      if (trendDown) {
        actionProposals.push('直近3ヶ月の案件を振り返り、利益率低下の原因分析を実施する')
      }
    } else {
      if (gprStatus !== 'success') {
        actionProposals.push('高付加価値な提案ができるようスキルアップ研修やOJTに積極的に参加する')
      }
      actionProposals.push('既存顧客との関係深化を図り、追加案件やアップセル機会を創出する')
      if (trendDown) {
        actionProposals.push('上長との1on1で現状の課題を共有し、改善策を一緒に検討する')
      }
    }

    if (revenueTarget > 0 && personalRevenueAchieveRate < 0.8) {
      actionProposals.push('個人売上目標の達成に向け、見込み案件の早期クロージングと新規案件の開拓を並行して進める')
    }
    if (grossProfitTarget > 0 && personalGpAchieveRate < 0.8) {
      actionProposals.push('粗利目標達成のため、案件ごとの原価を精査し、利益率改善の余地がある案件を特定する')
    }

    if (supplement) {
      actionProposals.push(`補足事項「${supplement}」に基づき、担当者固有の状況を考慮した支援を行う`)
    }

    return {
      indicators,
      evaluation,
      improvementPoints,
      actionProposals,
    }
  }

  return {
    getRepMonthlyMetrics,
    getRepKpiSummary,
    generateRepAnalysis,
    classifyRole,
  }
}

export { classifyRole }
