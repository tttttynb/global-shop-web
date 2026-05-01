<template>
  <div class="product-publish">
    <h2 class="page-title">发布商品</h2>

    <!-- AI智能生成区域 -->
    <el-card class="ai-card" shadow="hover">
      <template #header>
        <div class="ai-card-header">
          <el-icon><MagicStick /></el-icon>
          <span>AI 智能生成</span>
        </div>
      </template>
      <el-form label-width="100px">
        <el-form-item label="图片URL">
          <el-input v-model="aiImageUrl" placeholder="请输入商品图片URL" />
        </el-form-item>
        <el-form-item label="商品关键词">
          <el-input v-model="aiKeyword" placeholder="商品关键词，如：蓝牙耳机" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :icon="MagicStick" :loading="aiLoading" @click="handleAiGenerate">AI生成</el-button>
        </el-form-item>
      </el-form>
      <div v-if="aiTags.length" class="ai-tags">
        <span class="ai-tags-label">智能标签：</span>
        <el-tag v-for="tag in aiTags" :key="tag" style="margin-right: 6px; margin-bottom: 6px;">{{ tag }}</el-tag>
      </div>
    </el-card>

    <!-- 商品表单 -->
    <el-card class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :precision="2" :min="0.01" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="1" />
        </el-form-item>
        <el-form-item label="封面图片URL">
          <el-input v-model="form.coverImage" placeholder="请输入图片URL" />
        </el-form-item>
        <el-form-item v-if="form.coverImage" label="图片预览">
          <el-image :src="form.coverImage" fit="contain" style="width: 200px; height: 200px; border-radius: 8px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">发布商品</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { publishProduct, aiAnalyzeProduct } from '@/api/merchant'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const aiLoading = ref(false)
const aiImageUrl = ref('')
const aiKeyword = ref('')
const aiTags = ref([])

const form = reactive({
  name: '',
  description: '',
  price: 0.01,
  stock: 1,
  coverImage: ''
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

const handleAiGenerate = async () => {
  if (!aiImageUrl.value && !aiKeyword.value) {
    ElMessage.warning('请输入图片URL或商品关键词')
    return
  }
  aiLoading.value = true
  try {
    const res = await aiAnalyzeProduct(aiImageUrl.value, aiKeyword.value)
    form.name = res.data.name || ''
    form.description = res.data.description || ''
    aiTags.value = res.data.tags || []
    if (aiImageUrl.value && !form.coverImage) {
      form.coverImage = aiImageUrl.value
    }
    ElMessage.success('AI生成成功！')
  } finally {
    aiLoading.value = false
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await publishProduct({
      name: form.name,
      description: form.description,
      price: form.price,
      stock: form.stock,
      coverImage: form.coverImage
    })
    ElMessage.success('商品发布成功！')
    router.push('/merchant/products')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.product-publish {
  max-width: 720px;
  margin: 0 auto;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}
.ai-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
.ai-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #67c23a;
}
.ai-tags {
  padding-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.ai-tags-label {
  font-size: 13px;
  color: #909399;
  margin-right: 8px;
}
.form-card {
  border-radius: 8px;
}
</style>
