<template>
  <div class="ai-search-page">
    <!-- 顶部搜索区域 -->
    <div class="search-hero">
      <h1 class="hero-title">AI 智能搜索</h1>
      <p class="hero-subtitle">用自然语言描述你想要的商品</p>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          size="large"
          placeholder="例如：适合跑步用的无线蓝牙耳机"
          class="search-input"
          @keyup.enter="doSearch"
          clearable
        >
          <template #append>
            <el-button type="primary" size="large" :icon="Search" @click="doSearch" :loading="loading">
              搜索
            </el-button>
          </template>
        </el-input>
      </div>
      <div class="search-tags">
        <span class="tags-label">试试搜索：</span>
        <el-tag
          v-for="tag in exampleTags"
          :key="tag"
          class="example-tag"
          effect="plain"
          round
          @click="searchByTag(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <!-- 搜索结果区域 -->
    <div class="search-results" v-loading="loading">
      <!-- 搜索前引导 -->
      <div v-if="!searched" class="guide-area">
        <el-icon :size="64" color="#c0c4cc"><Search /></el-icon>
        <p class="guide-text">输入描述，AI 将为您找到最匹配的商品</p>
      </div>

      <!-- 搜索后有结果 -->
      <template v-else-if="results.length > 0">
        <p class="result-count">为您找到 <strong>{{ results.length }}</strong> 个相关商品</p>
        <el-row :gutter="20">
          <el-col :span="6" v-for="item in results" :key="item.id" class="result-col">
            <ProductCard :product="item" />
          </el-col>
        </el-row>
      </template>

      <!-- 搜索后无结果 -->
      <el-empty v-else description="没有找到相关商品，换个描述试试？" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { semanticSearch } from '@/api/ai'
import ProductCard from '@/components/ProductCard.vue'

const keyword = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)

const exampleTags = ['防水运动手表', '送女朋友的礼物', '办公室午睡神器', '学生平价护肤品']

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  loading.value = true
  searched.value = true
  try {
    const res = await semanticSearch(kw)
    results.value = res.data
  } catch (e) {
    // 拦截器（request.js）已经显示了后端的详细错误信息，这里只需重置结果
    results.value = []
  } finally {
    loading.value = false
  }
}

function searchByTag(tag) {
  keyword.value = tag
  doSearch()
}
</script>

<style scoped>
.ai-search-page {
  min-height: calc(100vh - 200px);
}

.search-hero {
  background: linear-gradient(135deg, #e8f4fd 0%, #e8f8e4 100%);
  padding: 60px 20px 48px;
  text-align: center;
}

.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px;
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 16px;
  color: #606266;
  margin: 0 0 32px;
}

.search-bar {
  max-width: 680px;
  margin: 0 auto;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 24px 0 0 24px;
  padding: 4px 20px;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.10);
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 24px 24px 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.search-input :deep(.el-input-group__append .el-button) {
  border-radius: 0 24px 24px 0;
  padding: 0 28px;
  height: 100%;
}

.search-tags {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.tags-label {
  font-size: 14px;
  color: #909399;
}

.example-tag {
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.example-tag:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}

.search-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 48px;
  min-height: 300px;
}

.guide-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #c0c4cc;
}

.guide-text {
  margin-top: 16px;
  font-size: 15px;
  color: #909399;
}

.result-count {
  font-size: 15px;
  color: #606266;
  margin-bottom: 20px;
}

.result-count strong {
  color: #409eff;
}

.result-col {
  margin-bottom: 20px;
}
</style>
