<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <!-- 服务承诺（Shopify 式信任层） -->
      <div class="footer-trust">
        <div class="trust-item"><span class="trust-icon">🛡️</span><div><b>正品保障</b><p>全球品牌官方授权</p></div></div>
        <div class="trust-item"><span class="trust-icon">✈️</span><div><b>跨境直邮</b><p>海外仓一手货源</p></div></div>
        <div class="trust-item"><span class="trust-icon">↩️</span><div><b>7天无理由</b><p>售后无忧退换</p></div></div>
        <div class="trust-item"><span class="trust-icon">💬</span><div><b>AI 导购</b><p>24h 智能客服</p></div></div>
      </div>

      <div class="footer-divider"></div>

      <!-- 支付方式 -->
      <div class="footer-pay">
        <span class="pay-label">支持支付：</span>
        <span class="pay-badge">支付宝</span>
        <span class="pay-badge">微信支付</span>
        <span class="pay-badge">Visa</span>
        <span class="pay-badge">Mastercard</span>
        <span class="pay-badge">Stripe</span>
      </div>

      <p class="footer-copy">GlobalShop 全球电商平台 &copy; 2026</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--gs-bg-card);
  border-top: 1px solid var(--gs-border);
  padding: 32px 20px 24px;
}
.footer-inner {
  max-width: var(--gs-container);
  margin: 0 auto;
}
/* 服务承诺四联 */
.footer-trust {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 150px;
}
.trust-icon { font-size: 26px; }
.trust-item b {
  display: block;
  font-size: 14px;
  color: var(--gs-text-1);
  margin-bottom: 2px;
}
.trust-item p {
  font-size: 12px;
  color: var(--gs-text-3);
  margin: 0;
}
.footer-divider {
  height: 1px;
  background: var(--gs-divider);
  margin: 20px 0 16px;
}
/* 支付徽章 */
.footer-pay {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}
.pay-label { color: var(--gs-text-3); }
.pay-badge {
  padding: 2px 10px;
  border: 1px solid var(--gs-border);
  border-radius: 4px;
  color: var(--gs-text-2);
  background: var(--gs-bg-card);
}
.footer-copy {
  text-align: center;
  color: var(--gs-text-3);
  font-size: 13px;
  margin: 16px 0 0;
}
</style>
