<script setup lang="ts">
import Papa from 'papaparse'

const { loadData, loaded, uploadDataset, hasUploadedDataset, resetToDefaultDataset, dataset } = useDataset()
const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()

await loadData()

const fileInput = ref<HTMLInputElement | null>(null)
const dragover = ref(false)
const previewData = ref<Record<string, string>[]>([])
const previewHeaders = ref<string[]>([])
const csvText = ref('')
const isUploaded = ref(false)

onMounted(() => {
  isUploaded.value = hasUploadedDataset()
})

const EXPECTED_HEADERS = [
  'ステージ', '自動番号', '商談名', '取引先名', '種類', '粗利', '総額',
  '外注総額(レポート用)', '商談の担当者', 'CS担当', '獲得元施策', '対応チーム', '完了月',
]

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  dragover.value = false
  const file = event.dataTransfer?.files[0]
  if (file) processFile(file)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragover.value = true
}

function handleDragLeave() {
  dragover.value = false
}

function processFile(file: File) {
  if (!file.name.endsWith('.csv')) {
    toastError('CSVファイルのみアップロードできます')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    csvText.value = text

    // Parse for preview
    const result = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), {
      header: true,
      preview: 10,
      skipEmptyLines: true,
    })

    previewHeaders.value = result.meta.fields || []
    previewData.value = result.data

    // Validate headers
    const missing = EXPECTED_HEADERS.filter((h) => !previewHeaders.value.includes(h))
    if (missing.length > 0) {
      toastWarning(`以下の列が不足しています: ${missing.join('、')}`)
    }
  }
  reader.readAsText(file)
}

function confirmUpload() {
  if (!csvText.value) {
    toastError('ファイルが選択されていません')
    return
  }

  const result = uploadDataset(csvText.value)
  if (result.success) {
    toastSuccess(`${result.count}件のレコードを読み込みました`)
    isUploaded.value = true
    previewData.value = []
    previewHeaders.value = []
    csvText.value = ''
  } else {
    toastError('CSVの解析に失敗しました。フォーマットを確認してください')
  }
}

function handleReset() {
  if (confirm('デフォルトのデータセットに戻しますか？アップロードしたデータは削除されます。')) {
    resetToDefaultDataset()
    isUploaded.value = false
    toastSuccess('デフォルトのデータセットに戻しました')
  }
}

function openFilePicker() {
  fileInput.value?.click()
}
</script>

<template>
  <div v-if="loaded">
    <div class="page-header">
      <h2>データセットのアップロード</h2>
      <p>商談データのCSVファイルをアップロードして、ダッシュボードのデータを更新します</p>
    </div>

    <!-- 現在の状態 -->
    <div class="card mb-lg">
      <div class="card-header">
        <span class="card-title">現在のデータセット</span>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <p style="font-size: 0.875rem;">
            レコード数: <strong>{{ dataset.length }}件</strong>
          </p>
          <p class="text-subtle mt-sm" style="font-size: 0.8125rem;">
            <template v-if="isUploaded">
              <span class="badge badge--success">アップロード済み</span>
              アップロードされたデータセットを使用中
            </template>
            <template v-else>
              <span class="badge badge--warning">デフォルト</span>
              初期データセット (dataset20260228.csv) を使用中
            </template>
          </p>
        </div>
        <button v-if="isUploaded" class="btn btn--default" @click="handleReset">
          デフォルトに戻す
        </button>
      </div>
    </div>

    <!-- アップロードエリア -->
    <div class="card mb-lg">
      <div class="card-header">
        <span class="card-title">CSVファイルのアップロード</span>
      </div>

      <div
        class="file-upload"
        :class="{ dragover }"
        @click="openFilePicker"
        @drop="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <div class="file-upload__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div class="file-upload__text">クリックまたはドラッグ＆ドロップでファイルを選択</div>
        <div class="file-upload__hint">CSVファイル (.csv) のみ対応</div>
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          style="display: none;"
          @change="handleFileSelect"
        >
      </div>

      <!-- フィールドマッピング情報 -->
      <div class="mt-md" style="font-size: 0.8125rem; color: var(--color-text-subtle);">
        <p style="font-weight: 600; margin-bottom: var(--space-xs);">必須列:</p>
        <p>{{ EXPECTED_HEADERS.join('、') }}</p>
      </div>
    </div>

    <!-- プレビュー -->
    <div v-if="previewData.length > 0" class="card mb-lg">
      <div class="card-header">
        <span class="card-title">プレビュー（先頭10件）</span>
        <button class="btn btn--primary" @click="confirmUpload">
          このデータを登録する
        </button>
      </div>

      <div style="overflow-x: auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="header in EXPECTED_HEADERS.filter(h => previewHeaders.includes(h))" :key="header">
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in previewData" :key="idx">
              <td v-for="header in EXPECTED_HEADERS.filter(h => previewHeaders.includes(h))" :key="header">
                {{ row[header] || '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
