/**
 * 会計年度ユーティリティ
 * 期首: 9月1日 / 期末: 8月31日
 * FY2026 = 2025/09 〜 2026/08
 */

/**
 * YYYY/MM 文字列から会計年度を返す
 * 例: "2025/09" → 2026, "2026/08" → 2026, "2026/09" → 2027
 */
export function getFiscalYear(monthStr: string): number {
  const [year, month] = monthStr.split('/').map(Number)
  return month >= 9 ? year + 1 : year
}

/**
 * YYYY/MM 文字列からFY内の月番号を返す（9月=1, 8月=12）
 */
export function getFiscalMonth(monthStr: string): number {
  const month = parseInt(monthStr.split('/')[1], 10)
  return month >= 9 ? month - 8 : month + 4
}

/**
 * YYYY/MM 文字列から四半期を返す
 * Q1: 9-11月, Q2: 12-2月, Q3: 3-5月, Q4: 6-8月
 */
export function getFiscalQuarter(monthStr: string): number {
  const fm = getFiscalMonth(monthStr)
  return Math.ceil(fm / 3)
}

/**
 * 会計年度の全月リストを返す（YYYY/MM形式）
 * FY2026 → ["2025/09", "2025/10", ..., "2026/08"]
 */
export function getMonthsInFiscalYear(fy: number): string[] {
  const months: string[] = []
  // 9月〜12月は前年
  for (let m = 9; m <= 12; m++) {
    months.push(`${fy - 1}/${String(m).padStart(2, '0')}`)
  }
  // 1月〜8月は当年
  for (let m = 1; m <= 8; m++) {
    months.push(`${fy}/${String(m).padStart(2, '0')}`)
  }
  return months
}

/**
 * 現在の会計年度を返す（currentDate = 2026-03-01 → FY2026）
 */
export function getCurrentFiscalYear(): number {
  return 2026
}

/**
 * 最新確定月を返す（2026/02）
 */
export function getLatestConfirmedMonth(): string {
  return '2026/02'
}

/**
 * 会計年度の表示ラベル
 */
export function formatFiscalYear(fy: number): string {
  return `FY${fy}`
}

/**
 * YYYY/MM を「YYYY年M月」に変換
 */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('/')
  return `${year}年${parseInt(month, 10)}月`
}

/**
 * YYYY/MM を短い表示「M月」に変換
 */
export function formatMonthShort(monthStr: string): string {
  const month = parseInt(monthStr.split('/')[1], 10)
  return `${month}月`
}

/**
 * 会計年度の経過月数を返す（確定月ベース）
 */
export function getElapsedMonths(fy: number): number {
  const months = getMonthsInFiscalYear(fy)
  const confirmed = getLatestConfirmedMonth()
  return months.filter(m => m <= confirmed).length
}
