<template>
  <div class="page-container profile-page">
    <h2 class="page-title">个人中心</h2>

    <el-card class="profile-card" v-loading="loading">
      <template #header><span>基本信息</span></template>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input :model-value="form.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="设置昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="邮箱" />
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="form.avatar" placeholder="头像图片地址" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="profile-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>收货地址</span>
          <el-button type="primary" size="small" @click="handleAddAddress">新增地址</el-button>
        </div>
      </template>
      <div v-loading="addressLoading">
        <div v-if="addressList.length === 0">
          <el-empty description="暂无收货地址" :image-size="60" />
        </div>
        <div v-for="addr in addressList" :key="addr.id" class="address-item">
          <div class="address-info">
            <span class="addr-name">{{ addr.receiverName }}</span>
            <span class="addr-phone">{{ addr.phone }}</span>
            <el-tag v-if="addr.isDefault" type="danger" size="small">默认</el-tag>
          </div>
          <div class="addr-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detailAddress }}</div>
          <div class="addr-actions">
            <el-button text type="primary" size="small" @click="handleEditAddress(addr)">编辑</el-button>
            <el-button text type="danger" size="small" @click="handleDeleteAddress(addr.id)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 地址编辑弹窗 -->
    <el-dialog v-model="showAddrDialog" :title="editingAddr ? '编辑地址' : '新增地址'" width="500px" destroy-on-close>
      <el-form :model="addrForm" label-width="80px">
        <el-form-item label="收货人"><el-input v-model="addrForm.receiverName" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="addrForm.phone" /></el-form-item>
        <el-form-item label="省份"><el-input v-model="addrForm.province" /></el-form-item>
        <el-form-item label="城市"><el-input v-model="addrForm.city" /></el-form-item>
        <el-form-item label="区县"><el-input v-model="addrForm.district" /></el-form-item>
        <el-form-item label="详细地址"><el-input v-model="addrForm.detailAddress" type="textarea" /></el-form-item>
        <el-form-item label="默认地址"><el-switch v-model="addrForm.isDefault" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddrDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAddress" :loading="addrSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProfile, updateProfile, getAddressList, addAddress, updateAddress, deleteAddress } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const form = ref({ username: '', nickname: '', phone: '', email: '', avatar: '' })

const addressLoading = ref(false)
const addressList = ref([])
const showAddrDialog = ref(false)
const editingAddr = ref(null)
const addrSaving = ref(false)
const addrForm = ref({ receiverName: '', phone: '', province: '', city: '', district: '', detailAddress: '', isDefault: false })

async function loadProfile() {
  loading.value = true
  try {
    const res = await getProfile()
    form.value = res.data || {}
  } catch {} finally { loading.value = false }
}

async function handleSave() {
  saving.value = true
  try {
    await updateProfile({ nickname: form.value.nickname, phone: form.value.phone, email: form.value.email, avatar: form.value.avatar })
    ElMessage.success('保存成功')
  } catch {} finally { saving.value = false }
}

async function loadAddresses() {
  addressLoading.value = true
  try {
    const res = await getAddressList()
    addressList.value = res.data || []
  } catch {} finally { addressLoading.value = false }
}

function handleAddAddress() {
  editingAddr.value = null
  addrForm.value = { receiverName: '', phone: '', province: '', city: '', district: '', detailAddress: '', isDefault: false }
  showAddrDialog.value = true
}

function handleEditAddress(addr) {
  editingAddr.value = addr
  addrForm.value = { ...addr }
  showAddrDialog.value = true
}

async function handleSaveAddress() {
  addrSaving.value = true
  try {
    if (editingAddr.value) {
      await updateAddress(editingAddr.value.id, addrForm.value)
    } else {
      await addAddress(addrForm.value)
    }
    ElMessage.success('保存成功')
    showAddrDialog.value = false
    await loadAddresses()
  } catch {} finally { addrSaving.value = false }
}

async function handleDeleteAddress(id) {
  try {
    await ElMessageBox.confirm('确定删除该地址？', '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteAddress(id)
    ElMessage.success('删除成功')
    await loadAddresses()
  } catch {}
}

onMounted(() => { loadProfile(); loadAddresses() })
</script>

<style scoped>
.profile-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.page-title { font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #1a1a2e; }
.profile-card { border-radius: 12px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.address-item { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.address-item:last-child { border-bottom: none; }
.address-info { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.addr-name { font-weight: 600; }
.addr-phone { color: #909399; font-size: 13px; }
.addr-detail { font-size: 14px; color: #606266; margin-bottom: 4px; }
.addr-actions { display: flex; gap: 4px; }
</style>
