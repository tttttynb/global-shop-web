<template>
  <div class="merchant-groupbuy-page">
    <div class="page-head">
      <h2>👥 拼团活动管理</h2>
      <el-button type="danger" @click="openCreateDialog">+ 创建拼团活动</el-button>
    </div>
    <p class="page-tip">拼团玩法：设置成团人数与拼团价，买家开团/参团，成团后发货；超时未成团系统自动退款。跨境场景主打"拼邮费"。</p>

    <el-table :data="activities" v-loading="loading" stripe>
      <el-table-column label="商品" min-width="220">
        <template #default="{ row }">
          <div class="product-cell">
            <el-image :src="productMap[row.productId]?.coverImage" fit="cover" class="p-img">
              <template #error><div class="p-img-fallback">📦</div></template>
            </el-image>
            <div class="p-info">
              <div class="p-name">{{ productMap[row.productId]?.name || ('#' + row.productId) }}</div>
              <div class="p-sub">原价 ¥{{ productMap[row.productId]?.price ?? '-' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="拼团价" width="110">
        <template #default="{ row }">
          <span class="group-price">¥{{ row.groupPrice }}</span>
        </template>
      </el-table-column>
      <el-table-column label="成团人数" width="90" align="center">
        <template #default="{ row }">{{ row.requiredMembers }} 人</template>
      </el-table-column>
      <el-table-column label="有效时长" width="90" align="center">
        <template #default="{ row }">{{ row.validHours }} 小时</template>
      </el-table-column>
      <el-table-column label="限购" width="80" align="center">
        <template #default="{ row }">{{ row.perUserLimit ?? 1 }} 次/人</template>
      </el-table-column>
      <el-table-column label="活动库存" width="90" align="center">
        <template #default="{ row }">{{ row.activityStock ?? '不限' }}</template>
      </el-table-column>
      <el-table-column label="已拼件数" width="90" align="center">
        <template #default="{ row }">{{ row.soldCount ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="活动时间" width="170">
        <template #default="{ row }">
          <div class="time-cell">{{ fmt(row.startTime) }} ~</div>
          <div class="time-cell">{{ row.endTime ? fmt(row.endTime) : '长期' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '进行中' : '已下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 1" size="small" @click="toggleStatus(row, 0)">下架</el-button>
          <el-button v-else size="small" type="primary" @click="toggleStatus(row, 1)">上架</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无拼团活动，点击右上角创建" :image-size="80" /></template>
    </el-table>

    <!-- 创建弹窗 -->
    <el-dialog v-model="createVisible" title="创建拼团活动" width="480px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="选择商品" required>
          <el-select v-model="form.productId" placeholder="请选择店铺商品" filterable style="width: 100%" @change="handleProductChange">
            <el-option v-for="p in products" :key="p.id" :label="`${p.name}（¥${p.price}）`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="拼团价" required>
          <el-input-number v-model="form.groupPrice" :min="0.01" :precision="2" :step="1" style="width: 100%" />
          <div class="form-tip" v-if="selectedProduct">原价 ¥{{ selectedProduct.price }}，拼团价须低于原价</div>
        </el-form-item>
        <el-form-item label="成团人数" required>
          <el-input-number v-model="form.requiredMembers" :min="2" :max="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效时长(小时)" required>
          <el-input-number v-model="form.validHours" :min="1" :max="168" style="width: 100%" />
          <div class="form-tip">开团后 N 小时内未凑齐人数，自动退款解散</div>
        </el-form-item>
        <el-form-item label="每人限参次数">
          <el-input-number v-model="form.perUserLimit" :min="1" :max="10" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="danger" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMerchantProducts } from '@/api/merchant'
import { createGroupActivity, getMerchantActivities, updateActivityStatus } from '@/api/groupBuy'

const loading = ref(false)
const creating = ref(false)
const activities = ref([])
const products = ref([])
const createVisible = ref(false)

const form = ref({
  productId: null,
  groupPrice: null,
  requiredMembers: 3,
  validHours: 24,
  perUserLimit: 1
})

const productMap = computed(() => {
  const map = {}
  products.value.forEach(p => { map[p.id] = p })
  return map
})

const selectedProduct = computed(() => form.value.productId ? productMap.value[form.value.productId] : null)

function fmt(str) {
  if (!str) return ''
  return String(str).replace('T', ' ').substring(0, 16)
}

async function loadAll() {
  loading.value = true
  try {
    const [aRes, pRes] = await Promise.all([getMerchantActivities(), getMerchantProducts()])
    activities.value = aRes.code === 200 ? (aRes.data || []) : []
    products.value = pRes.code === 200 ? (pRes.data || []) : []
  } catch {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  form.value = { productId: null, groupPrice: null, requiredMembers: 3, validHours: 24, perUserLimit: 1 }
  createVisible.value = true
}

function handleProductChange(id) {
  const p = productMap.value[id]
  if (p && p.price) {
    // 默认拼团价 = 原价 85 折
    form.value.groupPrice = Math.max(0.01, Math.floor(Number(p.price) * 0.85 * 100) / 100)
  }
}

async function handleCreate() {
  if (!form.value.productId) return ElMessage.warning('请选择商品')
  if (!form.value.groupPrice || form.value.groupPrice <= 0) return ElMessage.warning('请填写拼团价')
  if (selectedProduct.value && Number(form.value.groupPrice) >= Number(selectedProduct.value.price)) {
    return ElMessage.warning('拼团价必须低于原价')
  }
  creating.value = true
  try {
    const res = await createGroupActivity({
      productId: form.value.productId,
      skuId: null,
      groupPrice: form.value.groupPrice,
      requiredMembers: form.value.requiredMembers,
      validHours: form.value.validHours,
      perUserLimit: form.value.perUserLimit
    })
    if (res.code === 200) {
      ElMessage.success(res.data || '创建成功')
      createVisible.value = false
      await loadAll()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '创建失败')
  } finally {
    creating.value = false
  }
}

async function toggleStatus(row, status) {
  try {
    const res = await updateActivityStatus(row.id, status)
    if (res.code === 200) {
      ElMessage.success(status === 1 ? '已上架' : '已下架')
      await loadAll()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(loadAll)
</script>

<style scoped>
.merchant-groupbuy-page {
  padding: 20px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.page-head h2 {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.page-tip {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.p-img {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  flex-shrink: 0;
}

.p-img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.p-info {
  min-width: 0;
}

.p-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.p-sub {
  font-size: 12px;
  color: #909399;
}

.group-price {
  color: #ee0a24;
  font-weight: 700;
}

.time-cell {
  font-size: 12px;
  color: #606266;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
