<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  data: ChartData<'doughnut'>
  options?: ChartOptions<'doughnut'>
}

const props = defineProps<Props>()

const defaultOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { size: 12 },
        color: '#172B4D',
        padding: 12,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: '#172B4D',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 4,
    },
  },
}

const mergedOptions = computed(() => ({
  ...defaultOptions,
  ...props.options,
  plugins: {
    ...defaultOptions.plugins,
    ...props.options?.plugins,
  },
}))
</script>

<template>
  <div class="chart-wrapper">
    <Doughnut :data="data" :options="mergedOptions" />
  </div>
</template>
