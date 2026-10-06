# 🌍 Global Shop Web — 前端

> **[Global Shop](https://github.com/tttttynb/global-shop)** 跨境电商平台前端：Vue 3 + Element Plus，四语言国际化 + 七币种参考价切换，AI 能力全站贯穿。

## 🚀 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（`<script setup>`）+ Vite |
| UI | Element Plus（设计令牌全量换肤，见 `src/styles/tokens.css`） |
| 图表 | ECharts 6（按需引入：价格走势 / 看板环形图 / 条形图） |
| 状态 | Pinia |
| 路由 | Vue Router 4（nprogress 进度条 + 动态页面标题） |
| 国际化 | vue-i18n（中 / 英 / 日 / 韩） |
| 时间 | dayjs（统一倒计时/解析，规避 Safari 兼容） |
| HTTP | Axios（自动注入 JWT + `Accept-Language`） |
| 直播播放 | flv.js / hls.js |

## ✨ 页面一览

### 买家端
| 路由 | 页面 | 亮点 |
|------|------|------|
| `/` | 首页 | 主 Banner + AI/直播双入口卡、类目金刚区（直达筛选列表）、跳色楼层（直播 / 拼团 / 推荐流） |
| `/products` `/search` | 商品列表 / 搜索 | 排序 Tab（综合/销量/价格）、**价格区间筛选**、已售标签、类目聚合 chips |
| `/ai/search` | AI 语义搜索 | 以图搜图（拍照找同款）、全文/语义双模式、空结果给出口 |
| `/ai/chat` | **AI 购物顾问** | 金牌导购对话，推荐商品以**可加购卡片**返回，支持一键全部加购；全站任意页面可从**AI 客服悬浮球**唤起迷你对话 |
| `/product/:id` | 商品详情 | SKU 规格、**ECharts 价格走势（多币种跟随）**、🧾 预估到手价、👥 拼团入口、🎁 积分抵扣、🗣️ AI 口碑档案、面包屑、服务承诺行、主图放大镜 |
| `/group-buy` | **拼团专区** | 活动卡片网格 + 我的拼团（dayjs 倒计时，超 24h 显示「N天」） |
| `/group-buy/record/:id` | **团详情** | 分享落地页：成员坑位、**二维码邀请弹窗**、还差 N 人、倒计时、复制链接 |
| `/points` | **积分中心** | 签到、等级/成长值进度、兑换商城、积分流水 |
| `/cart` | 购物车 | **收货地址选择/快捷新增**、🚚 凑单免运费进度条、积分抵扣试算 |
| `/orders` `/order/pay/:id` | 订单 / 收银台 | 多渠道支付、运费税费明细、锁汇快照、**收货地址卡** |
| `/live` `/live/:id` | 直播大厅 / 观看 | 弹幕互动、限时秒杀卡片（可手动关闭） |
| `/coupons` `/favorites` `/refunds` `/notifications` `/profile` | 个人中心相关 | 空状态均带行动出口 |

### 商家端（`/merchant/*`）
数据看板（**ECharts 客户分层环形图 + 商品转化条形图**）、商品管理/发布（AI 生成 + 跨境原币定价）、订单发货、退款审核、优惠券管理、**拼团活动管理**、直播创建/控制台。

### 全局能力
- 🤖 **AI 客服悬浮球**：全站可拖拽唤起迷你对话，AI 推荐商品直接加购；回复经轻量 Markdown 渲染（转义防注入）
- 🌐 **四语言切换**（vue-i18n）+ 💱 **七币种参考价**（`stores/locale.js` 统一 `formatPrice` 口径，图表坐标轴同步换算）
- 🎨 **设计令牌**：`src/styles/tokens.css` 单文件全站换肤（主色/价格红/圆角/阴影已映射 Element Plus 变量）
- 🔔 JWT 登录态、WebSocket 实时通知、路由级页面标题、回到顶部
- ✅ 闭环原则：弹层必可关、空状态必有行动出口、操作后必有下一步

## 🔧 快速开始

```bash
npm install
npm run dev        # http://localhost:5173 （代理 → http://localhost:8080）
npm run build      # 生产构建 → dist/
```

> 后端仓库与接口文档：**[tttttynb/global-shop](https://github.com/tttttynb/global-shop)**

## 📁 目录结构

```
src/
├── api/          # 接口模块（groupBuy / points / ai / cart / order / tax / forex ...）
├── components/   # AppHeader、ProductCard、PriceTrendChart、EChartBase、
│                 # AiAssistantDock（AI 悬浮球）、FlashSaleCard、LiveDanmu ...
├── composables/  # useCountdown（dayjs 倒计时）
├── i18n/locales/ # zh / en / ja / ko 语言包
├── layouts/      # DefaultLayout / MerchantLayout
├── router/       # 路由 + 登录守卫 + nprogress
├── stores/       # Pinia（user / cart / locale）
├── styles/       # tokens.css 设计令牌 + base.css 全局基础
├── utils/        # echarts.js（按需注册）、richText.js（AI 回复安全渲染）
└── views/        # 页面（ai / groupbuy / user / product / cart / order / merchant / live ...）
```

## 📝 最近更新（2026-10）

- **AI 客服悬浮球**：全站可拖拽唤起迷你对话面板，商品卡直接加购，未登录给登录出口
- **AI 导购修复**：重构层级提示词与工具描述——修复人民币被表述成美元、买家报预算后被拒答的问题；商品卡与"一键加购"恢复可用
- **AI 回富文本**：加粗/列表/分隔线正常渲染（先转义防注入），修复全屏页换行丢失
- **列表页**：排序 Tab、价格区间筛选、已售标签（配合后端新参数）
- **详情页**：面包屑、服务承诺行、主图放大镜
- **购物车/收银台**：收货地址选择与快捷新增（订单快照落库）、凑单免运费进度条
- **首页**：类目金刚区、拼团楼层、Banner 区重构、楼层跳色
- **看板/走势图**：ECharts 全站接入（详情页价格曲线、商家看板两图）
- **搜索框**：热搜榜 + 搜索历史下拉
- **商品图**：55 张真实商品图本地化（离线可用）
- **闭环治理**：秒杀卡可关闭、空状态全带行动出口、分享二维码

## 📄 License

MIT License — **Made with ❤️ by Qing Ling (tttttynb)**
