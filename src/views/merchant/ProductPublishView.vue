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

        <!-- 🆕 规格模式切换（Phase 1 - F1 SKU 系统） -->
        <el-form-item label="规格模式">
          <el-radio-group v-model="specMode">
            <el-radio-button value="single">单规格</el-radio-button>
            <el-radio-button value="multi">多规格（SKU）</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 单规格：价格 + 库存 -->
        <template v-if="specMode === 'single'">
          <el-form-item label="价格" prop="price">
            <el-input-number v-model="form.price" :precision="2" :min="0.01" placeholder="留空则按原币价自动折算" />
            <span v-if="form.originalCurrency !== 'CNY' && form.originalPrice > 0" class="price-auto-hint">
              留空将按实时汇率自动折算为人民币
            </span>
          </el-form-item>
          <el-form-item label="库存" prop="stock">
            <el-input-number v-model="form.stock" :min="1" />
          </el-form-item>
        </template>

        <!-- 多规格：规格定义 + SKU 组合表 -->
        <template v-else>
          <el-form-item label="规格定义">
            <div class="spec-groups">
              <div v-for="(group, gi) in specGroups" :key="gi" class="spec-group">
                <el-input v-model="group.name" placeholder="规格名，如：颜色" style="width: 140px;" />
                <el-input
                  v-model="group.values"
                  placeholder="规格值用逗号分隔，如：红,蓝,黑"
                  style="width: 300px; margin: 0 8px;"
                />
                <el-button type="danger" link :disabled="specGroups.length <= 1" @click="removeSpecGroup(gi)">删除</el-button>
              </div>
              <el-button type="primary" link :disabled="specGroups.length >= 3" @click="addSpecGroup">+ 添加规格维度（最多3个）</el-button>
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" @click="generateSkuTable">生成 SKU 组合</el-button>
            <el-button v-if="skuRows.length" link type="primary" @click="batchFill">批量填充：价格 {{ form.price }} / 库存 {{ form.stock }}</el-button>
          </el-form-item>
          <el-form-item v-if="skuRows.length" label="SKU 明细">
            <el-table :data="skuRows" border size="small" style="width: 100%;">
              <el-table-column prop="specText" label="规格" min-width="140" />
              <el-table-column label="价格(元)" width="180">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :precision="2" :min="0.01" size="small" style="width: 150px;" />
                </template>
              </el-table-column>
              <el-table-column label="库存" width="160">
                <template #default="{ row }">
                  <el-input-number v-model="row.stock" :min="0" size="small" style="width: 130px;" />
                </template>
              </el-table-column>
              <el-table-column label="SKU图片URL(可选)" min-width="200">
                <template #default="{ row }">
                  <el-input v-model="row.image" placeholder="留空则用商品封面" size="small" />
                </template>
              </el-table-column>
            </el-table>
            <div class="sku-summary">
              共 {{ skuRows.length }} 个 SKU ｜ 最低价 ¥{{ skuMinPrice }} ｜ 总库存 {{ skuTotalStock }}
            </div>
          </el-form-item>
        </template>

        <!-- 🆕 跨境定价（Phase 3 - F5）：原币 + 原币价 + 原产国，发布后 AI 自动翻译 4 语言 -->
        <el-divider content-position="left">{{ $t('publish.currencySection') }}</el-divider>
        <el-form-item :label="$t('publish.currencyLabel')">
          <el-select v-model="form.originalCurrency" style="width: 220px;">
            <el-option value="CNY" :label="$t('publish.currencyCny')" />
            <el-option
              v-for="c in foreignCurrencies"
              :key="c.code"
              :value="c.code"
              :label="`${c.symbol} ${c.label}`"
            />
          </el-select>
        </el-form-item>
        <template v-if="form.originalCurrency !== 'CNY'">
          <el-form-item :label="$t('publish.originalPriceLabel')">
            <el-input-number v-model="form.originalPrice" :precision="2" :min="0" style="width: 220px;" />
            <span class="forex-convert-hint" v-if="convertedCnyHint">≈ {{ convertedCnyHint }}</span>
          </el-form-item>
          <el-form-item :label="$t('publish.originCountryLabel')">
            <el-input
              v-model="form.originCountry"
              :placeholder="$t('publish.originCountryPlaceholder')"
              style="width: 220px;"
            />
          </el-form-item>
          <div class="forex-hint">{{ $t('publish.forexHint') }}</div>
        </template>

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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import { publishProduct, aiAnalyzeProduct } from '@/api/merchant'
import { useLocaleStore, CURRENCY_OPTIONS } from '@/stores/locale'

const router = useRouter()
const localeStore = useLocaleStore()
const formRef = ref()
const submitting = ref(false)
const aiLoading = ref(false)
const aiImageUrl = ref('')
const aiKeyword = ref('')
const aiTags = ref([])

// 🆕 规格模式与 SKU 编辑状态
const specMode = ref('single')
const specGroups = ref([{ name: '', values: '' }])
const skuRows = ref([])

// 🆕 跨境定价（Phase 3 - F5）：外币选项 + 实时折算预览
const foreignCurrencies = CURRENCY_OPTIONS.filter(c => c.code !== 'CNY')

const form = reactive({
  name: '',
  description: '',
  price: null,               // 留空 + 原币价 → 后端按实时汇率折算 CNY
  stock: 1,
  coverImage: '',
  originalCurrency: 'CNY',
  originalPrice: null,
  originCountry: ''
})

// 原币价 → 人民币参考折算（用当前汇率表，仅预览，落库以后端折算为准）
const convertedCnyHint = computed(() => {
  if (form.originalCurrency === 'CNY' || !form.originalPrice) return ''
  const rate = localeStore.rateOf(form.originalCurrency)
  if (!rate) return ''
  return '¥' + (form.originalPrice * rate).toFixed(2) + ' CNY'
})

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入商品描述', trigger: 'blur' }]
}

const skuMinPrice = computed(() => {
  if (!skuRows.value.length) return '0.00'
  return Math.min(...skuRows.value.map(r => r.price || 0)).toFixed(2)
})
const skuTotalStock = computed(() => skuRows.value.reduce((s, r) => s + (r.stock || 0), 0))

const addSpecGroup = () => specGroups.value.push({ name: '', values: '' })
const removeSpecGroup = (gi) => specGroups.value.splice(gi, 1)

// 笛卡尔积生成 SKU 组合表
const generateSkuTable = () => {
  const groups = specGroups.value
    .map(g => ({
      name: g.name.trim(),
      values: g.values.split(/[,，]/).map(v => v.trim()).filter(Boolean)
    }))
    .filter(g => g.name && g.values.length)
  if (!groups.length) {
    ElMessage.warning('请至少填写一个完整的规格维度（规格名 + 规格值）')
    return
  }
  let combos = [{}]
  for (const g of groups) {
    const next = []
    for (const combo of combos) {
      for (const v of g.values) {
        next.push({ ...combo, [g.name]: v })
      }
    }
    combos = next
  }
  if (combos.length > 50) {
    ElMessage.warning('SKU 组合数超过 50 个，请精简规格值')
    return
  }
  skuRows.value = combos.map(spec => ({
    specJson: JSON.stringify(spec),
    specText: Object.values(spec).join(' / '),
    price: form.price,
    stock: form.stock,
    image: ''
  }))
  ElMessage.success(`已生成 ${skuRows.value.length} 个 SKU 组合，请核对价格与库存`)
}

const batchFill = () => {
  skuRows.value.forEach(r => {
    r.price = form.price ?? 0.01
    r.stock = form.stock
  })
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
  // 🆕 多规格模式校验 + 组装 skus
  let skus = null
  let price = form.price
  let stock = form.stock
  const hasForeignPrice = form.originalCurrency !== 'CNY' && form.originalPrice > 0
  if (specMode.value === 'multi') {
    if (!skuRows.value.length) {
      ElMessage.warning('请先定义规格并点击「生成 SKU 组合」')
      return
    }
    if (skuRows.value.some(r => !r.price || r.price < 0.01)) {
      ElMessage.warning('存在未填写价格的 SKU，请检查')
      return
    }
    skus = skuRows.value.map(r => ({
      specJson: r.specJson,
      specText: r.specText,
      price: r.price,
      stock: r.stock || 0,
      image: r.image || null
    }))
    // 商品表冗余字段：最低价 + 总库存（后端还会以 SKU 聚合重算一次）
    price = Number(skuMinPrice.value)
    stock = skuTotalStock.value
  } else if ((!form.price || form.price < 0.01)) {
    // 单规格：人民币价与原币价二选一；仅填原币价 → 后端按实时汇率折算 CNY（Phase 3 - F5）
    if (!hasForeignPrice) {
      ElMessage.warning('请填写人民币价格，或选择原币并填写原币价格')
      return
    }
    price = null
  }
  submitting.value = true
  try {
    await publishProduct({
      name: form.name,
      description: form.description,
      price,
      stock,
      coverImage: form.coverImage,
      skus,
      originalCurrency: form.originalCurrency,
      originalPrice: hasForeignPrice ? form.originalPrice : null,
      originCountry: form.originCountry || null
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
  max-width: 860px;
  margin: 0 auto;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--gs-text-1);
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
  color: var(--gs-success);
}
.ai-tags {
  padding-top: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.ai-tags-label {
  font-size: 13px;
  color: var(--gs-text-3);
  margin-right: 8px;
}
.form-card {
  border-radius: 8px;
}
.spec-groups {
  width: 100%;
}
.spec-group {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.sku-summary {
  margin-top: 8px;
  font-size: 13px;
  color: var(--gs-text-3);
}
/* 🆕 跨境定价（Phase 3 - F5） */
.forex-hint {
  margin: -8px 0 16px 100px;
  font-size: 12px;
  color: var(--gs-warning);
  line-height: 1.6;
}
.forex-convert-hint {
  margin-left: 12px;
  font-size: 13px;
  color: var(--gs-success);
  font-weight: 600;
}
.price-auto-hint {
  margin-left: 12px;
  font-size: 12px;
  color: var(--gs-text-3);
}
</style>
