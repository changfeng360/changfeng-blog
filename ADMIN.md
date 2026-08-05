# Changfeng Blog Admin

这是一个轻量级、基于 Git 的网页管理端。站点仍然使用 Next.js 静态导出，后台编辑通过 Cloudflare Pages Functions 调用 GitHub API 自动提交。

## 数据位置

- 个人简介：`content/profile.json`
- 项目：`content/projects.json`
- 友链：`content/friends.json`
- 站点样式：`content/site.json`
- 文章：`content/posts/*.mdx`

保存后会把修改直接提交到 GitHub，Cloudflare Pages 检测到推送后会自动重新构建部署。

## 环境变量

在 Cloudflare Pages 项目的 Settings > Environment variables 中配置：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_TOKEN` | 是 | 登录 `/admin` 使用的管理密码 |
| `GITHUB_TOKEN` | 是 | GitHub Personal Access Token，需要 `repo` 权限 |
| `GITHUB_REPO` | 否 | 默认 `changfeng360/changfeng-blog` |
| `GITHUB_BRANCH` | 否 | 默认 `main` |
| `RESEND_API_KEY` | 否 | Resend API Key，用于发送留言通知和博主回复邮件 |
| `RESEND_FROM_EMAIL` | 否 | 发件邮箱，需要先在 Resend 验证域名 |
| `RESEND_TO_EMAIL` | 否 | 接收留言通知的邮箱，默认使用发件邮箱 |
| `OWNER_EMAIL` | 否 | 接收留言通知的备用邮箱 |

未配置邮件变量时，留言和回复仍会正常显示在网页上，只是不会发送邮件。

## 使用

1. 部署后访问 `https://你的域名/admin`。
2. 输入 `ADMIN_TOKEN` 进入后台。
3. 登录后点击 `Open site` 返回前台，右下角会为管理员显示 `Edit`，访客看不到任何编辑入口。
4. 编辑模式下点击 `Style` 可以调整基础字号、标题斜体、主题强调色和背景色。
5. 也可以在 `/admin` 里编辑对应 JSON 或 MDX 原文。
6. 每次保存都会自动提交 Git，随后 Cloudflare 自动重新部署。

`site.json` 支持调整基础字号、标题是否斜体、主题强调色、浅色/深色背景色。

## 本地开发

前台开发仍使用：

```bash
pnpm dev:site
```

要同时测试管理 API，可以先构建静态站点，再用 Cloudflare Wrangler 启动 Pages Functions：

```bash
pnpm build
pnpm dlx wrangler pages dev out
```

本地调试时可通过 `.dev.vars` 或 Wrangler 环境变量提供 `ADMIN_TOKEN`、`GITHUB_TOKEN`。
