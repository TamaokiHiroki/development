<script setup lang="ts">
import { formatCurrency, formatCurrencyMan, formatPercent } from '~/utils/formatters'
import { getCurrentFiscalYear } from '~/utils/fiscalYear'

const { loadData, loaded } = useDataset()
const { getCustomerSegments, getUnitEconomics, getOneOffCustomers } = useUnitEconomics()
const { generateCustomerAnalysis } = useCustomerDetail()

await loadData()

const fy = ref(getCurrentFiscalYear())

const customers = computed(() => getCustomerSegments(fy.value))
const ue = computed(() => getUnitEconomics(fy.value))
const oneOffCustomerNames = computed(() =>
  new Set(getOneOffCustomers(fy.value).map((c) => c.accountName)),
)

const searchQuery = ref('')
const showOneOffOnly = ref(false)

const filteredCustomers = computed(() => {
  let result = customers.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((c) => c.accountName.toLowerCase().includes(q))
  }
  if (showOneOffOnly.value) {
    result = result.filter((c) => oneOffCustomerNames.value.has(c.accountName))
  }
  return result
})

// リスク分類マップ
const customerRiskMap = computed(() => {
  const map = new Map<string, 'at-risk' | 'stable' | 'growth'>()
  for (const c of customers.value) {
    const analysis = generateCustomerAnalysis(fy.value, c.accountName)
    map.set(c.accountName, analysis.riskLevel)
  }
  return map
})

const riskLabels: Record<string, string> = {
  'at-risk': 'リスクあり',
  stable: '安定',
  growth: 'アップセル機会',
}
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>顧客分析</h2>
      <p>取引先ごとのユニットエコノミクスと評価分析を表示します</p>
    </div>

    <!-- KPIサマリーカード -->
    <div class="kpi-grid">
      <KpiCard label="LTV:CAC比" :value="ue.ltvCacRatio.toFixed(1)" />
      <KpiCard label="LTV（平均顧客生涯価値）" :value="formatCurrencyMan(ue.ltv)" />
      <KpiCard label="CAC（顧客獲得コスト）" :value="formatCurrencyMan(ue.cac)" />
      <KpiCard label="ARPU（月次）" :value="formatCurrencyMan(ue.arpu)" />
    </div>

    <!-- フィルター -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">会計年度</label>
        <select v-model="fy" class="filter-select">
          <option :value="2026">FY2026</option>
          <option :value="2025">FY2025</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">取引先検索</label>
        <input
          v-model="searchQuery"
          type="text"
          class="filter-input"
          placeholder="取引先名で検索..."
        />
      </div>
      <div class="filter-group">
        <label class="filter-label">フィルター</label>
        <div class="toggle-buttons">
          <button
            class="toggle-btn"
            :class="{ active: !showOneOffOnly }"
            @click="showOneOffOnly = false"
          >
            全顧客
          </button>
          <button
            class="toggle-btn"
            :class="{ active: showOneOffOnly }"
            @click="showOneOffOnly = true"
          >
            単発案件のみ
          </button>
        </div>
      </div>
    </div>

    <!-- 顧客一覧 -->
    <div class="customer-list-wrapper">
      <div class="data-table-wrapper">
        <div class="data-table-header">
          <span class="data-table-title">取引先一覧（{{ filteredCustomers.length }}社）</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>取引先名</th>
              <th class="text-right">売上高</th>
              <th class="text-right">粗利高</th>
              <th class="text-right">粗利率</th>
              <th class="text-right">継続月</th>
              <th class="text-right">案件数</th>
              <th>ステータス</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCustomers" :key="c.accountName">
              <td>
                <NuxtLink :to="`/customer/${encodeURIComponent(c.accountName)}`" class="customer-link">
                  {{ c.accountName }}
                </NuxtLink>
              </td>
              <td class="text-right">{{ formatCurrency(c.totalRevenue) }}</td>
              <td class="text-right">{{ formatCurrency(c.totalGP) }}</td>
              <td class="text-right">{{ formatPercent(c.grossProfitRate) }}</td>
              <td class="text-right">{{ c.tenureMonths }}ヶ月</td>
              <td class="text-right">{{ c.dealCount }}</td>
              <td>
                <span
                  class="risk-badge"
                  :class="`risk-badge--${customerRiskMap.get(c.accountName)}`"
                >
                  {{ riskLabels[customerRiskMap.get(c.accountName) || 'stable'] }}
                </span>
              </td>
              <td class="text-right">
                <NuxtLink :to="`/customer/${encodeURIComponent(c.accountName)}`" class="detail-btn">
                  詳細
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="8" style="text-align: center; padding: 24px; color: var(--color-text-subtle);">
                該当する取引先がありません
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: var(--space-md);
  align-items: flex-end;
  margin-bottom: var(--space-lg);
  padding: var(--space-md);
  background: var(--color-card);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.filter-select,
.filter-input {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  color: var(--color-text);
  background: var(--color-card);
  min-width: 200px;
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 82, 204, 0.2);
}

.customer-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}

.customer-link:hover {
  text-decoration: underline;
}

.detail-btn {
  display: inline-block;
  padding: 4px 12px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius);
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}

.detail-btn:hover {
  background: #0747A6;
}

.toggle-buttons {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.toggle-btn {
  padding: 6px 14px;
  border: none;
  background: var(--color-card);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-subtle);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.toggle-btn + .toggle-btn {
  border-left: 1px solid var(--color-border);
}

.toggle-btn.active {
  background: var(--color-primary);
  color: #fff;
}

.risk-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.risk-badge--at-risk {
  background: var(--color-error-light, #FFEBE6);
  color: var(--color-error);
}

.risk-badge--stable {
  background: #FFF0B3;
  color: #FF8B00;
}

.risk-badge--growth {
  background: #E3FCEF;
  color: #006644;
}
</style>
