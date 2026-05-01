<template>
  <div class="page-container refund-page">
    <h2 class="page-title">申请退款</h2>
    <el-card class="refund-card">
      <el-form :model="form" label-width="80px">
        <el-form-item label="订单号">
          <el-input :model-value="form.orderId" disabled />
        </el-form-item>
        <el-form-item label="退款原因">
          <el-select v-model="form.reason" placeholder="选择退款原因" style="width: 100%">
            <el-option label="商品质量问题" value="商品质量问题" />
            <el-option label="发错货/漏发货" value="发错货/漏发货" />
            <el-option label="不想要了" value="不想要了" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可补充说明退款原因" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">提交申请</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applyRefund } from '@/api/order'

const route = useRoute()
const router = useRouter()
const submitting = ref(false)
const form = ref({
  orderId: route.query.orderId || '',
  reason: '',
  description: ''
})

async function handleSubmit() {
  if (!form.value.reason) {
    ElMessage.warning('请选择退款原因')
    return
  }
  submitting.value = true
  try {
    await applyRefund({ orderId: form.value.orderId, reason: form.value.reason + (form.value.description ? '：' + form.value.description : '') })
    ElMessage.success('退款申请已提交')
    router.push('/refunds')
  } catch {} finally { submitting.value = false }
}
</script>

<style scoped>
.refund-page { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.refund-card { border-radius: 12px; }
</style>
