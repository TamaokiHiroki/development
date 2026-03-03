<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { formatMonth } from '~/utils/fiscalYear'

const { loadData, loaded, dataset, updateRecord, bulkUpdateRecords, uniqueTypes, uniqueCsReps } = useDataset()
const { csReps, loadCsReps } = useCsReps()
const { success: toastSuccess } = useToast()

await loadData()

onMounted(() => {
  loadCsReps()
})

// Filters
const searchQuery = ref('')
const filterType = ref('all')
const filterCsRep = ref('all')
const currentPage = ref(1)
const pageSize = 20

// Editing state
const editingId = ref<string | null>(null)
const editCsRep = ref('')
const editType = ref('')

// Bulk edit state
const selectedIds = ref<Set<string>>(new Set())
const bulkCsRep = ref('')
const bulkType = ref('')

const isAllCurrentPageSelected = computed(() => {
  if (paginatedData.value.length === 0) return false
  return paginatedData.value.every((r) => selectedIds.value.has(r.dealId))
})

function toggleSelectAll() {
  if (isAllCurrentPageSelected.value) {
    for (const r of paginatedData.value) {
      selectedIds.value.delete(r.dealId)
    }
  } else {
    for (const r of paginatedData.value) {
      selectedIds.value.add(r.dealId)
    }
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(dealId: string) {
  if (selectedIds.value.has(dealId)) {
    selectedIds.value.delete(dealId)
  } else {
    selectedIds.value.add(dealId)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function clearSelection() {
  selectedIds.value = new Set()
  bulkCsRep.value = ''
  bulkType.value = ''
}

function applyBulkUpdate() {
  if (selectedIds.value.size === 0) return
  const updates: Partial<Pick<import('~/utils/csvParser').DealRecord, 'csRep' | 'type'>> = {}
  if (bulkCsRep.value) updates.csRep = bulkCsRep.value
  if (bulkType.value) updates.type = bulkType.value
  if (Object.keys(updates).length === 0) return
  bulkUpdateRecords(Array.from(selectedIds.value), updates)
  toastSuccess(`${selectedIds.value.size}件のレコードを一括更新しました`)
  clearSelection()
}

// Available CS reps: merge from dataset + managed reps
const availableCsReps = computed(() => {
  const reps = new Set<string>()
  for (const d of dataset.value) {
    if (d.csRep) reps.add(d.csRep)
  }
  for (const r of csReps.value) {
    reps.add(r.name)
  }
  return Array.from(reps).sort()
})

const filteredData = computed(() => {
  let data = dataset.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    data = data.filter((d) =>
      d.dealName.toLowerCase().includes(q) ||
      d.accountName.toLowerCase().includes(q) ||
      d.dealId.toLowerCase().includes(q),
    )
  }
  if (filterType.value !== 'all') {
    data = data.filter((d) => d.type === filterType.value)
  }
  if (filterCsRep.value !== 'all') {
    data = data.filter((d) => d.csRep === filterCsRep.value)
  }
  return data
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredData.value.length / pageSize)))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

const displayPages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  return pages
})

function startEdit(record: { dealId: string; csRep: string; type: string }) {
  editingId.value = record.dealId
  editCsRep.value = record.csRep
  editType.value = record.type
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(dealId: string) {
  updateRecord(dealId, {
    csRep: editCsRep.value,
    type: editType.value,
  })
  editingId.value = null
  toastSuccess('レコードを更新しました')
}

watch([searchQuery, filterType, filterCsRep], () => {
  currentPage.value = 1
  clearSelection()
})
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>データ編集</h2>
      <p>商談レコードの「業務担当者」および「種類」を編集できます</p>
    </div>

    <!-- フィルター -->
    <div class="card mb-lg">
      <div class="form-row">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">キーワード検索</label>
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="商談名・取引先名・IDで検索..."
          >
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">種類</label>
          <select v-model="filterType" class="form-select">
            <option value="all">すべて</option>
            <option v-for="t in uniqueTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">業務担当者</label>
          <select v-model="filterCsRep" class="form-select">
            <option value="all">すべて</option>
            <option v-for="r in uniqueCsReps" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 一括操作バー -->
    <div v-if="selectedIds.size > 0" class="bulk-action-bar">
      <span class="bulk-action-bar__count">{{ selectedIds.size }}件選択中</span>
      <select v-model="bulkType" class="form-select bulk-action-bar__select">
        <option value="">種類を選択...</option>
        <option v-for="t in uniqueTypes" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="bulkCsRep" class="form-select bulk-action-bar__select">
        <option value="">業務担当者を選択...</option>
        <option v-for="r in availableCsReps" :key="r" :value="r">{{ r }}</option>
      </select>
      <button class="btn btn--primary btn--sm" :disabled="!bulkCsRep && !bulkType" @click="applyBulkUpdate">一括適用</button>
      <button class="btn btn--default btn--sm" @click="clearSelection">選択解除</button>
    </div>

    <!-- データテーブル -->
    <div class="data-table-wrapper">
      <div class="data-table-header">
        <span class="data-table-title">商談データ（{{ filteredData.length }}件）</span>
      </div>

      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input type="checkbox" :checked="isAllCurrentPageSelected" @change="toggleSelectAll">
              </th>
              <th>ID</th>
              <th>商談名</th>
              <th>取引先名</th>
              <th>種類</th>
              <th>業務担当者</th>
              <th>ステージ</th>
              <th>完了月</th>
              <th class="text-right">総額</th>
              <th style="width: 120px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in paginatedData" :key="record.dealId">
              <td>
                <input type="checkbox" :checked="selectedIds.has(record.dealId)" @change="toggleSelect(record.dealId)">
              </td>
              <td>{{ record.dealId }}</td>
              <td style="max-width: 240px; overflow: hidden; text-overflow: ellipsis;" :title="record.dealName">
                {{ record.dealName }}
              </td>
              <td>{{ record.accountName }}</td>

              <!-- 種類 -->
              <td>
                <template v-if="editingId === record.dealId">
                  <select v-model="editType" class="inline-edit-input" style="min-width: 140px;">
                    <option v-for="t in uniqueTypes" :key="t" :value="t">{{ t }}</option>
                  </select>
                </template>
                <template v-else>{{ record.type }}</template>
              </td>

              <!-- CS担当 -->
              <td>
                <template v-if="editingId === record.dealId">
                  <select v-model="editCsRep" class="inline-edit-input" style="min-width: 120px;">
                    <option value="">未設定</option>
                    <option v-for="r in availableCsReps" :key="r" :value="r">{{ r }}</option>
                  </select>
                </template>
                <template v-else>{{ record.csRep || '―' }}</template>
              </td>

              <td>
                <span
                  class="badge"
                  :class="record.stage === '7 受注' ? 'badge--success' : 'badge--warning'"
                >
                  {{ record.stage === '7 受注' ? '受注' : '予定' }}
                </span>
              </td>
              <td>{{ record.completionMonth }}</td>
              <td class="text-right">{{ formatCurrency(record.totalAmount) }}</td>

              <!-- 操作 -->
              <td>
                <template v-if="editingId === record.dealId">
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn--primary btn--sm" @click="saveEdit(record.dealId)">保存</button>
                    <button class="btn btn--default btn--sm" @click="cancelEdit">取消</button>
                  </div>
                </template>
                <template v-else>
                  <button class="btn btn--default btn--sm" @click="startEdit(record)">編集</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ページネーション -->
      <div v-if="totalPages > 1" class="pagination">
        <span class="pagination-info">
          {{ filteredData.length }}件中
          {{ (currentPage - 1) * pageSize + 1 }}〜{{ Math.min(currentPage * pageSize, filteredData.length) }}件
        </span>
        <div class="pagination-controls">
          <button class="pagination-btn" :disabled="currentPage === 1" @click="currentPage--">&lt;</button>
          <button
            v-for="p in displayPages"
            :key="p"
            class="pagination-btn"
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
          >
            {{ p }}
          </button>
          <button class="pagination-btn" :disabled="currentPage === totalPages" @click="currentPage++">&gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bulk-action-bar {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
  background: #DEEBFF;
  border: 1px solid #B3D4FF;
  border-radius: var(--radius);
}

.bulk-action-bar__count {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0747A6;
  white-space: nowrap;
}

.bulk-action-bar__select {
  min-width: 160px;
  font-size: 0.8125rem;
}
</style>
