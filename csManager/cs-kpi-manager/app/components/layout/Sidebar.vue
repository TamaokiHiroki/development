<script setup lang="ts">
const route = useRoute()

const dashboardItems = [
  { label: 'ダッシュボード', path: '/', icon: 'grid' },
]

const businessNavItems = [
  { label: '業績管理', path: '/performance', icon: 'trending-up' },
  { label: '事業セグメント別業績', path: '/segment-performance', icon: 'pie-chart' },
  { label: '四半期バランスシート', path: '/quarterly-balance', icon: 'layers' },
]

const csNavItems = [
  { label: 'ユニットエコノミクス', path: '/unit-economics', icon: 'target' },
  { label: 'MRR・NRR', path: '/mrr-nrr', icon: 'bar-chart' },
  { label: '顧客分析', path: '/customer', icon: 'briefcase' },
]

const staffNavItems = [
  { label: '業務担当者管理', path: '/cs-reps', icon: 'user-plus' },
  { label: '業務担当者別レポート', path: '/staff-report', icon: 'file-text' },
]

const managementNavItems = [
  { label: 'データアップロード', path: '/dataset-upload', icon: 'upload' },
  { label: 'データ編集', path: '/dataset-edit', icon: 'edit' },
  { label: '営業担当別パフォーマンス', path: '/staff', icon: 'users' },
  { label: '事業セグメント設定', path: '/segments', icon: 'sliders' },
  { label: '年度目標設定', path: '/goals', icon: 'flag' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1>KPI Manager</h1>
      <p>FY2026 ダッシュボード</p>
    </div>
    <nav class="sidebar-nav">
      <!-- ダッシュボード -->
      <NuxtLink
        v-for="item in dashboardItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'grid'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </span>
        {{ item.label }}
      </NuxtLink>

      <!-- 業績管理 セクション -->
      <div class="nav-section-label">業績管理</div>

      <NuxtLink
        v-for="item in businessNavItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'trending-up'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          <svg v-else-if="item.icon === 'pie-chart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
          <svg v-else-if="item.icon === 'layers'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </span>
        {{ item.label }}
      </NuxtLink>

      <!-- カスタマーサクセス セクション -->
      <div class="nav-section-label">カスタマーサクセス</div>

      <NuxtLink
        v-for="item in csNavItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'target'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <svg v-else-if="item.icon === 'bar-chart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
          <svg v-else-if="item.icon === 'briefcase'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </span>
        {{ item.label }}
      </NuxtLink>

      <!-- 業務担当者 セクション -->
      <div class="nav-section-label">業務担当者</div>

      <NuxtLink
        v-for="item in staffNavItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'user-plus'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <svg v-else-if="item.icon === 'file-text'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </span>
        {{ item.label }}
      </NuxtLink>

      <!-- 管理メニュー セクション -->
      <div class="nav-section-label">管理</div>

      <NuxtLink
        v-for="item in managementNavItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
      >
        <span class="nav-icon">
          <svg v-if="item.icon === 'upload'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <svg v-else-if="item.icon === 'edit'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <svg v-else-if="item.icon === 'users'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <svg v-else-if="item.icon === 'sliders'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          <svg v-else-if="item.icon === 'flag'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
        </span>
        {{ item.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
