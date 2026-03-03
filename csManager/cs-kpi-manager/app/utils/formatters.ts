/**
 * 数値を通貨形式にフォーマット
 * 例: 1234567 → "¥1,234,567"
 */
export function formatCurrency(n: number): string {
  if (n < 0) {
    return `-¥${Math.abs(n).toLocaleString('ja-JP')}`
  }
  return `¥${n.toLocaleString('ja-JP')}`
}

/**
 * 数値を万円単位の通貨形式にフォーマット
 * 例: 1234567 → "¥123.5万"
 */
export function formatCurrencyMan(n: number): string {
  const man = n / 10000
  if (n < 0) {
    return `-¥${Math.abs(man).toFixed(1)}万`
  }
  return `¥${man.toFixed(1)}万`
}

/**
 * 数値をパーセント形式にフォーマット
 * 例: 0.123 → "12.3%"
 */
export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

/**
 * トレンド表示（前月比など）
 * 戻り値: { text: "+15.2%", direction: "up" | "down" | "flat", color: string }
 */
export function formatTrend(
  current: number,
  previous: number,
): { text: string; direction: 'up' | 'down' | 'flat'; color: string } {
  if (previous === 0) {
    return { text: '-', direction: 'flat', color: 'var(--color-text)' }
  }
  const change = (current - previous) / Math.abs(previous)
  const pct = (change * 100).toFixed(1)

  if (change > 0.001) {
    return {
      text: `+${pct}%`,
      direction: 'up',
      color: 'var(--color-success)',
    }
  } else if (change < -0.001) {
    return {
      text: `${pct}%`,
      direction: 'down',
      color: 'var(--color-error)',
    }
  }
  return { text: '±0%', direction: 'flat', color: 'var(--color-text)' }
}

/**
 * 数値を短縮表示
 * 例: 1234567 → "123万"
 */
export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 100_000_000) {
    return `${sign}${(abs / 100_000_000).toFixed(1)}億`
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 10_000)}万`
  }
  return `${sign}${abs.toLocaleString('ja-JP')}`
}
