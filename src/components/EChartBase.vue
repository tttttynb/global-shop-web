<template>
  <div ref="chartRef" class="echart-base" :style="{ height: height + 'px' }"></div>
</template>

<script setup>
/**
 * ECharts 通用基座：负责 init / 自适应 resize / 数据变化重绘 / 销毁
 * 图表逻辑只管在调用方构建 option 传入即可
 */
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
// 必须从注册中心引入：保证消费方无论是否间接引到图表类型，渲染器都已注册
import echarts from '@/utils/echarts'

const props = defineProps({
  /** 完整 ECharts option；null 表示暂无数据不渲染 */
  option: { type: Object, default: null },
  height: { type: Number, default: 300 }
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

function render() {
  if (!chart) return
  if (props.option) {
    chart.setOption(props.option, { notMerge: true })
    chart.resize()
  }
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  render()
  resizeObserver = new ResizeObserver(() => chart && chart.resize())
  resizeObserver.observe(chartRef.value)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (chart) {
    chart.dispose()
    chart = null
  }
})

watch(() => props.option, render)
</script>

<style scoped>
.echart-base {
  width: 100%;
}
</style>
