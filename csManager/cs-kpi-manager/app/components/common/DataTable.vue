<script setup lang="ts">
interface Column {
  key: string
  label: string
  align?: 'left' | 'right'
  sortable?: boolean
  format?: (value: any, row: any) => string
}

interface Props {
  title?: string
  columns: Column[]
  rows: Record<string, any>[]
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
})

const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('desc')
const currentPage = ref(1)

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
  currentPage.value = 1
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  return [...props.rows].sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir.value === 'asc' ? va - vb : vb - va
    }
    const sa = String(va ?? '')
    const sb = String(vb ?? '')
    return sortDir.value === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

const displayPages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

function formatCell(col: Column, row: Record<string, any>): string {
  const value = row[col.key]
  if (col.format) return col.format(value, row)
  if (value == null) return ''
  return String(value)
}
</script>

<template>
  <div class="data-table-wrapper">
    <div v-if="title" class="data-table-header">
      <span class="data-table-title">{{ title }}</span>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.align === 'right' ? 'text-right' : '',
              col.sortable !== false ? 'sort-active' : '',
              sortKey === col.key ? 'sort-active' : '',
            ]"
            @click="col.sortable !== false && toggleSort(col.key)"
          >
            {{ col.label }}
            <template v-if="sortKey === col.key">
              {{ sortDir === 'asc' ? ' ▲' : ' ▼' }}
            </template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in paginatedRows" :key="idx">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="col.align === 'right' ? 'text-right' : ''"
          >
            {{ formatCell(col, row) }}
          </td>
        </tr>
        <tr v-if="paginatedRows.length === 0">
          <td :colspan="columns.length" style="text-align: center; padding: 24px; color: var(--color-text-subtle);">
            データがありません
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="totalPages > 1" class="pagination">
      <span class="pagination-info">
        {{ sortedRows.length }}件中 {{ (currentPage - 1) * pageSize + 1 }}〜{{ Math.min(currentPage * pageSize, sortedRows.length) }}件
      </span>
      <div class="pagination-controls">
        <button
          class="pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage = currentPage - 1"
        >
          &lt;
        </button>
        <button
          v-for="p in displayPages"
          :key="p"
          class="pagination-btn"
          :class="{ active: p === currentPage }"
          @click="currentPage = p"
        >
          {{ p }}
        </button>
        <button
          class="pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage = currentPage + 1"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>
