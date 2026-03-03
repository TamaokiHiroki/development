<script setup lang="ts">
import { formatCurrency, formatPercent } from '~/utils/formatters'
import { getCurrentFiscalYear } from '~/utils/fiscalYear'

const { loadData, loaded } = useDataset()
const { getCustomerSegments } = useUnitEconomics()

await loadData()

const fy = ref(getCurrentFiscalYear())

const customers = computed(() => getCustomerSegments(fy.value))

const searchQuery = ref('')

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const q = searchQuery.value.toLowerCase()
  return customers.value.filter((c) => c.accountName.toLowerCase().includes(q))
})
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>顧客詳細</h2>
      <p>取引先ごとのユニットエコノミクスと評価分析を表示します</p>
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
              <td class="text-right">
                <NuxtLink :to="`/customer/${encodeURIComponent(c.accountName)}`" class="detail-btn">
                  詳細
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" style="text-align: center; padding: 24px; color: var(--color-text-subtle);">
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
</style>
