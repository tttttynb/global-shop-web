<template>
  <div class="ai-search-page">
    <!-- 顶部搜索区域 -->
    <div class="search-hero">
      <h1 class="hero-title">AI 智能搜索</h1>
      <p class="hero-subtitle">用自然语言描述，或直接拍张图，AI 帮你找到想要的商品</p>

      <!-- 🆕 搜索模式切换（Phase 2 - F4 以图搜图） -->
      <div class="mode-switch">
        <el-radio-group v-model="mode" size="large">
          <el-radio-button value="text">💬 文字描述</el-radio-button>
          <el-radio-button value="image">📷 以图搜图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 文字搜索 -->
      <div class="search-bar" v-if="mode === 'text'">
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
      <div class="search-tags" v-if="mode === 'text'">
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

      <!-- 🆕 图片上传 -->
      <div class="image-bar" v-else>
        <div
          class="upload-zone"
          :class="{ 'has-image': imagePreview }"
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="onDropFile"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            style="display: none"
            @change="onFileChange"
          />
          <template v-if="imagePreview">
            <img :src="imagePreview" class="preview-img" alt="预览" />
            <div class="preview-actions">
              <el-button size="small" round @click.stop="triggerFileInput">换一张</el-button>
              <el-button size="small" round type="danger" plain @click.stop="clearImage">移除</el-button>
            </div>
          </template>
          <template v-else>
            <el-icon :size="42" color="#409eff"><Camera /></el-icon>
            <p class="upload-tip">点击或拖拽图片到这里</p>
            <p class="upload-sub">支持 jpg / png / webp，不超过 5MB。街拍、截图、杂志图都可以</p>
          </template>
        </div>
        <el-button
          type="primary"
          size="large"
          :icon="Search"
          :loading="loading"
          :disabled="!imageFile"
          class="image-search-btn"
          @click="doImageSearch"
        >
          {{ loading ? 'AI 正在看图找同款…' : '搜索相似商品' }}
        </el-button>
      </div>
    </div>

    <!-- 搜索结果区域 -->
    <div class="search-results" v-loading="loading" :element-loading-text="mode === 'image' ? 'AI 视觉识别中，约需 5-15 秒…' : 'AI 语义检索中…'">
      <!-- 🆕 图搜识别结果说明条 -->
      <div v-if="mode === 'image' && recognized" class="recognized-bar">
        <span class="recognized-label">🤖 AI 识别为：</span>
        <el-tag type="danger" effect="dark" size="small" v-if="recognized.category">{{ recognized.category }}</el-tag>
        <el-tag v-for="kw in recognized.keywords" :key="kw" size="small" effect="plain" style="margin-left: 6px;">{{ kw }}</el-tag>
        <span class="recognized-desc" v-if="recognized.description">— {{ recognized.description }}</span>
      </div>

      <!-- 搜索前引导 -->
      <div v-if="!searched" class="guide-area">
        <el-icon :size="64" color="#c0c4cc"><Search /></el-icon>
        <p class="guide-text">{{ mode === 'image' ? '上传一张商品图，AI 将为你找到平台相似款' : '输入描述，AI 将为您找到最匹配的商品' }}</p>
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
      <el-empty v-else :description="mode === 'image' ? '没有找到相似商品，换一张主体更清晰的图试试？' : '没有找到相关商品，换个描述试试？'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Camera } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { semanticSearch, imageSearch } from '@/api/ai'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()

const mode = ref('text')
const keyword = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)
// 🆕 以图搜图状态
const fileInputRef = ref(null)
const imageFile = ref(null)
const imagePreview = ref('')
const recognized = ref(null)

const exampleTags = ['防水运动手表', '送女朋友的礼物', '办公室午睡神器', '学生平价护肤品']

onMounted(() => {
  // 支持 /ai/search?mode=image 直达图搜模式（首页/头部相机入口）
  if (route.query.mode === 'image') {
    mode.value = 'image'
  }
})

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning('请输入搜索内容')
    return
  }
  loading.value = true
  searched.value = true
  recognized.value = null
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

// ==================== 🆕 以图搜图 ====================

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (file) acceptFile(file)
  // 清空 input 值，允许重复选择同一文件
  e.target.value = ''
}

function onDropFile(e) {
  const file = e.dataTransfer?.files?.[0]
  if (file) acceptFile(file)
}

function acceptFile(file) {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  recognized.value = null
  searched.value = false
  results.value = []
}

function clearImage() {
  imageFile.value = null
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imagePreview.value = ''
  recognized.value = null
}

async function doImageSearch() {
  if (!imageFile.value) {
    ElMessage.warning('请先选择一张商品图片')
    return
  }
  loading.value = true
  searched.value = true
  try {
    const formData = new FormData()
    formData.append('file', imageFile.value)
    const res = await imageSearch(formData)
    const data = res.data || {}
    recognized.value = {
      category: data.category,
      keywords: data.keywords || [],
      description: data.description
    }
    results.value = data.products || []
    if (!results.value.length) {
      ElMessage.info('AI 已识别图片，但平台暂无相似商品')
    }
  } catch (e) {
    // 拦截器已展示后端错误信息
    results.value = []
    recognized.value = null
  } finally {
    loading.value = false
  }
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
  margin: 0 0 24px;
}

.mode-switch {
  margin-bottom: 28px;
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

/* 🆕 图搜上传区 */
.image-bar {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.upload-zone {
  width: 100%;
  min-height: 180px;
  background: rgba(255, 255, 255, 0.85);
  border: 2px dashed #a0cfff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.25s;
  padding: 16px;
}

.upload-zone:hover {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.15);
}

.upload-zone.has-image {
  border-style: solid;
  border-color: #409eff;
}

.upload-tip {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
}

.upload-sub {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.preview-img {
  max-width: 100%;
  max-height: 220px;
  border-radius: 10px;
  object-fit: contain;
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.image-search-btn {
  min-width: 240px;
  border-radius: 24px;
  font-weight: 600;
}

/* 🆕 AI 识别结果说明条 */
.recognized-bar {
  max-width: 1200px;
  margin: 0 auto 18px;
  padding: 12px 18px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 14px;
}

.recognized-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 6px;
}

.recognized-desc {
  color: #606266;
  margin-left: 6px;
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
