<template>
  <EChartBase :option="option" :height="height" />
</template>

<script setup>
/**
 * 商品价格走势图（Phase 1 - F2，ECharts 实现，替换早期内联 SVG 方案）
 * - 数据口径：序列保持 CNY 记账价；坐标轴/悬浮提示按当前展示币种换算（复用 locale store）
 * - 最低点 markPoint 呼应降价提醒闭环："看到历史低点 → 订阅降价提醒"
 * - option 为 computed：币种/汇率变化时自动重算并重绘
 */
import { computed } from 'vue'
import echarts from '@/utils/echarts'
import EChartBase from '@/components/EChartBase.vue'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps({
  /** [{ price, createTime }]，CNY 记账价，升序或乱序均可（内部排序） */
  history: { type: Array, default: () => [] },
  height: { type: Number, default: 240 }
})

const localeStore = useLocaleStore()

/** CNY 金额 → 展示币种紧凑文本（坐标轴用），汇率缺失回退 CNY */
function compactPrice(cny) {
  const opt = localeStore.currencyOption
  const v = localeStore.convert(cny)
  const n = v === null ? Number(cny) : v
  let s = n.toFixed(opt.decimals)
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return opt.symbol + s
}

function formatDate(raw) {
  return String(raw || '').replace('T', ' ').slice(0, 10)
}

const option = computed(() => {
  // 显式建立对币种/汇率的依赖：formatter 闭包在 setOption 后才执行，
  // 不在这里读取的话，币种切换或汇率异步到达都不会触发重绘
  void localeStore.currency
  void localeStore.rates
  const points = props.history
    .map(h => ({ cny: Number(h.price), raw: h.createTime }))
    .filter(p => !isNaN(p.cny))
    .sort((a, b) => String(a.raw).localeCompare(String(b.raw)))
  if (points.length < 2) return null

  const areaColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(245, 108, 108, 0.20)' },
    { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }
  ])

  return {
    grid: { left: 8, right: 20, top: 30, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: '#f56c6c', opacity: 0.4 } },
      formatter(params) {
        const p = params[0]
        return `${formatDate(p.axisValue)}<br/><b>${localeStore.formatPrice(p.value)}</b>`
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map(p => String(p.raw || '')),
      axisLabel: {
        color: '#909399',
        fontSize: 11,
        formatter: value => String(value).slice(5, 10)
      },
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { color: '#909399', fontSize: 11, formatter: compactPrice },
      splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
    },
    series: [{
      type: 'line',
      data: points.map(p => p.cny),
      smooth: true,
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#f56c6c', width: 2 },
      itemStyle: { color: '#f56c6c' },
      areaStyle: { color: areaColor },
      markPoint: {
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: '#67c23a', borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          position: 'bottom',
          distance: 8,
          color: '#67c23a',
          fontSize: 11,
          fontWeight: 600,
          formatter: ({ value }) => compactPrice(value)
        },
        data: [{ type: 'min', name: 'min' }]
      }
    }]
  }
})
</script>
