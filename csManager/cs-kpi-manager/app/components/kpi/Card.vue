<script setup lang="ts">
interface Props {
  label: string
  value: string
  trendText?: string
  trendDirection?: 'up' | 'down' | 'flat'
  trendColor?: string
  trendLabel?: string
}

defineProps<Props>()
</script>

<template>
  <div class="kpi-card">
    <div class="kpi-card__label">{{ label }}</div>
    <div class="kpi-card__value">{{ value }}</div>
    <div v-if="trendText" class="kpi-card__trend">
      <span :style="{ color: trendColor }">
        <template v-if="trendDirection === 'up'">&#9650;</template>
        <template v-else-if="trendDirection === 'down'">&#9660;</template>
        <template v-else>&#9644;</template>
        {{ trendText }}
      </span>
      <span v-if="trendLabel" class="kpi-card__trend-label">{{ trendLabel }}</span>
    </div>
  </div>
</template>
