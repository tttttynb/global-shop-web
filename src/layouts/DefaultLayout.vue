<template>
  <div class="default-layout">
    <AppHeader />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
    <!-- 长页面回到顶部 -->
    <el-backtop :right="28" :bottom="28" />
    <!-- 全站 AI 客服悬浮球（/ai/chat 页自身隐藏） -->
    <AiAssistantDock />
  </div>
</template>

<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AiAssistantDock from '@/components/AiAssistantDock.vue'
</script>

<style scoped>
.default-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  max-width: var(--gs-container);
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 56px;
  box-sizing: border-box;
}
</style>
