---
name: deepseek-vision-qa
description: |
  Use OpenCLI to drive DeepSeek's native vision model (识图模式) in Chrome for image-based QA.
  DeepSeek has built-in multimodal support — no third-party vision service needed.
  Triggers: "DeepSeek 识图", "DeepSeek vision", "用 DeepSeek 看图", "DeepSeek 视觉模式",
  "deepseek识别图片", "deepseek vision QA", "让 DeepSeek 看看这张图".
  This is the DEFAULT choice when the user needs image QA — DeepSeek has native vision support, no third-party service required.
  Two modes: Quick Describe (user just wants to know what the image is — upload directly) vs QA (user wants inspection — ask 3 questions before writing prompt).
allowed-tools: Bash(opencli:*), Read, Write, Bash(python3:*)
---

# deepseek-vision-qa

用 OpenCLI 驱动 DeepSeek 原生识图模式做视觉 QA。DeepSeek 自带多模态，无需借助第三方服务。

**全程在同一个 `opencli browser <session>` 里完成。**

## Prerequisites

```bash
opencli doctor              # 必须全绿
opencli deepseek status     # 必须 Connected + Login: Yes
```

如果没登录：在 Chrome 打开 `https://chat.deepseek.com/` 登录。

## Core Workflow (3 rounds of tool calls)

所有命令使用统一 session 名 `deepseek-qa`。**关键原则：用 `&& sleep 0.2 &&` 把独立步骤串成链，减少 shell 启动次数。**

### Step 1: Confirm the image

确认图片路径。如需生成测试图：

```bash
python3 -c "
from PIL import Image, ImageDraw
img = Image.new('RGB', (800, 600), '#1a1a2e')
draw = ImageDraw.Draw(img)
draw.rectangle([50, 50, 350, 250], fill='#e94560', outline='white', width=3)
draw.text((100, 300), 'Test content', fill='white')
img.save('/tmp/test-image.png')
"
```

### Step 2: Ask the user about the image (MANDATORY)

**先判断用户意图，选择对应模式：**

#### Quick Describe 模式 — 用户只想"知道这张图是什么"

用户说"这张图是什么""帮我看看这张图""描述一下这张图片"时，**直接跳过三问题**，上传后发简单 prompt：

```
请描述这张图片的内容，告诉我这是什么类型的图片，里面有什么关键信息。
```

#### QA 模式 — 用户要检查/审查图片

用户有明确的检查意图（"检查这个 PPT""看看 UI 有没有问题"）时，**必须先问三个问题再写 prompt：**

1. **这是什么类型的图？** — PPT 幻灯片 / UI 截图 / 海报 / 图表 / 照片 / ...
2. **这张图的预期内容是什么？** — 应该有哪些元素、文字、布局
3. **你想重点检查什么？** — 或者让 AI 根据图片类型建议检查项

如果用户说"不知道""你看着办"，则根据图片类型推断检查项：

| 图片类型 | 默认检查项 |
|---------|-----------|
| PPT 幻灯片 | 文字溢出/截断、元素重叠、间距均匀、对比度、对齐、占位符残留 |
| UI 截图 | 布局错位、文字截断、按钮可点击区域、颜色一致性、响应式问题 |
| 海报/宣传图 | 视觉层次、文字可读性、品牌色一致、关键信息是否突出、留白 |
| 数据图表 | 坐标轴标签、图例完整、数据标签位置、颜色区分度、标题准确 |
| 照片/一般图片 | 构图、清晰度、曝光、主体是否突出 |

**QA 模式下禁止跳过三问题直接写 prompt。**

### Step 3: Setup — 新对话 + 刷新 + 绑定 + 切识图（1 次 shell）

**必须刷新页面**（清除 markerAttr），然后切到识图模式。用 `&& sleep` 链在一起：

```bash
opencli deepseek new && sleep 0.2 && opencli browser deepseek-qa bind && sleep 0.2 && opencli browser deepseek-qa eval "location.reload()" && sleep 3 && opencli browser deepseek-qa bind && sleep 0.2 && opencli browser deepseek-qa eval "document.querySelectorAll('[role=radio]')[2]?.click()"
```

> **为什么用 eval 切换模式？** OpenCLI v1.0.15 有 markerAttr bug：`state`/`find`/`click`/`upload` 都会在页面注入 `markerAttr` 变量，但只有第一个能成功声明。`eval` 不走 DOM marker 逻辑，所以用 eval 切换，让后面的 `upload` 成为首个 DOM-marker 命令。

如果 bind 后落在 about:blank，追加导航：

```bash
opencli browser deepseek-qa eval "window.location.href = 'https://chat.deepseek.com/'" && sleep 3
```

### Step 4: Upload + prompt + send（1 次 shell）

**`upload` 必须是刷新后首个 DOM-marker 命令。** upload → Escape → type → click 全部链在一起：

```bash
opencli browser deepseek-qa upload 'input[type=file]' /path/to/image.png && sleep 0.2 && opencli browser deepseek-qa keys Escape && sleep 0.2 && opencli browser deepseek-qa type 'textarea[placeholder*="给 DeepSeek 发送消息"]' "<your-prompt>" && sleep 5 && opencli browser deepseek-qa click 'input[type=file] ~ div > div[role=button]'
```

接受图片格式：png, jpg, jpeg, svg, bmp, gif, webp, avif, tiff 等。

> **可选：开启深度思考** — 在 click 发送前插入：
> ```bash
> && sleep 0.2 && opencli browser deepseek-qa eval "[...document.querySelectorAll('div[role=button]')].find(b => b.textContent.includes('深度思考'))?.click()"
> ```

稳定选择器速查：

| 元素 | 选择器 |
|------|--------|
| Textarea | `textarea[placeholder*="给 DeepSeek 发送消息"]` |
| File input | `input[type=file]` |
| Send button | `input[type=file] ~ div > div[role=button]` |
| 深度思考 | `div[role=button]:has(> span)` 中文本含"深度思考"的那个（用 eval 定位）|

### Step 5: Wait + read（1 次 shell）

```bash
sleep 10 && opencli browser deepseek-qa state 2>&1 | tail -150
```

等待时间视情况调整：简单图片 8-10s，复杂图片 + 深度思考 20-25s。

## Prompt Writing Guide

**不要发泛泛的 prompt**。

### Bad
```
解释图片
看看这图
```

### Good
```
这是一张PPT幻灯片。预期内容：大字标题"君子善假于物"，下方三行小字。
请检查：
1. 文字是否有溢出或截断
2. 元素是否相互重叠
3. 间距是否均匀
4. 对比度是否足够
5. 是否有残留的占位符
6. 对齐是否一致

逐一回答，有问题标❌，没问题标✅。
```

### Template

```
这是一张[图片类型]。
预期内容：[简单描述]。
请检查：
1. [检查项1]
2. [检查项2]
...

逐一回答，有问题具体说明位置和原因。
```

## Pro Tips

- **合链优先**：能 `&& sleep 0.2 &&` 串起来的就不要开新 shell。目标：prerequisites 并行 2 个 + 3 轮操作 = 最多 5 次工具调用。
- **Step 2 区分场景**：用户只想知道"图是什么"→ Quick Describe 模式直接上传；用户要检查图片 → QA 模式问三问题。
- **全程用同一个 session**：bind → eval → upload → type → click → read 全在 `deepseek-qa` session 里。
- **所有操作均用 CSS 选择器**：`type`、`click`、`upload` 均支持 CSS 选择器，**无需 `state` + `grep` 拿 ref 编号**。
- **markerAttr 避坑**：刷新后，用 `eval` 切换模式，`upload` 作为首个 DOM 命令。
- **upload 用 CSS selector**：`'input[type=file]'`。
- **upload 后先关搜索框**：`keys Escape`，否则可能干扰后续操作。
- **发送按钮选择器**：`input[type=file] ~ div > div[role=button]` — 即 file input 相邻兄弟 div 中的 role=button。
- **DeepThink 可选**：复杂图像分析建议开启深度思考，简单检查不用。
- **`read` 不可靠时有 fallback**：`read -f plain` 返回空时，直接用 `state | tail -150` 抓 DOM 中的回复内容。

## Troubleshooting

| symptom | fix |
|---------|-----|
| `opencli doctor` 红灯 | `opencli daemon restart && opencli doctor` |
| `deepseek status` 未登录 | 打开 `chat.deepseek.com` 登录 |
| **`SyntaxError: Identifier 'markerAttr' has already been declared`** | OpenCLI 的 markerAttr bug。刷新页面 → bind → 用 `eval` 做模式切換 → `upload` 作为首个 DOM 命令。绝不能在 upload 前调 `state`/`find`/`click` |
| 上传后弹出"搜索对话内容" | `opencli browser deepseek-qa keys Escape` 关掉 |
| 发送按钮灰色点不了 | 需要同时满足：图片已上传 + textarea 有文字 |
| 回复没识别图片（给了"AA AB AC"这种文字提取） | 没切到识图模式！刷新页面，用 `eval` 点击第3个 `[role=radio]`，再上传 |
| 回复太泛 | prompt 太模糊，加图片类型 + 预期内容 + 检查清单 |
| **`read -f plain` 返回 "No visible messages found"** | `read` 命令有时不可靠。用 `opencli browser deepseek-qa state 2>&1 \| tail -100` 直接从 DOM 抓回复内容 |
| **bind 后 URL 是 about:blank** | `opencli deepseek new` 后 bind 可能落在空白页。用 `eval "window.location.href = 'https://chat.deepseek.com/'"` 手动导航 |

## Full Example Script

**总共 5 次工具调用**（含 1 次并行），从图片路径到拿到回复。

```bash
# 0. 环境检查（并行 — 2 次 shell 同时发）
opencli doctor
opencli deepseek status

# 1. 新对话 + 绑定 + 刷新 + 切识图（1 次 shell，全链）
opencli deepseek new && sleep 0.2 && opencli browser deepseek-qa bind && sleep 0.2 && opencli browser deepseek-qa eval "location.reload()" && sleep 3 && opencli browser deepseek-qa bind && sleep 0.2 && opencli browser deepseek-qa eval "document.querySelectorAll('[role=radio]')[2]?.click()"

# 2. 上传 + 关搜索框 + 输入 + 发送（1 次 shell，全链）
opencli browser deepseek-qa upload 'input[type=file]' /path/to/image.png && sleep 0.2 && opencli browser deepseek-qa keys Escape && sleep 0.2 && opencli browser deepseek-qa type 'textarea[placeholder*="给 DeepSeek 发送消息"]' "这是一张[图片类型]。预期内容：[...]。请检查：1. ... 2. ... 逐一回答。" && sleep 0.2 && opencli browser deepseek-qa click 'input[type=file] ~ div > div[role=button]'

# 3. 等待 + 读取（1 次 shell）
sleep 10 && opencli browser deepseek-qa state 2>&1 | tail -150
```
