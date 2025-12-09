# 图片上传功能文档

## 🎉 功能概述

为 DryBlog 添加了完整的图片上传和优化功能，包括：

- ✅ **图片上传** - 上传到 Supabase Storage
- ✅ **拖拽上传** - 支持拖拽图片到上传区域
- ✅ **粘贴上传** - 直接 Ctrl+V 粘贴图片
- ✅ **懒加载** - 图片延迟加载，提升性能
- ✅ **点击放大** - 点击图片查看大图
- ✅ **灯箱效果** - 优雅的图片查看体验

---

## 📁 新增文件

### 1. [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md)
Supabase Storage 配置指南，包含完整的设置步骤

### 2. [components/ImageUpload.tsx](components/ImageUpload.tsx)
图片上传组件

**功能特性**：
- 文件格式验证（JPG、PNG、GIF、WebP）
- 文件大小限制（5MB）
- 拖拽上传支持
- 上传进度显示
- 错误处理

**使用示例**：
```tsx
<ImageUpload onImageUploaded={(url, fileName) => {
  console.log('上传成功:', url);
}} />
```

### 3. [components/LazyImage.tsx](components/LazyImage.tsx)
懒加载图片组件（可选，当前未使用）

---

## 🔧 修改的文件

### 1. [components/MarkdownEditor.tsx](components/MarkdownEditor.tsx)

**新增功能**：
- 图片上传按钮和面板
- 粘贴图片自动上传（Ctrl+V）
- 自动插入 Markdown 图片语法
- 实时预览上传的图片

**关键代码**：
```typescript
// 处理粘贴上传
async function handlePaste(e: React.ClipboardEvent) {
  const items = e.clipboardData?.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') === 0) {
      const file = item.getAsFile();
      // 上传到 Supabase Storage
      const { data } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      // 插入 Markdown
      insertImage(publicUrl, 'alt-text');
    }
  }
}
```

**UI 变化**：
- 添加了"上传图片"按钮
- 可展开/收起的上传面板
- 提示文本指导用户使用

### 2. [components/EnhancedMarkdown.tsx](components/EnhancedMarkdown.tsx:66-134)

**新增功能**：
- 图片懒加载（`loading="lazy"`）
- 点击图片放大查看
- 灯箱效果（全屏查看）
- ESC 键关闭灯箱

**关键代码**：
```typescript
useEffect(() => {
  const images = document.querySelectorAll('.prose img');
  images.forEach((img) => {
    // 添加懒加载
    img.loading = 'lazy';
    img.style.cursor = 'pointer';

    // 点击放大
    img.addEventListener('click', () => {
      // 创建灯箱...
    });
  });
}, [html]);
```

**优化效果**：
- 图片只在进入视口时加载
- 点击图片弹出全屏查看
- 优雅的过渡动画
- 减少初始加载时间

---

## 🚀 使用方法

### 方式 1：点击上传按钮

1. 打开写文章页面
2. 点击「上传图片」按钮
3. 选择图片文件或拖拽图片
4. 等待上传完成
5. 图片 Markdown 自动插入编辑器

### 方式 2：拖拽上传

1. 打开写文章页面
2. 点击「上传图片」按钮展开上传面板
3. 拖拽图片文件到上传区域
4. 自动上传并插入

### 方式 3：粘贴上传 ⭐ 最快

1. 复制图片（截图、复制图片文件等）
2. 在 Markdown 编辑器中按 `Ctrl+V`
3. 自动上传并插入

### 方式 4：手动输入 Markdown

```markdown
![图片描述](https://your-project.supabase.co/storage/v1/object/public/post-images/2024/12/image.jpg)
```

---

## 📊 文件存储结构

上传的图片按年份/月份组织：

```
post-images/
├── 2024/
│   ├── 12/
│   │   ├── 1733123456789-screenshot.png
│   │   ├── paste-1733123457890.png
│   │   └── ...
│   ├── 11/
│   └── ...
├── 2025/
│   ├── 01/
│   └── ...
└── ...
```

**命名规则**：
- 点击上传：`{timestamp}-{original-filename}`
- 粘贴上传：`paste-{timestamp}.{extension}`

---

## 🎨 UI/UX 特性

### 图片上传面板

**状态指示**：
- 🔵 待机状态：灰色虚线边框
- 🟢 拖拽中：品牌色边框 + 高亮背景
- 🔄 上传中：加载动画 + "上传中..."
- ✅ 成功：自动插入 Markdown
- ❌ 失败：错误提示 + 可关闭

**视觉效果**：
- 圆角、阴影、过渡动画
- 拖拽时高亮反馈
- 清晰的图标和文字提示

### 文章阅读体验

**图片交互**：
- 鼠标悬停：微放大效果（scale: 1.05）
- 光标样式：`pointer` 提示可点击
- 圆角：`rounded-lg` 统一风格

**灯箱效果**：
- 黑色半透明背景（90% 透明度）
- 背景模糊（backdrop-blur）
- 图片居中显示
- 最大尺寸：90vh
- 底部显示图片 alt 文本
- 右上角关闭按钮（✕）

**关闭方式**：
- 点击背景
- 点击关闭按钮
- 按 ESC 键

---

## ⚙️ 配置说明

### Supabase Storage 配置

1. **创建 Bucket**
   - 名称: `post-images`
   - 类型: Public（公开访问）

2. **设置 RLS 策略**
   - 公开读取：所有人可以查看
   - 认证上传：只有登录用户可以上传
   - 删除权限：用户只能删除自己的文件

3. **可选配置**
   - 文件大小限制：5MB
   - 允许的 MIME 类型：image/jpeg, image/png, image/gif, image/webp

**详细步骤**: 查看 [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md)

---

## 🔒 安全特性

### 文件验证

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '不支持的文件格式';
  }
  if (file.size > MAX_SIZE) {
    return '文件太大';
  }
  return null;
}
```

### Supabase RLS 策略

- ✅ 公开读取：任何人可以查看图片
- ✅ 认证上传：只有登录用户可以上传
- ✅ 所有者删除：用户只能删除自己的文件
- ✅ 文件大小限制：5MB
- ✅ 类型白名单：只允许图片格式

---

## 🚀 性能优化

### 1. 懒加载（Lazy Loading）

```typescript
<img loading="lazy" ... />
```

**优点**：
- 只加载视口内的图片
- 减少初始页面加载时间
- 节省带宽

### 2. 提前加载（Preload）

```typescript
rootMargin: '50px' // 提前 50px 开始加载
```

**效果**：
- 用户滚动到图片前就开始加载
- 无感知的加载体验

### 3. CDN 缓存

```typescript
cacheControl: '3600' // 1小时缓存
```

**优点**：
- Supabase Storage 自动 CDN 分发
- 图片缓存 1 小时
- 减少重复请求

### 4. 图片压缩建议

在上传前可以添加客户端压缩（可选）：

```typescript
// 使用 browser-image-compression 库
import imageCompression from 'browser-image-compression';

const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};

const compressedFile = await imageCompression(file, options);
```

---

## 📈 后续优化建议

### 1. 图片压缩
- 上传前自动压缩图片
- 减小文件大小
- 保持视觉质量

### 2. 多图上传
- 支持一次选择多张图片
- 批量上传进度显示
- 图片管理界面

### 3. 图片编辑
- 裁剪、旋转
- 滤镜效果
- 添加水印

### 4. 图片管理
- 查看所有上传的图片
- 删除不用的图片
- 图片使用统计

### 5. CDN 优化
- 使用自定义域名
- 图片格式转换（WebP）
- 响应式图片（srcset）

### 6. 图片库
- 创建可复用的图片库
- 在文章间共享图片
- 图片标签和分类

---

## 🐛 常见问题

### Q1: 上传失败提示 "row violates RLS policy"

**原因**: Supabase Storage RLS 策略未配置

**解决**:
1. 检查 bucket 是否创建
2. 检查 RLS 策略是否正确
3. 确认用户已登录

### Q2: 图片无法显示

**原因**: Bucket 未设置为 Public

**解决**:
1. Storage → post-images → Settings
2. 勾选 "Public bucket"

### Q3: 粘贴上传没反应

**原因**:
- 剪贴板中不是图片
- 浏览器不支持
- 权限未授予

**解决**:
- 确保复制的是图片（截图、复制图片文件）
- 使用现代浏览器（Chrome, Firefox, Edge）
- 允许浏览器访问剪贴板

### Q4: 图片加载很慢

**原因**:
- 文件太大
- 网络连接慢
- CDN未生效

**解决**:
- 压缩图片后上传
- 使用 WebP 格式
- 检查 Supabase CDN 配置

---

## 💡 使用技巧

### 1. 快速插入图片

最快的方式是粘贴上传：
1. 截图（Win+Shift+S 或 Cmd+Shift+4）
2. 在编辑器中 Ctrl+V
3. 自动上传并插入

### 2. 图片命名

上传前重命名文件为有意义的名称，例如：
- `architecture-diagram.png`
- `user-flow-chart.jpg`
- `screenshot-error.png`

这样生成的 URL 更易读。

### 3. Alt 文本

为图片添加有意义的 alt 文本：
```markdown
![系统架构图](url)  ✅ 好
![图片](url)         ❌ 差
```

好处：
- 提升 SEO
- 辅助功能（屏幕阅读器）
- 图片加载失败时显示

### 4. 图片尺寸

建议上传尺寸：
- 宽度: 1200-1920px
- 文件大小: < 500KB
- 格式: WebP > PNG > JPG

---

## 📚 相关文档

- [Supabase Storage 配置指南](SUPABASE_STORAGE_SETUP.md)
- [Supabase Storage 官方文档](https://supabase.com/docs/guides/storage)
- [Markdown 图片语法](https://www.markdownguide.org/basic-syntax/#images-1)

---

## ✅ 功能检查清单

使用前确保完成：

- [ ] Supabase Storage Bucket 已创建
- [ ] RLS 策略已配置
- [ ] Bucket 设置为 Public
- [ ] 测试上传功能正常
- [ ] 测试粘贴上传
- [ ] 测试图片显示
- [ ] 测试图片点击放大
- [ ] 测试懒加载

---

**版本**: v1.0.0
**更新时间**: 2025-12-09
**作者**: Claude Code
