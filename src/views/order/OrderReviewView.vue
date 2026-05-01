<template>
  <div class="page-container review-page">
    <div class="review-card-wrap">
      <el-card class="review-card" shadow="always">
        <h2 class="review-title">商品评价</h2>
        <p class="review-subtitle">订单项ID：{{ orderItemId }}</p>

        <el-form :model="form" label-position="top" class="review-form">
          <el-form-item label="评分">
            <el-rate v-model="form.rating" show-text :texts="['很差', '较差', '一般', '满意', '非常满意']" />
          </el-form-item>

          <el-form-item label="评价内容">
            <el-input v-model="form.content" type="textarea" :rows="4" placeholder="分享您的使用体验..." maxlength="500" show-word-limit />
          </el-form-item>

          <el-form-item label="评价图片URL（可选）">
            <el-input v-model="form.images" placeholder="评价图片URL（可选）" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" class="submit-btn" @click="handleSubmit" :loading="submitting" :disabled="!form.rating">
              提交评价
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { submitReview } from '@/api/order'

const route = useRoute()
const router = useRouter()

const orderItemId = ref(route.params.orderItemId)
const submitting = ref(false)

const form = reactive({
  rating: 0,
  content: '',
  images: ''
})

async function handleSubmit() {
  if (!form.rating) {
    ElMessage.warning('请先评分')
    return
  }
  submitting.value = true
  try {
    await submitReview({
      orderItemId: orderItemId.value,
      rating: form.rating,
      content: form.content,
      images: form.images || null
    })
    ElMessage.success('评价提交成功')
    router.push('/orders')
  } catch (e) {
    ElMessage.error(e.message || '评价提交失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 16px;
}

.review-card-wrap {
  display: flex;
  justify-content: center;
}

.review-card {
  width: 520px;
  border-radius: 16px;
  padding: 24px;
}

.review-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
  margin-bottom: 4px;
}

.review-subtitle {
  font-size: 13px;
  color: #909399;
  text-align: center;
  margin-bottom: 24px;
}

.review-form {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
}
</style>
