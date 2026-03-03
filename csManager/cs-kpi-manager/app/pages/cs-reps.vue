<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'

const { loadData, loaded } = useDataset()
const { csReps, loadCsReps, addCsRep, updateCsRep, deleteCsRep } = useCsReps()
const { success: toastSuccess, error: toastError } = useToast()

await loadData()

onMounted(() => {
  loadCsReps()
})

// Modal state
const showModal = ref(false)
const editingRep = ref<{ id: string; name: string; title: string; team: string; grade: string; supplement: string; revenueTarget: number; grossProfitTarget: number } | null>(null)
const formName = ref('')
const formTitle = ref('')
const formTeam = ref('')
const formGrade = ref('')
const formSupplement = ref('')
const formRevenueTarget = ref(0)
const formGrossProfitTarget = ref(0)
const formError = ref('')

const teamOptions = ['CS', 'PM', 'NB', 'NP']
const gradeOptions = ['エバンジェリスト', 'プロデューサー', 'マネージャー', 'リーダー', 'スペシャリスト', 'メンバー', 'ジュニア']

// Delete confirmation
const deleteConfirmId = ref<string | null>(null)

function openAddModal() {
  editingRep.value = null
  formName.value = ''
  formTitle.value = ''
  formTeam.value = ''
  formGrade.value = ''
  formSupplement.value = ''
  formRevenueTarget.value = 0
  formGrossProfitTarget.value = 0
  formError.value = ''
  showModal.value = true
}

function openEditModal(rep: { id: string; name: string; title: string; team: string; grade: string; supplement: string; revenueTarget: number; grossProfitTarget: number }) {
  editingRep.value = rep
  formName.value = rep.name
  formTitle.value = rep.title
  formTeam.value = rep.team
  formGrade.value = rep.grade
  formSupplement.value = rep.supplement
  formRevenueTarget.value = rep.revenueTarget
  formGrossProfitTarget.value = rep.grossProfitTarget
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingRep.value = null
  formError.value = ''
}

function handleSave() {
  if (!formName.value.trim()) {
    formError.value = '担当者名を入力してください'
    return
  }

  if (editingRep.value) {
    updateCsRep(editingRep.value.id, formName.value, formTitle.value, formTeam.value, formGrade.value, formSupplement.value, formRevenueTarget.value, formGrossProfitTarget.value)
    toastSuccess(`「${formName.value}」を更新しました`)
  } else {
    addCsRep(formName.value, formTitle.value, formTeam.value, formGrade.value, formSupplement.value, formRevenueTarget.value, formGrossProfitTarget.value)
    toastSuccess(`「${formName.value}」を登録しました`)
  }
  closeModal()
}

function confirmDelete(id: string) {
  deleteConfirmId.value = id
}

function handleDelete(id: string) {
  const rep = csReps.value.find((r) => r.id === id)
  deleteCsRep(id)
  deleteConfirmId.value = null
  if (rep) {
    toastSuccess(`「${rep.name}」を削除しました`)
  }
}

function cancelDelete() {
  deleteConfirmId.value = null
}
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h2>業務担当者管理</h2>
          <p>業務担当者の登録・編集・削除を行います</p>
        </div>
        <button class="btn btn--primary" @click="openAddModal">
          新規登録
        </button>
      </div>
    </div>

    <!-- テーブル -->
    <div class="data-table-wrapper">
      <div class="data-table-header">
        <span class="data-table-title">業務担当者一覧（{{ csReps.length }}名）</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>担当者名</th>
            <th>チーム</th>
            <th>グレード</th>
            <th class="text-right">売上目標</th>
            <th class="text-right">粗利目標</th>
            <th>補足事項</th>
            <th style="width: 180px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rep in csReps" :key="rep.id">
            <td style="font-weight: 500;">{{ rep.name }}</td>
            <td>{{ rep.team || '―' }}</td>
            <td>{{ rep.grade || '―' }}</td>
            <td class="text-right">{{ rep.revenueTarget ? formatCurrency(rep.revenueTarget) : '―' }}</td>
            <td class="text-right">{{ rep.grossProfitTarget ? formatCurrency(rep.grossProfitTarget) : '―' }}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" :title="rep.supplement">{{ rep.supplement || '―' }}</td>
            <td>
              <template v-if="deleteConfirmId === rep.id">
                <div style="display: flex; gap: 4px; align-items: center;">
                  <span style="font-size: 0.75rem; color: var(--color-error);">削除しますか？</span>
                  <button class="btn btn--danger btn--sm" @click="handleDelete(rep.id)">削除</button>
                  <button class="btn btn--default btn--sm" @click="cancelDelete">取消</button>
                </div>
              </template>
              <template v-else>
                <div style="display: flex; gap: 4px;">
                  <button class="btn btn--default btn--sm" @click="openEditModal(rep)">編集</button>
                  <button class="btn btn--default btn--sm" @click="confirmDelete(rep.id)">削除</button>
                </div>
              </template>
            </td>
          </tr>
          <tr v-if="csReps.length === 0">
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--color-text-subtle);">
              業務担当者が登録されていません。「新規登録」から追加してください。
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- モーダル -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title">{{ editingRep ? '業務担当者の編集' : '業務担当者の新規登録' }}</span>
            <button class="modal-close" @click="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">担当者名 <span class="text-error">*</span></label>
              <input
                v-model="formName"
                type="text"
                class="form-input"
                placeholder="例: 山田 太郎"
              >
              <div v-if="formError" class="form-error">{{ formError }}</div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">チーム</label>
                <select v-model="formTeam" class="form-select">
                  <option value="">未設定</option>
                  <option v-for="t in teamOptions" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">グレード</label>
                <select v-model="formGrade" class="form-select">
                  <option value="">未設定</option>
                  <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">補足事項</label>
              <textarea
                v-model="formSupplement"
                class="form-input"
                rows="3"
                placeholder="例: 新人研修中、主にSaaS案件を担当"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">今期売上目標</label>
                <input v-model.number="formRevenueTarget" type="number" class="form-input" placeholder="例: 10000000" min="0">
                <div class="form-hint">売上目標額（円）</div>
              </div>
              <div class="form-group">
                <label class="form-label">今期粗利目標</label>
                <input v-model.number="formGrossProfitTarget" type="number" class="form-input" placeholder="例: 3000000" min="0">
                <div class="form-hint">粗利目標額（円）</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn--default" @click="closeModal">キャンセル</button>
            <button class="btn btn--primary" @click="handleSave">
              {{ editingRep ? '更新' : '登録' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
