# CS KPI Manager - AGENTS.md

## プロジェクト概要
CS事業部のKPI（売上・粗利・LTV/CAC・MRR/NRR・担当別パフォーマンス）を統合管理・可視化するダッシュボードアプリ。

## 技術スタック
- **Framework**: Nuxt 4 (Vue 3 + TypeScript, `compatibilityDate: 2025-07-15`)
- **Chart**: Chart.js + vue-chartjs
- **CSV**: PapaParse
- **Deploy**: SSG (`nuxt generate`)
- **UI**: Atlassian Design System準拠（カスタムCSS）

## 会計年度定義
- **期首**: 9月1日 / **期末**: 8月31日
- FY2026 = 2025/09 〜 2026/08
- currentDate = 2026-03-01（最新確定月: 2026/02）

## ディレクトリ構成
```
cs-kpi-manager/
├── app/
│   ├── app.vue
│   ├── layouts/default.vue
│   ├── pages/ (index, performance, unit-economics, mrr-nrr, staff)
│   ├── components/ (layout/, charts/, kpi/, common/)
│   ├── composables/ (useDataset, usePerformance, useUnitEconomics, useMrr, useStaffMetrics)
│   ├── utils/ (csvParser, fiscalYear, formatters)
│   └── assets/styles/atlassian.css
├── public/data/dataset20260228.csv
└── nuxt.config.ts
```

## コーディング規約
- Composition API (`<script setup lang="ts">`) 必須
- TypeScript 必須
- composables はシングルトンパターン（module-level ref でグローバルキャッシュ）
- Atlassian Design System CSS変数を使用

## データセット列定義
| 列名 | 説明 |
|------|------|
| ステージ | `7 受注` / `8 予定` |
| 自動番号 | 商談ID（例: S24248）|
| 商談名 | 商談の名称 |
| 取引先名 | 顧客企業名 |
| 種類 | GEPPY CRM, GEPPY CP, サイト運用保守, SNS運用, システム/アプリ保守 等 |
| 粗利 | 通貨文字列（例: `"¥ 1,234,567."`, `"-¥ 12,000."`）|
| 総額 | 通貨文字列 |
| 外注総額(レポート用) | 通貨文字列 |
| 商談の担当者 | 営業担当者名 |
| CS担当 | CS担当者名 |
| 獲得元施策 | `00_既存`, `01_LP（広告）` 等 |
| 対応チーム | CS 等 |
| 完了月 | `YYYY/MM` 形式 |
| 外注費合計 | 数値 |

## KPI算出ロジック
- **業績**: 完了月ごとの売上高(総額)・粗利高(粗利)・粗利率(粗利/総額)
- **LTV**: 取引先名でグループ化 → 累計粗利 / ユニーク顧客数
- **CAC**: 広告系獲得元施策の外注費合計 / 新規顧客数
- **MRR対象種類**: GEPPY CRM, システム/アプリ保守, サイト運用保守, SNS運用
- **NRR**: (期首MRR + Expansion - Contraction - Churn) / 期首MRR

## GitHub MCP
```bash
claude mcp add github -- gh api graphql -f query='{ viewer { login } }'
```
