<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
}

const props = defineProps<Props>()

const defaultOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { size: 12 },
        color: '#172B4D',
        padding: 16,
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
  scales: {
    x: {
      grid: { color: '#DFE1E6' },
      ticks: { color: '#6B778C', font: { size: 11 } },
    },
    y: {
      grid: { color: '#DFE1E6' },
      ticks: { color: '#6B778C', font: { size: 11 } },
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
  scales: {
    ...defaultOptions.scales,
    ...props.options?.scales,
  },
}))
</script>

<template>
  <div class="chart-wrapper">
    <Bar :data="data" :options="mergedOptions" />
  </div>
</template>
