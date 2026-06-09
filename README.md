# 表盘项目

一个基于 React + Vite 的 canvas 表盘项目。表盘绘制逻辑保留在独立 renderer 中，React 负责主题、菜单、点击提示和模式切换。

## 运行

```bash
pnpm install
pnpm test
pnpm start
```

打开 `http://localhost:4173`。

## 交互

- 点击表盘：在普通、秒圈聚焦、分钟圈聚焦之间切换。
- 右侧菜单：切换深空、日落、极光、星空、像素五套主题。
