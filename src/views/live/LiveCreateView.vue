<template>
  <div class="page-container live-create">
    <h2 class="page-title">创建直播间</h2>

    <el-card class="create-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="直播标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入直播标题" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="封面图片" prop="coverImage">
          <el-input v-model="form.coverImage" placeholder="请输入封面图片URL" />
        </el-form-item>

        <el-form-item v-if="form.coverImage" label="封面预览">
          <el-image
            :src="form.coverImage"
            fit="cover"
            class="cover-preview"
          >
            <template #error>
              <div class="preview-error">图片加载失败</div>
            </template>
          </el-image>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">创建直播间</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createLiveRoom } from '@/api/live'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  title: '',
  coverImage: ''
})

const rules = {
  title: [{ required: true, message: '请输入直播标题', trigger: 'blur' }]
}

async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const res = await createLiveRoom({ title: form.title, coverImage: form.coverImage })
    ElMessage.success('直播间创建成功')
    router.push(`/merchant/live/${res.data.id || res.data}/console`)
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.live-create {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}
.create-card {
  padding: 12px;
}
.cover-preview {
  width: 320px;
  height: 180px;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.preview-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  color: #999;
  font-size: 13px;
}
</style>
