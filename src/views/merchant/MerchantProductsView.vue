<template>
  <div class="merchant-products">
    <div class="page-header">
      <h2 class="page-title">我的商品</h2>
      <el-button type="primary" @click="$router.push('/merchant/product/publish')">发布新商品</el-button>
    </div>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="productList" stripe style="width: 100%">
        <el-table-column label="商品图片" width="100" align="center">
          <template #default="{ row }">
            <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 60px; height: 60px; border-radius: 4px;" />
            <span v-else style="color: #c0c4cc; font-size: 12px;">暂无图片</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="price" label="价格" width="120" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.price?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.status === 1 ? 'warning' : 'success'" size="small" link @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无商品" />
        </template>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑商品" width="500px" destroy-on-close>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="editForm.description" type="textarea" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="editForm.price" :precision="2" :min="0" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="editForm.stock" :min="0" /></el-form-item>
        <el-form-item label="封面图"><el-input v-model="editForm.coverImage" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="editSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantProducts, updateProduct, toggleProductStatus, deleteProduct } from '@/api/merchant'

const loading = ref(false)
const productList = ref([])
const showEditDialog = ref(false)
const editForm = ref({})
const editingId = ref(null)
const editSaving = ref(false)

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getMerchantProducts()
    productList.value = res.data || []
  } finally { loading.value = false }
}

function handleEdit(row) {
  editingId.value = row.id
  editForm.value = { name: row.name, description: row.description, price: row.price, stock: row.stock, coverImage: row.coverImage }
  showEditDialog.value = true
}

async function handleSaveEdit() {
  editSaving.value = true
  try {
    await updateProduct(editingId.value, editForm.value)
    ElMessage.success('保存成功')
    showEditDialog.value = false
    await fetchProducts()
  } catch {} finally { editSaving.value = false }
}

async function handleToggleStatus(row) {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await toggleProductStatus(row.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已上架' : '已下架')
    await fetchProducts()
  } catch {}
}

async function handleDelete(id) {
  try {
    await deleteProduct(id)
    ElMessage.success('已删除')
    await fetchProducts()
  } catch {}
}

onMounted(fetchProducts)
</script>

<style scoped>
.merchant-products { max-width: 960px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.table-card { border-radius: 8px; }
</style>
