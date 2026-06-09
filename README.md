# 表盘项目

一个基于 React + Vite 的 canvas 表盘项目。表盘绘制逻辑保留在独立 renderer 中，React 负责主题、菜单、点击提示和模式切换。

## 运行

```bash
pnpm install
pnpm test
pnpm dev
```

打开 `http://localhost:4173`。

## Cloudflare

```bash
pnpm build
pnpm deploy
```

Cloudflare 构建命令：`pnpm build`

输出目录：`dist`

本地预览 Workers Static Assets：

```bash
pnpm preview:cloudflare
```

## 交互

- 点击表盘：在普通、秒圈聚焦、分钟圈聚焦之间切换。
- 右侧菜单：二级主题分组包含光谱、简约、像素。
- 简约主题支持跟随系统深浅色。
