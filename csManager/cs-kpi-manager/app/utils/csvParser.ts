import Papa from 'papaparse'

export interface DealRecord {
  stage: string
  dealId: string
  dealName: string
  accountName: string
  type: string
  grossProfit: number
  totalAmount: number
  outsourcingTotal: number
  salesRep: string
  csRep: string
  acquisitionSource: string
  team: string
  completionMonth: string // YYYY/MM
  outsourcingCostTotal: number
}

/**
 * 通貨文字列を数値に変換
 * 例: "¥ 1,234,567." → 1234567, "-¥ 12,000." → -12000, "¥ 0." → 0
 */
export function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0
  const cleaned = value.replace(/[¥\s,\.]/g, '')
  if (cleaned === '' || cleaned === '-') return 0
  return parseInt(cleaned, 10)
}

/**
 * CSVの生データを DealRecord に変換
 */
function mapRow(row: Record<string, string>): DealRecord {
  return {
    stage: (row['ステージ'] || '').trim(),
    dealId: (row['自動番号'] || '').trim(),
    dealName: (row['商談名'] || '').trim(),
    accountName: (row['取引先名'] || '').trim(),
    type: (row['種類'] || '').trim(),
    grossProfit: parseCurrency(row['粗利'] || ''),
    totalAmount: parseCurrency(row['総額'] || ''),
    outsourcingTotal: parseCurrency(row['外注総額(レポート用)'] || ''),
    salesRep: (row['商談の担当者'] || '').trim(),
    csRep: (row['CS担当'] || '').trim(),
    acquisitionSource: (row['獲得元施策'] || '').trim(),
    team: (row['対応チーム'] || '').trim(),
    completionMonth: (row['完了月'] || '').trim(),
    outsourcingCostTotal: parseInt(row['外注費合計'] || '0', 10) || 0,
  }
}

/**
 * CSV文字列をパースして DealRecord[] を返す
 */
export function parseCSV(csvText: string): DealRecord[] {
  // BOM除去
  const text = csvText.replace(/^\uFEFF/, '')

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data
    .map(mapRow)
    .filter((r) => r.dealId && r.completionMonth)
}
