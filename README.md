# 🌍 Global Shop Web — 前端

> **[Global Shop](https://github.com/tttttynb/global-shop)** 跨境电商平台前端：Vue 3 + Element Plus，四语言国际化 + 七币种参考价切换。

## 🚀 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3（`<script setup>`）+ Vite |
| UI | Element Plus |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 国际化 | vue-i18n（中 / 英 / 日 / 韩） |
| HTTP | Axios（自动注入 JWT + `Accept-Language`） |
| 直播播放 | flv.js / hls.js |

## ✨ 页面一览

### 买家端
| 路由 | 页面 | 亮点 |
|------|------|------|
| `/` | 首页 | 推荐流、分类入口 |
| `/products` `/search` | 商品列表 / 搜索 | 多币种参考价 |
| `/ai/search` | AI 语义搜索 | 以图搜图（拍照找同款） |
| `/ai/chat` | **AI 购物顾问** | 金牌导购对话，推荐商品以**可加购卡片**返回，支持一键全部加购 |
| `/product/:id` | 商品详情 | SKU 规格、价格走势图、🧾 预估到手价（运费+跨境税）、👥 拼团入口、🎁 积分抵扣、🗣️ AI 口碑档案（买家印象标签墙） |
| `/group-buy` | **拼团专区** | 活动卡片网格 + 我的拼团（倒计时/状态） |
| `/group-buy/record/:id` | **团详情** | 分享落地页：成员坑位、团长徽标、还差 N 人、倒计时、复制链接邀请 |
| `/points` | **积分中心** | 签到、等级/成长值进度、兑换商城、积分流水 |
| `/cart` | 购物车 | 积分抵扣勾选 + 实时试算 |
| `/orders` `/order/pay/:id` | 订单 / 收银台 | 多渠道支付、运费税费明细、锁汇快照 |
| `/live` `/live/:id` | 直播大厅 / 观看 | 弹幕互动、限时秒杀卡片 |
| `/coupons` `/favorites` `/refunds` `/notifications` `/profile` | 个人中心相关 | — |

### 商家端（`/merchant/*`）
数据看板、商品管理/发布（AI 生成 + 跨境原币定价）、订单发货、退款审核、优惠券管理、**拼团活动管理**、直播创建/控制台。

### 全局能力
- 🌐 **四语言切换**（vue-i18n，232 键全语言对齐）+ 💱 **七币种参考价**（CNY/USD/EUR/GBP/JPY/KRW/THB，`stores/locale.js` 统一 `formatPrice` 口径）
- JWT 登录态、WebSocket 实时通知、消息通知中心（拼团/积分/订单通知点击直达）

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
├── components/   # AppHeader（语言/币种切换）、ProductCard、FlashSaleCard、LiveDanmu
├── i18n/locales/ # zh / en / ja / ko 语言包
├── layouts/      # DefaultLayout / MerchantLayout
├── router/       # 路由 + 登录守卫
├── stores/       # Pinia（user / cart / locale）
└── views/        # 页面（ai / groupbuy / user / product / cart / order / merchant / live ...）
```

## 📄 License

MIT License — **Made with ❤️ by Qing Ling (tttttynb)**
