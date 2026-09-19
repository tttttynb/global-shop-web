<template>
  <el-config-provider :locale="epLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup>
// Phase 3 - F5：Element Plus 组件语言随界面语言切换 + 启动时加载汇率表
import { computed, onMounted } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import ja from 'element-plus/es/locale/lang/ja'
import ko from 'element-plus/es/locale/lang/ko'
import { useLocaleStore } from '@/stores/locale'

const localeStore = useLocaleStore()

const EP_LOCALES = { zh: zhCn, en, ja, ko }
const epLocale = computed(() => EP_LOCALES[localeStore.locale] || zhCn)

onMounted(() => {
  localeStore.loadRates()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}
a {
  text-decoration: none;
  color: inherit;
}
</style>
