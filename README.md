# DryBlog - 现代化技术博客系统

使用 **Next.js 14 + Supabase + Tailwind CSS** 搭建的功能完善的中文技术博客系统。

## ✨ 核心功能

### 基础功能
- ✅ 文章发布与管理（支持草稿/发布状态）
- ✅ Markdown 编辑器（实时预览）
- ✅ 分类系统（多对多关系）
- ✅ 用户认证（Supabase Auth）
- ✅ 管理员后台
- ✅ 深色/浅色主题切换
- ✅ 实时数据同步

### 🆕 新增功能 (v1.1.0)
- ✅ **标签系统** - 支持多标签，颜色自定义
- ✅ **全局搜索** - 快捷键 Ctrl+K，实时搜索文章和标签
- ✅ **草稿自动保存** - 5秒自动保存，防止数据丢失
- ✅ **虚拟滚动** - 大数据量优化（>50篇文章）
- ✅ **骨架屏** - 优雅的加载状态
- ✅ **代码高亮优化** - 支持 Solidity 等多种语言，深浅主题
- ✅ **UI/UX 优化** - 动画、过渡效果、滚动条美化

> 📖 详细功能文档请查看 [FEATURES.md](./FEATURES.md)

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量文件

```bash
cp .env.example .env.local
```

3. 在 Supabase 中创建表与触发器（示例）

## 管理员标记与后台

当前方案：直接在 `public.users` 表增加布尔列 `is_admin` 来表示管理员，无需额外 `user_roles` 表。

### 添加列

```sql
alter table public.users add column if not exists is_admin boolean not null default false;
```

### 初始化第一个管理员

```sql
update public.users set is_admin = true where email = '<你的邮箱>';
```

### RLS 策略示例（可选）

```sql
alter table public.users enable row level security;
create policy "users read" on public.users for select using (true);
create policy "users update own" on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
-- 允许管理员更新任何记录（包括设置 is_admin）
create policy "users admin update" on public.users for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin));
```

### 前端判断示例

```ts
const { data } = await supabase
  .from("users")
  .select("is_admin")
  .eq("id", session.user.id)
  .maybeSingle();
const isAdmin = !!data?.is_admin;
```

### 后续扩展

- 迁移到多角色：增加 `roles text[]` 或单独 `user_roles` 表。
- 为管理员添加审计日志表，记录关键操作。
- 将 `is_admin` 缓存到 JWT，减少每次查询（Edge Function 签名）。
- 后台增加用户管理、批量封禁等。

### 管理员全局写策略（使用 is_admin）

```sql
create policy "posts admin update" on public.posts for update using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin)
) with check (true);
create policy "posts admin delete" on public.posts for delete using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin)
);
create policy "categories admin upsert" on public.categories for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin)
) with check (true);
create policy "post_categories admin all" on public.post_categories for all using (
  exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin)
) with check (true);
```

管理员策略与作者策略并存，只要任意策略通过即允许操作。

### 草稿与发布状态

新增字段使用：

- `published`：文章是否正式发布（草稿为 `false`）。
- `is_public`：已发布文章是否对所有匿名用户可见；草稿阶段忽略此字段。

插入逻辑示例（新建草稿）：

```ts
supabase.from("posts").insert({
  title,
  content,
  author_id: user.id,
  published: false,
  is_public: false,
});
```

发布后再公开：

```ts
supabase
  .from("posts")
  .update({ published: true, is_public: true })
  .eq("id", postId);
```

查询首页只显示公开发布：

```ts
supabaseServer
  .from("posts")
  .select("*")
  .eq("published", true)
  .eq("is_public", true);
```

---

```sql
create extension if not exists pgcrypto; -- 如果还没启用，以使用 gen_random_uuid()

create table if not exists public.posts (
  id uuid not null default gen_random_uuid(),
  title text not null,
  slug text not null,
  content text not null,
  excerpt text null,
  author_id uuid not null,
  published boolean null default false,
  created_at timestamptz null default now(),
  updated_at timestamptz null default now(),
  is_public boolean null default false,
  constraint posts_pkey primary key (id),
  constraint posts_slug_key unique (slug),
  constraint posts_author_id_fkey foreign key (author_id) references auth.users (id)
);

-- 生成 slug 的函数（简单示例，可按需增强）
create or replace function public.generate_slug() returns trigger as $$
declare
  base text;
  candidate text;
  i int := 1;
begin
  base := regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := trim(both '-' from base);
  candidate := base;
  while exists(select 1 from posts where slug = candidate and id <> new.id) loop
    i := i + 1;
    candidate := base || '-' || i;
  end loop;
  new.slug := coalesce(candidate, gen_random_uuid()::text);
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_slug on posts;
create trigger set_slug before insert or update on posts
for each row execute function public.generate_slug();
```

4. 填写 `.env.local` 中：

```
NEXT_PUBLIC_SUPABASE_URL=你的URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名Key
```

5. 启动开发

```bash
npm run dev
```

访问 http://localhost:3000

## 目录说明

- `app/` Next.js App 路由
- `lib/supabaseClient.ts` 浏览器端 Supabase（含 auth，适用于交互/表单）
- `lib/supabaseServer.ts` 服务端 Supabase（SSR/路由处理安全查询）
- `lib/supabase.ts` Barrel 汇总：仍可用旧 `import { supabase }`（指向 client），并导出 `supabaseServer`
- `types/post.ts` Post 类型
- `types/category.ts` Category 类型
- `app/categories/` 分类列表与详情路由

## 分类（Categories）功能（多对多）

已升级为多对多：文章可属于多个分类，通过中间表 `post_categories` 维护。

### 设计要点

1. `categories` 独立表：`name`,`slug`,`description`（可选描述）。
2. 中间表 `post_categories(post_id, category_id)` 复合主键，支持同一文章多分类。
3. 查询文章时可使用嵌套选择：`select("*, post_categories(categories(id,name,slug))")`。
4. 分类详情页通过查询 `post_categories` 反向获取文章。

### 数据库增量迁移 SQL（如果你之前是单一 category_id 模式）

```sql
-- 1. 分类表（如果还未添加 description 可现在补）
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text null,
  created_at timestamptz default now(),
  constraint categories_name_key unique (name),
  constraint categories_slug_key unique (slug)
);

-- 2. 多对多中间表
create table if not exists public.post_categories (
  post_id uuid not null references public.posts(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  constraint post_categories_pkey primary key (post_id, category_id)
);

-- 3. 可选：如果旧模式里有 posts.category_id 字段且不再需要
-- alter table public.posts drop column if exists category_id;
```

数据迁移（旧 `posts.category_id` -> 新表）：

```sql
insert into public.post_categories (post_id, category_id)
select id, category_id from public.posts
where category_id is not null
on conflict do nothing;
```

### RLS 策略建议

若 `posts` 已有 RLS（作者可写），分类表通常只读：

```sql
alter table public.categories enable row level security;
create policy "categories read" on public.categories for select using (true);

alter table public.post_categories enable row level security;
-- 读取：所有人可读取（或限制为公开文章）
create policy "post_categories read" on public.post_categories for select using (true);
-- 插入：仅允许文章作者给自己的文章挂分类
create policy "post_categories insert own" on public.post_categories for insert with check (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);
-- 删除：仅文章作者可移除分类关联
create policy "post_categories delete own" on public.post_categories for delete using (

  ## UI 主题与暗色模式

  项目支持明 / 暗两种主题：使用 Tailwind `darkMode: 'class'`，并通过 `ThemeProvider` + `ThemeToggle` 控制。

  核心特性：
  - 初始主题：`localStorage` > 系统偏好 `prefers-color-scheme`。
  - 切换：右上角固定按钮（SVG 图标 ☀️/🌙）。
  - 背景：浅色多段淡灰渐变；暗色深蓝灰渐变；卡片用 `.surface` 半透明 + blur。
  - Markdown：`dark:prose-invert` 自动反转深色排版。

  自定义指引：
  1. 修改渐变：`app/globals.css` 中 `body` 的背景类。
  2. 修改卡片：调整 `.surface`（边框、透明度、阴影）。
  3. 新页面统一风格：容器加 `surface p-6 space-y-6`。
  4. 扩展多主题：抽象出 CSS 变量（如 `--bg`, `--fg`）在不同主题类覆盖。

  访问性 / 性能：
  - 可加入内联脚本防止首次闪烁（FOUC）。
  - 深浅色保持文本对比度 >= WCAG AA。
  - 渐变纯 CSS，无额外请求；若引入纹理请用小图 + cache。

  进阶想法：
  - system / light / dark 三态切换。
  - 用户登录后同步主题偏好到数据库。
  - 主题切换加过渡动画：`transition-colors duration-300`。
  - 多彩主题集合（forest / rose / neon）。

  关键文件：
  - `components/ThemeProvider.tsx`
  - `components/ThemeToggle.tsx`
  - `tailwind.config.js`
  - `app/globals.css`

    select 1 from public.posts p
    where p.id = post_id and p.author_id = auth.uid()
  )
);

-- （可选）若允许普通用户自行创建分类：
-- 注意：这样所有登录用户都能插入分类，可能需要加唯一约束冲突处理逻辑
create policy "categories insert any" on public.categories for insert with check (auth.role() = 'authenticated');
-- 如果还想限制只有有文章的作者才能创建，可改成：
-- with check (auth.role() = 'authenticated' and exists (select 1 from public.posts where author_id = auth.uid()))
```

（如果需要限制只为公开或自己的草稿文章添加分类，可在策略里加 `and (p.is_public is true or p.author_id = auth.uid())`。）

### 示例：插入初始分类

```sql
insert into public.categories (name, slug) values
  ('技术', 'tech'),
  ('生活', 'life')
on conflict do nothing;
```

### 前端查询片段

获取分类列表：

```ts
const { data: categories } = await supabaseServer
  .from("categories")
  .select("id,name,slug,description")
  .order("name");
```

获取单篇文章及分类：

```ts
const { data: post } = await supabaseServer
  .from("posts")
  .select("*, post_categories(categories(id,name,slug))")
  .eq("slug", slug)
  .single();
```

获取某分类下文章：

```ts
const { data } = await supabaseServer
  .from("post_categories")
  .select("posts(*)")
  .eq("category_id", categoryId);
```

创建文章并批量添加分类（客户端逻辑）：

```ts
const { data: created } = await supabaseClient
  .from("posts")
  .insert({ title, content, excerpt, author_id: user.id, is_public })
  .select()
  .single();
if (created && selectedCategoryIds.length) {
  await supabaseClient.from("post_categories").insert(
    selectedCategoryIds.map((id) => ({
      post_id: created.id,
      category_id: id,
    }))
  );
}
```

### 后续可扩展

## 性能优化与实践

当前项目已做的与可继续做的性能点：

### 已实现

- 精确字段选择：替换 `select('*')` 为指定列（首页文章、分类、详情页）。
- 分页 + 无限滚动：首屏仅加载前 15 条，后续按需加载。
- 去重与并发控制：防止重复追加与多次触发 `loadMore`。
- 实时更新轻量化：只在客户端维护增量状态，不重复全量拉取。
- 按需高亮：文章详情改为客户端懒加载 `highlight.js`，避免 SSR 阻塞 & 初始包过大。
- Edge Runtime：首页与分类列表切换到 `runtime = 'edge'` 降低 TTFB。

### 推荐的进一步优化

1. 数据库索引

   ```sql
   create index if not exists idx_posts_is_public_created_at on public.posts(is_public, created_at desc);
   create index if not exists idx_posts_slug on public.posts(slug);
   create index if not exists idx_categories_slug on public.categories(slug);
   create index if not exists idx_post_categories_category on public.post_categories(category_id);
   create index if not exists idx_post_categories_post on public.post_categories(post_id);
   ```

   提升筛选与详情查询性能。

2. 复合筛选分离：若常用 `published = true AND is_public = true`，可增加部分索引或物化视图。
3. Materialized View（可选）：首页热门文章缓存，定时刷新。
4. 前端渲染策略：将列表项拆成独立组件并使用 React.memo 减少重渲染。
5. Realtime 批处理：将多次变更在 `requestAnimationFrame` 中合并 setState。
6. 使用 `select('id')` 预拉取 ID 后批量 `in` 查询需要的长内容字段（当内容字段很大时）。
7. CDN 缓存：文章详情页面可在发布后做静态再验证（ISR）而非每次动态查询。
8. `prefers-reduced-motion`：对动画与粒子背景做降级，降低移动端功耗。
9. 图片与头像：使用 Supabase Storage + `next/image` 自适应尺寸（未来需要时）。
10. 延迟加载后台：`/admin` 页面组件按 tab 动态导入。

### 代码片段示例：Realtime 批处理

```ts
let pendingUpdates: Post[] = [];
function schedule(post: Post) {
  pendingUpdates.push(post);
  if ((window as any)._rafScheduled) return;
  (window as any)._rafScheduled = true;
  requestAnimationFrame(() => {
    setPosts((prev) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const u of pendingUpdates) map.set(u.id, u);
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    });
    pendingUpdates = [];
    (window as any)._rafScheduled = false;
  });
}
```

### 监控建议

- Supabase Dashboard: 启用日志慢查询 (>= 500ms) 观察过滤条件。
- 使用自定义日志表记录文章渲染耗时（Edge Function 埋点）。
- 引入 Web Vitals（`onCLS`, `onLCP`）上报到 Supabase 表。

### 升级路径

- 内容较多时：引入 ElasticSearch / Typesense 做全文检索。
- 高并发：Edge + 物化视图 + Redis 层（通过外部服务）组合。
- 多区域：Supabase 提供多区域后迁移数据或使用 CDN 缓存静态段。

> 持续监测实际瓶颈，按访问模式选择优化点，避免过早优化。

- 分类排序字段（`position`）或层级（父子分类）
- 统计字段：文章数量缓存（触发器维护）
- 标签与分类并存（tags 多对多 + categories 多对多）
- 分类权限（仅管理员可写）

## 注意事项

- 已接入 Supabase Auth：登录后才可写文章，匿名用户只能阅读公开文章。
- slug 由触发器自动生成，不要前端传入。
- `author_id` 由当前登录用户的 `auth.uid()` 注入，不再使用环境变量。
- 建议开启 Row Level Security 并编写策略仅允许作者编辑自己的文章。

### RLS 策略示例（方案 B：匿名只读公开，登录用户写入自己的）

```sql
alter table posts enable row level security;

-- 公开文章所有人可读
create policy "public read" on posts for select using (is_public is true);

-- 作者可读自己未公开的文章（可选）
create policy "owner read" on posts for select using (auth.uid() = author_id);

-- 作者才能插入文章，且 author_id 必须为自己
create policy "insert own" on posts for insert with check (auth.uid() = author_id);

-- 作者才能更新自己的文章
create policy "update own" on posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- 作者才能删除自己的文章（可选）
create policy "delete own" on posts for delete using (auth.uid() = author_id);
```

## 后续可扩展

- 编辑与删除文章
- 用户登录与权限（Supabase Auth + RLS）
- Markdown 编辑器
- 分页与搜索
- 标签与分类
- 点赞 / 评论

## License

MIT

---

## Tailwind CSS 集成说明

项目已使用 Tailwind CSS 替换全部内联样式，主要文件：

- `tailwind.config.js`：配置 content 扫描路径、品牌颜色 `brand`、插件（`@tailwindcss/typography`）。
- `postcss.config.js`：包含 `tailwindcss` 与 `autoprefixer` 插件。
- `app/globals.css`：引入 `@tailwind base; @tailwind components; @tailwind utilities;` 并定义少量基础样式（容器、标题等）。

### 常用类示例

- 布局：`container mx-auto px-4` 保持自适应宽度
- Flex 排版：`flex items-center justify-between gap-4`
- 文字与颜色：`text-sm text-gray-600`, 交互色：`text-brand-600 hover:underline`
- 分隔线：`divide-y divide-gray-200`
- 按钮：`inline-flex items-center rounded bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700 disabled:opacity-50`
- 表单控件：`block w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500`

### 修改样式

1. 在组件中直接添加或调整 Tailwind 类。
2. 若有通用样式，可在 `globals.css` 中通过 `@layer components` 定义自定义类。
3. 复杂富文本区域使用 `prose` 类（已应用在文章详情页）。

### 设计约定

- 颜色：主色使用 `brand`（配置中映射到蓝色系），辅助使用灰度。
- 间距：优先使用空间尺度 `2,4,6,8`（单位为 `tailwind` 间距刻度），标题/区块外边距使用 `mb-6` 或 `space-y-4`。
- 字体：保持默认系统字体族。

### 调试

若类名未生效，检查：

1. 类名是否拼写正确。
2. 文件路径是否在 `tailwind.config.js` 的 `content` 中。
3. 是否重启过开发服务器（添加新文件后建议重启）。

### 迁移策略回顾

我们按组件逐步替换：layout -> 首页 -> 详情页 -> 新建文章 -> Auth 控件；最后移除所有内联样式，统一使用 Tailwind utility。

---

## Supabase 客户端拆分说明

为区分服务端与客户端运行时，我们将 Supabase 封装拆分：

- `supabaseClient`：在浏览器端使用，带有 `auth` 能力（登录/注册/退出、监听状态）。仅使用 **匿名 Key**。
- `supabaseServer`：在服务端使用（页面的服务器组件、未来的 API Route / Route Handler）。也暂时使用匿名 Key，可扩展为使用服务端安全的 Service Role Key（注意不能暴露给客户端）。
- `lib/supabase.ts`：兼容层与集中导出。原先代码继续 `import { supabase }` 不需要立即修改；新代码建议：
  - 客户端组件：`import { supabaseClient } from '../lib/supabase'`
  - 服务器组件：`import { supabaseServer } from '../lib/supabase'`

### 推荐用法

```ts
// 页面 (Server Component)
import { supabaseServer } from "@/lib/supabase";
const { data } = await supabaseServer.from("posts").select("*");

// 客户端组件 ("use client")
import { supabaseClient } from "@/lib/supabase";
const {
  data: { session },
} = await supabaseClient.auth.getSession();
```

### 后续可扩展

1. 添加 `SUPABASE_SERVICE_ROLE_KEY`（仅服务器端使用）实现更高级操作（例如后端批处理）。
2. 编写一个中间层函数 `getServerSupabase()` 动态注入用户 JWT 到服务端查询（适合不可直接在客户端暴露的逻辑）。
3. 在 `app/api/*` Route Handlers 中使用 `supabaseServer` 执行安全写入。

---

---
