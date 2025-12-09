# Supabase Storage 图片上传配置

## 📦 步骤 1: 创建 Storage Bucket

1. 打开 Supabase Dashboard
2. 进入 **Storage** 菜单
3. 点击 **New Bucket**
4. 配置如下：

```
Bucket Name: post-images
Public bucket: ✅ 勾选（允许公开访问）
File size limit: 5 MB（可选，建议设置）
Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
```

5. 点击 **Create bucket**

---

## 🔐 步骤 2: 配置 RLS 策略（Row Level Security）

### 2.1 允许所有人查看图片（公开读取）

```sql
-- 允许公开读取图片
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-images' );
```

### 2.2 只允许认证用户上传图片

```sql
-- 允许认证用户上传图片
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'post-images' );
```

### 2.3 只允许用户删除自己上传的图片

```sql
-- 允许用户删除自己上传的图片
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND auth.uid() = owner
);
```

---

## 📁 步骤 3: 在 Supabase Dashboard 中配置策略

如果不想手动执行 SQL，可以在 Dashboard 中配置：

1. 进入 **Storage** → **Policies**
2. 选择 `post-images` bucket
3. 点击 **New Policy**
4. 添加以上三个策略

**快捷方式**：可以使用 Dashboard 的模板：
- **Public Access**: 选择 "Allow public read access" 模板
- **Upload**: 选择 "Allow authenticated uploads" 模板
- **Delete**: 选择 "Allow users to delete own files" 模板

---

## 🎯 步骤 4: 测试配置

在 Supabase SQL Editor 中运行：

```sql
-- 检查 bucket 是否创建成功
SELECT * FROM storage.buckets WHERE name = 'post-images';

-- 检查策略是否配置正确
SELECT * FROM storage.policies WHERE bucket_id = 'post-images';
```

---

## 🔧 步骤 5: 获取图片 URL 格式

上传后的图片 URL 格式：

```
https://{project-ref}.supabase.co/storage/v1/object/public/post-images/{file-path}
```

示例：
```
https://abcdefgh.supabase.co/storage/v1/object/public/post-images/2024/12/my-image.jpg
```

---

## 📝 使用示例

### 上传图片

```typescript
import { supabaseClient as supabase } from './lib/supabase';

async function uploadImage(file: File) {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('post-images')
    .upload(filePath, file);

  if (error) {
    console.error('上传失败:', error);
    return null;
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### 删除图片

```typescript
async function deleteImage(filePath: string) {
  const { error } = await supabase.storage
    .from('post-images')
    .remove([filePath]);

  if (error) {
    console.error('删除失败:', error);
    return false;
  }

  return true;
}
```

---

## ⚙️ 高级配置（可选）

### 限制文件大小

在 Supabase Dashboard → Storage → Settings：

```
Max file size: 5 MB
```

### 配置 CORS（如果需要从其他域名访问）

在 Supabase Dashboard → Settings → API：

```json
{
  "allowedOrigins": ["https://yourdomain.com"],
  "allowedHeaders": ["authorization", "content-type"]
}
```

---

## 🐛 常见问题

### 1. 上传失败：`new row violates row-level security policy`

**原因**：RLS 策略未正确配置

**解决**：检查并重新创建策略，确保 `authenticated` 用户有 `INSERT` 权限

### 2. 图片无法访问：`The resource you are looking for could not be found`

**原因**：Bucket 未设置为 Public

**解决**：
1. Storage → Buckets
2. 点击 `post-images`
3. 勾选 **Public bucket**

### 3. 删除图片失败

**原因**：用户没有删除权限或文件路径错误

**解决**：
- 检查文件路径是否正确
- 确保用户是文件的所有者
- 检查 DELETE 策略

---

## 📊 文件组织结构建议

```
post-images/
├── 2024/
│   ├── 12/
│   │   ├── 1733123456-image1.jpg
│   │   ├── 1733123457-image2.png
│   │   └── ...
│   ├── 11/
│   └── ...
├── 2025/
└── ...
```

按年份/月份组织，便于管理和清理旧文件。

---

## ✅ 完成检查清单

- [ ] 创建 `post-images` bucket
- [ ] 设置 bucket 为 Public
- [ ] 配置 SELECT 策略（公开读取）
- [ ] 配置 INSERT 策略（认证用户上传）
- [ ] 配置 DELETE 策略（用户删除自己的文件）
- [ ] 测试上传功能
- [ ] 测试图片访问
- [ ] 测试删除功能

---

**配置完成后，请返回应用继续使用图片上传功能！**
