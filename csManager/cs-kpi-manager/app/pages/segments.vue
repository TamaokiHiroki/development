<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getCurrentFiscalYear, formatFiscalYear } from '~/utils/fiscalYear'

const { loadData, loaded, uniqueTypes } = useDataset()
const { segmentConfigs, loadSegmentConfigs, getConfig, addSegment, updateSegment, deleteSegment, setMapping, setSegmentTarget, copyFromPreviousYear, getSortedSegments } = useSegments()
const { success: toastSuccess, error: toastError } = useToast()

await loadData()

onMounted(() => {
  loadSegmentConfigs()
})

const selectedFY = ref(getCurrentFiscalYear())
const fyOptions = [2026, 2025, 2027]

// Current FY config
const currentConfig = computed(() => getConfig(selectedFY.value))
const segments = computed(() => getSortedSegments(selectedFY.value))

// --- Segment CRUD Modal ---
const showSegmentModal = ref(false)
const editingSegment = ref<{ id: string; name: string; sortOrder: number } | null>(null)
const formSegmentName = ref('')
const formSortOrder = ref(1)
const formSegmentError = ref('')
const deleteSegmentConfirmId = ref<string | null>(null)

function openAddSegmentModal() {
  editingSegment.value = null
  formSegmentName.value = ''
  formSortOrder.value = segments.value.length + 1
  formSegmentError.value = ''
  showSegmentModal.value = true
}

function openEditSegmentModal(seg: { id: string; name: string; sortOrder: number }) {
  editingSegment.value = seg
  formSegmentName.value = seg.name
  formSortOrder.value = seg.sortOrder
  formSegmentError.value = ''
  showSegmentModal.value = true
}

function closeSegmentModal() {
  showSegmentModal.value = false
  editingSegment.value = null
  formSegmentError.value = ''
}

function handleSaveSegment() {
  if (!formSegmentName.value.trim()) {
    formSegmentError.value = 'セグメント名を入力してください'
    return
  }
  if (editingSegment.value) {
    updateSegment(selectedFY.value, editingSegment.value.id, formSegmentName.value, formSortOrder.value)
    toastSuccess(`「${formSegmentName.value}」を更新しました`)
  } else {
    addSegment(selectedFY.value, formSegmentName.value)
    toastSuccess(`「${formSegmentName.value}」を追加しました`)
  }
  closeSegmentModal()
}

function confirmDeleteSegment(id: string) {
  deleteSegmentConfirmId.value = id
}

function handleDeleteSegment(id: string) {
  const seg = segments.value.find(s => s.id === id)
  deleteSegment(selectedFY.value, id)
  deleteSegmentConfirmId.value = null
  if (seg) {
    toastSuccess(`「${seg.name}」を削除しました`)
  }
}

function cancelDeleteSegment() {
  deleteSegmentConfirmId.value = null
}

// --- Mappings ---
function getMappingSegmentId(typeName: string): string {
  return currentConfig.value?.mappings[typeName] || ''
}

function handleMappingChange(typeName: string, segmentId: string) {
  setMapping(selectedFY.value, typeName, segmentId)
}

const unmappedCount = computed(() => {
  if (!currentConfig.value) return uniqueTypes.value.length
  return uniqueTypes.value.filter(t => !currentConfig.value!.mappings[t]).length
})

// --- Targets ---
const targetInputs = ref<Record<string, { revenue: string; gp: string }>>({})

watch([segments, currentConfig], () => {
  const inputs: Record<string, { revenue: string; gp: string }> = {}
  for (const seg of segments.value) {
    const target = currentConfig.value?.targets[seg.id]
    inputs[seg.id] = {
      revenue: target?.revenueTarget ? target.revenueTarget.toString() : '',
      gp: target?.grossProfitTarget ? target.grossProfitTarget.toString() : '',
    }
  }
  targetInputs.value = inputs
}, { immediate: true })

function handleSaveTarget(segId: string) {
  const input = targetInputs.value[segId]
  if (!input) return
  const revenue = parseInt(input.revenue.replace(/,/g, ''), 10) || 0
  const gp = parseInt(input.gp.replace(/,/g, ''), 10) || 0
  setSegmentTarget(selectedFY.value, segId, revenue, gp)
  const seg = segments.value.find(s => s.id === segId)
  toastSuccess(`「${seg?.name || ''}」の目標を保存しました`)
}

// --- Copy from previous year ---
function handleCopyFromPrevious() {
  const prevFY = selectedFY.value - 1
  const result = copyFromPreviousYear(selectedFY.value)
  if (result) {
    toastSuccess(`${formatFiscalYear(prevFY)}の設定をコピーしました（目標はリセットされています）`)
  } else {
    toastError(`${formatFiscalYear(prevFY)}の設定が見つかりません`)
  }
}
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>事業セグメント設定</h2>
      <p>事業セグメントの定義・種類マッピング・目標設定を行います</p>
    </div>

    <!-- FYセレクタ + コピーボタン -->
    <div class="filter-bar" style="margin-bottom: var(--space-lg);">
      <div class="filter-group">
        <span class="filter-label">会計年度</span>
        <select v-model="selectedFY" class="filter-select">
          <option v-for="fy in fyOptions" :key="fy" :value="fy">{{ formatFiscalYear(fy) }}</option>
        </select>
      </div>
      <div class="filter-group" style="align-self: flex-end;">
        <button class="btn btn--default" @click="handleCopyFromPrevious">
          前年度からコピー
        </button>
      </div>
    </div>

    <!-- 1. セグメント一覧 -->
    <div class="data-table-wrapper mb-lg">
      <div class="data-table-header">
        <span class="data-table-title">セグメント一覧（{{ segments.length }}件）</span>
        <button class="btn btn--primary btn--sm" @click="openAddSegmentModal">追加</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 60px;">並び順</th>
            <th>セグメント名</th>
            <th style="width: 180px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="seg in segments" :key="seg.id">
            <td class="text-right">{{ seg.sortOrder }}</td>
            <td style="font-weight: 500;">{{ seg.name }}</td>
            <td>
              <template v-if="deleteSegmentConfirmId === seg.id">
                <div style="display: flex; gap: 4px; align-items: center;">
                  <span style="font-size: 0.75rem; color: var(--color-error);">削除しますか？</span>
                  <button class="btn btn--danger btn--sm" @click="handleDeleteSegment(seg.id)">削除</button>
                  <button class="btn btn--default btn--sm" @click="cancelDeleteSegment">取消</button>
                </div>
              </template>
              <template v-else>
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn--default btn--sm" @click="openEditSegmentModal(seg)">編集</button>
                  <button class="btn btn--default btn--sm" @click="confirmDeleteSegment(seg.id)">削除</button>
                </div>
              </template>
            </td>
          </tr>
          <tr v-if="segments.length === 0">
            <td colspan="3" style="text-align: center; padding: 32px; color: var(--color-text-subtle);">
              セグメントが登録されていません。「追加」から作成してください。
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. マッピング設定 -->
    <div v-if="segments.length > 0" class="data-table-wrapper mb-lg">
      <div class="data-table-header">
        <span class="data-table-title">種類マッピング設定</span>
        <span v-if="unmappedCount > 0" class="mapping-warning">
          未マッピング: {{ unmappedCount }}件
        </span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>種類（データセット）</th>
            <th style="width: 250px;">セグメント</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="typeName in uniqueTypes" :key="typeName" :class="{ 'row-unmapped': !getMappingSegmentId(typeName) }">
            <td>{{ typeName }}</td>
            <td>
              <select
                class="form-select form-select--sm"
                :value="getMappingSegmentId(typeName)"
                @change="handleMappingChange(typeName, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">未設定</option>
                <option v-for="seg in segments" :key="seg.id" :value="seg.id">{{ seg.name }}</option>
              </select>
            </td>
          </tr>
          <tr v-if="uniqueTypes.length === 0">
            <td colspan="2" style="text-align: center; padding: 24px; color: var(--color-text-subtle);">
              データセットに種類が見つかりません
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. 目標設定 -->
    <div v-if="segments.length > 0" class="data-table-wrapper mb-lg">
      <div class="data-table-header">
        <span class="data-table-title">セグメント目標設定（{{ formatFiscalYear(selectedFY) }}）</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>セグメント</th>
            <th class="text-right" style="width: 200px;">売上目標（円）</th>
            <th class="text-right" style="width: 200px;">粗利目標（円）</th>
            <th style="width: 80px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="seg in segments" :key="seg.id">
            <td style="font-weight: 500;">{{ seg.name }}</td>
            <td>
              <input
                v-if="targetInputs[seg.id]"
                v-model="targetInputs[seg.id].revenue"
                type="text"
                class="form-input form-input--sm text-right"
                placeholder="0"
                inputmode="numeric"
              >
            </td>
            <td>
              <input
                v-if="targetInputs[seg.id]"
                v-model="targetInputs[seg.id].gp"
                type="text"
                class="form-input form-input--sm text-right"
                placeholder="0"
                inputmode="numeric"
              >
            </td>
            <td>
              <button class="btn btn--primary btn--sm" @click="handleSaveTarget(seg.id)">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- セグメントモーダル -->
    <Teleport to="body">
      <div v-if="showSegmentModal" class="modal-backdrop" @click.self="closeSegmentModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">{{ editingSegment ? 'セグメントの編集' : 'セグメントの追加' }}</span>
            <button class="modal-close" @click="closeSegmentModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">セグメント名 <span class="text-error">*</span></label>
              <input
                v-model="formSegmentName"
                type="text"
                class="form-input"
                placeholder="例: GEPPY CP"
              >
              <div v-if="formSegmentError" class="form-error">{{ formSegmentError }}</div>
            </div>
            <div class="form-group">
              <label class="form-label">並び順</label>
              <input
                v-model.number="formSortOrder"
                type="number"
                class="form-input"
                min="1"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--default" @click="closeSegmentModal">キャンセル</button>
            <button class="btn btn--primary" @click="handleSaveSegment">
              {{ editingSegment ? '更新' : '追加' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.mapping-warning {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-warning);
  background: #FFFAE6;
  padding: 2px 8px;
  border-radius: 4px;
}

.row-unmapped {
  background: #FFFAE6;
}

.form-select--sm {
  padding: 4px 8px;
  font-size: 0.8125rem;
}

.form-input--sm {
  padding: 4px 8px;
  font-size: 0.8125rem;
}
</style>
