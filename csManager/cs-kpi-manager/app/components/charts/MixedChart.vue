<script setup lang="ts">
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  data: ChartData<'bar' | 'line'>
  options?: ChartOptions
}

const props = defineProps<Props>()

const defaultOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
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

const mergedOptions = computed(() => {
  const opts = props.options || {}
  return {
    ...defaultOptions,
    ...opts,
    interaction: {
      ...defaultOptions.interaction,
      ...opts.interaction,
    },
    plugins: {
      ...defaultOptions.plugins,
      ...opts.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...opts.scales,
    },
  }
})
</script>

<template>
  <div class="chart-wrapper">
    <Chart type="bar" :data="(data as any)" :options="mergedOptions" />
  </div>
</template>
