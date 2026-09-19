<template>
  <div class="page-container live-console" v-loading="loading">
    <h2 class="page-title">直播控制台</h2>

    <template v-if="liveRoom">
      <!-- 开播/下播区域 -->
      <el-card class="console-card">
        <template #header>
          <div class="card-header">
            <span>直播状态</span>
            <el-tag :type="statusTagType">{{ statusText }}</el-tag>
          </div>
        </template>
        <div class="status-actions">
          <h3>{{ liveRoom.title }}</h3>
          <div class="action-row">
            <el-button
              v-if="liveRoom.status === 0"
              type="primary"
              size="large"
              :loading="actionLoading"
              @click="handleStart"
            >开始直播</el-button>
            <el-button
              v-else-if="liveRoom.status === 1"
              type="danger"
              size="large"
              :loading="actionLoading"
              @click="handleStop"
            >结束直播</el-button>
            <el-tag v-else type="info" size="large">直播已结束</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 推流信息 -->
      <el-card v-if="liveRoom.status === 1" class="console-card">
        <template #header><span>推流信息</span></template>
        <el-form label-width="90px">
          <el-form-item label="推流地址">
            <el-input :model-value="liveRoom.pushUrl" readonly>
              <template #append>
                <el-button @click="copyText(liveRoom.pushUrl)">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="拉流地址">
            <el-input :model-value="liveRoom.pullUrl" readonly>
              <template #append>
                <el-button @click="copyText(liveRoom.pullUrl)">复制</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
        <el-alert type="info" :closable="false" show-icon>
          请将推流地址粘贴到 OBS 等直播软件中
        </el-alert>
      </el-card>

      <!-- 商品管理 -->
      <el-card class="console-card">
        <template #header>
          <div class="card-header">
            <span>商品管理</span>
            <el-button type="primary" size="small" @click="showAddDialog = true">添加商品</el-button>
          </div>
        </template>
        <el-table :data="liveRoom.products || []" stripe>
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80" />
          <el-table-column label="讲解中" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isExplaining" type="danger" size="small">讲解中</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button
                v-if="!row.isExplaining"
                type="warning"
                size="small"
                link
                :loading="explainingLoading === row.productId"
                @click="handleSetExplaining(row.productId)"
              >设为讲解</el-button>
              <el-tag v-else type="success" size="small">当前讲解</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 🆕 闪购秒杀（Phase 2 - F3） -->
      <el-card class="console-card flash-sale-card">
        <template #header>
          <div class="card-header">
            <span>⚡ 闪购秒杀</span>
            <el-tag v-if="activeSale" type="danger" effect="dark">进行中</el-tag>
          </div>
        </template>

        <!-- 进行中的秒杀 -->
        <div v-if="activeSale" class="active-sale">
          <div class="active-sale-info">
            <div class="active-sale-name">{{ activeSale.productName }}</div>
            <div class="active-sale-meta">
              秒杀价 <strong class="fs-price">¥{{ Number(activeSale.flashPrice).toFixed(2) }}</strong>
              <span class="fs-original">原价 ¥{{ Number(activeSale.originalPrice).toFixed(2) }}</span>
            </div>
            <el-progress
              :percentage="activeSale.soldPercent || 0"
              :stroke-width="12"
              color="#ff4d4f"
              style="margin: 8px 0 4px;"
            />
            <div class="active-sale-meta">
              已抢 {{ activeSale.soldPercent || 0 }}% ｜ 剩余 {{ activeSale.remainQty }}/{{ activeSale.totalQty }} 件
            </div>
          </div>
          <el-button
            type="danger"
            plain
            :loading="fsCancelLoading"
            @click="handleCancelFlashSale"
          >终止秒杀</el-button>
        </div>

        <!-- 发起新秒杀 -->
        <el-form v-else label-width="90px" :disabled="liveRoom.status !== 1">
          <el-form-item label="秒杀商品">
            <el-select v-model="fsForm.productId" placeholder="从直播间商品中选择" style="width: 100%;" @change="onFsProductChange">
              <el-option
                v-for="p in (liveRoom.products || [])"
                :key="p.productId"
                :label="`${p.productName}（¥${p.price} / 库存${p.stock}）`"
                :value="p.productId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="秒杀价">
            <el-input-number v-model="fsForm.flashPrice" :precision="2" :min="0.01" />
            <span class="fs-tip" v-if="fsOriginalPrice > 0">原价 ¥{{ fsOriginalPrice }}，{{ fsDiscountText }}</span>
          </el-form-item>
          <el-form-item label="秒杀数量">
            <el-input-number v-model="fsForm.totalQty" :min="1" :max="Math.max(1, fsMaxQty)" />
            <span class="fs-tip">将从商品库存中预占，结束后未售出自动归还</span>
          </el-form-item>
          <el-form-item label="持续时长">
            <el-radio-group v-model="fsForm.durationMinutes">
              <el-radio-button :value="3">3 分钟</el-radio-button>
              <el-radio-button :value="5">5 分钟</el-radio-button>
              <el-radio-button :value="10">10 分钟</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="danger" :loading="fsLoading" @click="handleStartFlashSale">
              🚀 发起秒杀（观众端实时弹出）
            </el-button>
          </el-form-item>
        </el-form>
        <el-alert v-if="liveRoom.status !== 1 && !activeSale" type="info" :closable="false" show-icon>
          开播后才能发起秒杀
        </el-alert>
      </el-card>

      <!-- AI助理开关 -->
      <el-card class="console-card">
        <template #header><span>AI助理</span></template>
        <div class="ai-switch-row">
          <span>AI助理自动回答：</span>
          <el-switch
            v-model="aiEnabled"
            :loading="aiLoading"
            @change="handleToggleAi"
          />
        </div>
        <p v-if="aiEnabled" class="ai-tip">AI助理将自动回答观众关于商品的问题</p>
      </el-card>

      <!-- 底部链接 -->
      <div class="bottom-link">
        <router-link :to="`/live/${liveRoom.id}`">
          <el-button type="primary" link>查看观众端 →</el-button>
        </router-link>
      </div>

      <!-- 历史弹幕 -->
      <el-card class="console-card">
        <template #header>
          <div class="card-header">
            <span>历史弹幕</span>
            <el-button type="primary" size="small" @click="fetchHistory">刷新</el-button>
          </div>
        </template>
        <div v-loading="historyLoading" class="history-messages">
          <el-empty v-if="historyMessages.length === 0" description="暂无弹幕记录" :image-size="60" />
          <div v-for="msg in historyMessages" :key="msg.id" class="history-msg-item">
            <span class="msg-nickname">{{ msg.nickname || '匿名' }}</span>
            <span class="msg-content">{{ msg.content }}</span>
            <span class="msg-time">{{ msg.createTime }}</span>
          </div>
        </div>
      </el-card>
    </template>

    <!-- 添加商品弹窗 -->
    <el-dialog v-model="showAddDialog" title="添加商品" width="600px" destroy-on-close>
      <div v-loading="productsLoading">
        <el-table
          ref="productTableRef"
          :data="allProducts"
          @selection-change="onSelectionChange"
          max-height="400"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" :disabled="selectedProducts.length === 0" @click="handleAddProducts">
          添加 ({{ selectedProducts.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getLiveDetail, startLive, stopLive, addLiveProducts, setExplainingProduct, toggleAiAssistant, getHistoryMessages, startFlashSale, cancelFlashSale, getActiveFlashSale } from '@/api/live'
import { getProductList } from '@/api/product'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const roomId = route.params.id

const liveRoom = ref(null)
const loading = ref(false)
const actionLoading = ref(false)
const explainingLoading = ref(null)
const aiEnabled = ref(false)
const aiLoading = ref(false)

// 添加商品相关
const showAddDialog = ref(false)
const allProducts = ref([])
const productsLoading = ref(false)
const selectedProducts = ref([])
const addLoading = ref(false)
const historyMessages = ref([])
const historyLoading = ref(false)

// 🆕 闪购秒杀状态（Phase 2 - F3）
const fsForm = ref({ productId: null, flashPrice: 0.01, totalQty: 10, durationMinutes: 3 })
const activeSale = ref(null)
const fsLoading = ref(false)
const fsCancelLoading = ref(false)
let fsPoller = null

const fsSelectedProduct = computed(() =>
  (liveRoom.value?.products || []).find(p => p.productId === fsForm.value.productId) || null
)
const fsOriginalPrice = computed(() => Number(fsSelectedProduct.value?.price || 0))
const fsMaxQty = computed(() => fsSelectedProduct.value?.stock ?? 500)
const fsDiscountText = computed(() => {
  const op = fsOriginalPrice.value
  const fp = Number(fsForm.value.flashPrice || 0)
  if (op > 0 && fp > 0 && fp < op) return `相当于 ${(fp / op * 10).toFixed(1)} 折`
  return ''
})

function onFsProductChange() {
  const p = fsSelectedProduct.value
  if (p) {
    // 默认给个 8 折秒杀价，数量不超过库存的一半（至少1件）
    fsForm.value.flashPrice = Math.max(0.01, Number((p.price * 0.8).toFixed(2)))
    fsForm.value.totalQty = Math.max(1, Math.min(500, Math.floor((p.stock || 2) / 2)))
  }
}

async function fetchActiveSale() {
  try {
    const res = await getActiveFlashSale(roomId)
    activeSale.value = res.data || null
    // 有进行中的活动时轮询进度（控制台无 WS，5 秒一次）
    if (activeSale.value && !fsPoller) {
      fsPoller = setInterval(fetchActiveSale, 5000)
    } else if (!activeSale.value && fsPoller) {
      clearInterval(fsPoller)
      fsPoller = null
    }
  } catch (e) {
    activeSale.value = null
  }
}

async function handleStartFlashSale() {
  if (!fsForm.value.productId) {
    ElMessage.warning('请选择秒杀商品')
    return
  }
  if (fsOriginalPrice.value > 0 && fsForm.value.flashPrice >= fsOriginalPrice.value) {
    ElMessage.warning('秒杀价必须低于原价')
    return
  }
  fsLoading.value = true
  try {
    const res = await startFlashSale({
      roomId: Number(roomId),
      productId: fsForm.value.productId,
      flashPrice: fsForm.value.flashPrice,
      totalQty: fsForm.value.totalQty,
      durationMinutes: fsForm.value.durationMinutes
    })
    activeSale.value = res.data
    ElMessage.success('🚀 秒杀已发起，观众端已实时弹出秒杀卡片！')
    await fetchDetail() // 刷新商品库存展示（已预占）
    fetchActiveSale()
  } catch (e) {
    // 拦截器已提示后端错误信息
  } finally {
    fsLoading.value = false
  }
}

async function handleCancelFlashSale() {
  try {
    await ElMessageBox.confirm('确定终止本场秒杀吗？未售出库存将归还商城。', '提示', { type: 'warning' })
  } catch { return }
  fsCancelLoading.value = true
  try {
    await cancelFlashSale(activeSale.value.id)
    ElMessage.success('秒杀已终止，库存已回补')
    activeSale.value = null
    await fetchDetail()
  } catch (e) {
    // 拦截器已提示
  } finally {
    fsCancelLoading.value = false
  }
}

const statusText = computed(() => {
  if (!liveRoom.value) return ''
  const s = liveRoom.value.status
  if (s === 0) return '未开始'
  if (s === 1) return '直播中'
  return '已结束'
})

const statusTagType = computed(() => {
  if (!liveRoom.value) return 'info'
  const s = liveRoom.value.status
  if (s === 0) return 'warning'
  if (s === 1) return 'success'
  return 'info'
})

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getLiveDetail(roomId)
    liveRoom.value = res.data
    aiEnabled.value = !!res.data.aiAssistantEnabled
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleStart() {
  actionLoading.value = true
  try {
    await startLive(roomId)
    ElMessage.success('直播已开始')
    await fetchDetail()
  } catch (e) {
    ElMessage.error('开播失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleStop() {
  try {
    await ElMessageBox.confirm('确定要结束直播吗？', '提示', { type: 'warning' })
  } catch { return }
  actionLoading.value = true
  try {
    await stopLive(roomId)
    ElMessage.success('直播已结束')
    await fetchDetail()
  } catch (e) {
    ElMessage.error('下播失败')
  } finally {
    actionLoading.value = false
  }
}

async function handleSetExplaining(productId) {
  explainingLoading.value = productId
  try {
    await setExplainingProduct(roomId, productId)
    ElMessage.success('已设为讲解商品')
    await fetchDetail()
  } catch (e) {
    ElMessage.error('设置失败')
  } finally {
    explainingLoading.value = null
  }
}

async function handleToggleAi(val) {
  aiLoading.value = true
  try {
    await toggleAiAssistant(roomId, val)
    ElMessage.success(val ? 'AI助理已开启' : 'AI助理已关闭')
  } catch (e) {
    aiEnabled.value = !val
    ElMessage.error('切换失败')
  } finally {
    aiLoading.value = false
  }
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 添加商品弹窗
watch(showAddDialog, async (val) => {
  if (val) {
    productsLoading.value = true
    try {
      const res = await getProductList()
      allProducts.value = res.data || []
    } catch (e) {
      allProducts.value = []
    } finally {
      productsLoading.value = false
    }
  }
})

function onSelectionChange(rows) {
  selectedProducts.value = rows
}

async function handleAddProducts() {
  addLoading.value = true
  try {
    const productIds = selectedProducts.value.map(p => p.id)
    await addLiveProducts(roomId, { productIds })
    ElMessage.success('商品添加成功')
    showAddDialog.value = false
    await fetchDetail()
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    addLoading.value = false
  }
}

onMounted(() => {
  fetchDetail()
  fetchHistory()
  fetchActiveSale()
})

onUnmounted(() => {
  if (fsPoller) {
    clearInterval(fsPoller)
    fsPoller = null
  }
})

async function fetchHistory() {
  historyLoading.value = true
  try {
    // 修复：分页参数为 page/size 两个数字，返回体为 {list,total,...}
    const res = await getHistoryMessages(roomId, 1, 100)
    historyMessages.value = res.data?.list || []
  } catch (e) {
    historyMessages.value = []
  } finally {
    historyLoading.value = false
  }
}
</script>

<style scoped>
.live-console {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}
.console-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status-actions h3 {
  margin-bottom: 16px;
  font-size: 16px;
}
.action-row {
  display: flex;
  gap: 12px;
}
.ai-switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
.ai-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #67c23a;
}
.bottom-link {
  text-align: center;
  margin-top: 16px;
}
.history-messages {
  max-height: 300px;
  overflow-y: auto;
}
.history-msg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.msg-nickname {
  color: #409eff;
  font-weight: 500;
  flex-shrink: 0;
}
.msg-content {
  flex: 1;
  color: #303133;
}
.msg-time {
  color: #999;
  font-size: 12px;
  flex-shrink: 0;
}

/* 🆕 闪购秒杀面板 */
.flash-sale-card {
  border: 1px solid #ffccc7;
}
.active-sale {
  display: flex;
  align-items: center;
  gap: 20px;
}
.active-sale-info {
  flex: 1;
}
.active-sale-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}
.active-sale-meta {
  font-size: 13px;
  color: #606266;
}
.fs-price {
  color: #ff4d4f;
  font-size: 17px;
}
.fs-original {
  color: #c0c4cc;
  text-decoration: line-through;
  margin-left: 8px;
  font-size: 12px;
}
.fs-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
