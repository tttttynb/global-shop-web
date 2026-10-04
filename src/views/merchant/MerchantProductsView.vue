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
            <span style="color: var(--gs-price); font-weight: 600;">¥{{ row.price?.toFixed(2) }}</span>
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
          <el-empty description="还没有商品，发布第一批好物开始经营吧">
            <div class="empty-actions">
              <el-button type="primary" @click="$router.push('/merchant/product/publish')">发布商品</el-button>
            </div>
          </el-empty>
        </template>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑商品" width="760px" destroy-on-close>
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="editForm.description" type="textarea" /></el-form-item>
        <el-form-item label="封面图"><el-input v-model="editForm.coverImage" /></el-form-item>
        <!-- 🆕 SKU 规格编辑：成交价以 SKU 为准，商品级价格/库存由 SKU 自动聚合（最低价/总和） -->
        <el-form-item label="规格明细">
          <div style="width: 100%;">
            <el-table :data="editSkus" border size="small" style="width: 100%;">
              <el-table-column label="规格" min-width="130">
                <template #default="{ row }">
                  <el-input v-model="row.specText" placeholder="如：红 / M" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="价格(元)" width="140">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :precision="2" :min="0.01" size="small" style="width: 115px;" />
                </template>
              </el-table-column>
              <el-table-column label="库存" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="0" size="small" style="width: 95px;" />
                </template>
              </el-table-column>
              <el-table-column label="SKU图片URL(可选)" min-width="170">
                <template #default="{ row }">
                  <el-input v-model="row.image" placeholder="留空则用商品封面" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" :disabled="editSkus.length <= 1" @click="editSkus.splice($index, 1)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <el-button type="primary" link @click="editSkus.push({ id: null, specText: '', price: editMinPrice || 0.01, stock: 0, image: '' })">+ 添加规格</el-button>
                <el-input-number v-model="bulkPrice" :precision="2" :min="0.01" size="small" style="width: 110px; margin-left: 12px;" />
                <el-input-number v-model="bulkStock" :min="0" size="small" style="width: 90px; margin: 0 6px;" />
                <el-button type="warning" link @click="applyBulk">批量填充全部 SKU</el-button>
              </div>
              <span style="font-size: 13px; color: #909399;">
                共 {{ editSkus.length }} 个 SKU ｜ 商品价 ¥{{ editMinPrice.toFixed(2) }} ｜ 总库存 {{ editTotalStock }}
              </span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="editSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantProducts, updateProduct, toggleProductStatus, deleteProduct } from '@/api/merchant'
import { getProductSkus } from '@/api/product'

const loading = ref(false)
const productList = ref([])
const showEditDialog = ref(false)
const editForm = ref({})
const editingId = ref(null)
const editSaving = ref(false)
// 🆕 编辑弹窗的 SKU 明细（成交价真相源）
const editSkus = ref([])
// 批量填充用的价格/库存
const bulkPrice = ref(0.01)
const bulkStock = ref(0)

const applyBulk = () => {
  editSkus.value.forEach(r => {
    r.price = bulkPrice.value
    r.stock = bulkStock.value
  })
}

const editMinPrice = computed(() => {
  if (!editSkus.value.length) return 0
  return Math.min(...editSkus.value.map(r => Number(r.price) || 0))
})
const editTotalStock = computed(() => editSkus.value.reduce((s, r) => s + (Number(r.stock) || 0), 0))

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getMerchantProducts()
    productList.value = res.data || []
  } finally { loading.value = false }
}

async function handleEdit(row) {
  editingId.value = row.id
  editForm.value = { name: row.name, description: row.description, coverImage: row.coverImage }
  editSkus.value = []
  showEditDialog.value = true
  // 加载现有 SKU；接口对存量无 SKU 商品会自动补默认 SKU，保证表格始终有数据
  try {
    const res = await getProductSkus(row.id)
    editSkus.value = (res.data || []).map(s => ({
      id: s.id,
      specText: s.specText,
      price: Number(s.price),
      stock: s.stock,
      image: s.image || ''
    }))
  } catch {
    editSkus.value = [{ id: null, specText: '默认规格', price: row.price, stock: row.stock, image: '' }]
  }
  if (!editSkus.value.length) {
    editSkus.value = [{ id: null, specText: '默认规格', price: row.price, stock: row.stock, image: '' }]
  }
  // 批量填充输入框预置为当前商品价/均分库存，方便“整体改价”场景
  bulkPrice.value = Number(row.price) || 0.01
  bulkStock.value = editSkus.value.length ? Math.floor((Number(row.stock) || 0) / editSkus.value.length) : (Number(row.stock) || 0)
}

async function handleSaveEdit() {
  if (editSkus.value.some(r => !r.specText || !r.specText.trim())) {
    ElMessage.warning('请填写每个 SKU 的规格文本')
    return
  }
  if (editSkus.value.some(r => !r.price || r.price < 0.01)) {
    ElMessage.warning('存在未填写价格的 SKU，请检查')
    return
  }
  editSaving.value = true
  try {
    await updateProduct(editingId.value, {
      ...editForm.value,
      // 商品级冗余字段：后端还会以 SKU 聚合重算一次，这里先给摘要值
      price: editMinPrice.value,
      stock: editTotalStock.value,
      skus: editSkus.value.map(r => ({
        id: r.id,
        specText: r.specText.trim(),
        price: r.price,
        stock: r.stock || 0,
        image: r.image || null
      }))
    })
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
.page-title { font-size: 20px; font-weight: 600; color: var(--gs-text-1); margin: 0; }
.table-card { border-radius: 8px; }
</style>
