/**
 * AI 回复的轻量富文本渲染（零依赖）
 *
 * 模型输出常带 `**加粗**`、`- 列表`、`1. 列表`、`---` 分隔线，
 * 直接当纯文本插值会露出一身星号。这里做最小集渲染：
 * 先整体转义 HTML（模型输出按不可信内容处理，防注入），再还原受支持的排版标记。
 *
 * 支持：**bold** / 无序列表(- *) / 有序列表(1.) / 分隔线(---) / 空行分段 / 段内换行
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ESCAPES[c])
}

/** 行内标记：转义之后再处理，转义不会产生新的 `*`，故安全 */
function renderInline(escaped) {
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

export function renderRichText(raw) {
  const text = String(raw ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (!text.trim()) return ''

  const blocks = []
  let paragraph = []
  let list = null

  const flushList = () => {
    if (!list) return
    blocks.push(`<${list.tag}>${list.items.map((i) => `<li>${i}</li>`).join('')}</${list.tag}>`)
    list = null
  }
  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(`<p>${paragraph.join('<br>')}</p>`)
    paragraph = []
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    // 独占一行的分隔线
    if (/^-{3,}$/.test(line)) {
      flushParagraph()
      flushList()
      blocks.push('<hr>')
      continue
    }

    const bullet = line.match(/^[-*]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    if (bullet || numbered) {
      flushParagraph()
      const tag = bullet ? 'ul' : 'ol'
      if (!list || list.tag !== tag) {
        flushList()
        list = { tag, items: [] }
      }
      list.items.push(renderInline(escapeHtml(bullet ? bullet[1] : numbered[1])))
      continue
    }

    flushList()
    paragraph.push(renderInline(escapeHtml(line)))
  }

  flushParagraph()
  flushList()
  return blocks.join('')
}
