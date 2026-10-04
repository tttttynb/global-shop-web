<template>
  <div class="merchant-apply">
    <h2 class="page-title">申请开店</h2>
    <el-card class="apply-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="店铺名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入店铺名称" />
        </el-form-item>
        <el-form-item label="店铺描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入店铺描述" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applyShop } from '@/api/merchant'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)

const form = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入店铺名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入店铺描述', trigger: 'blur' }]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await applyShop({ name: form.name, description: form.description })
    ElMessage.success('开店申请成功！')
    router.push('/merchant/products')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.merchant-apply {
  max-width: 640px;
  margin: 0 auto;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--gs-text-1);
}
.apply-card {
  border-radius: 8px;
}
</style>
