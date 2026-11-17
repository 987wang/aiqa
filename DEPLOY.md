# AI 答疑助手（aiqa）部署说明

## 1. 本地启动

```bash
npm install
npm start          # 默认 3000 端口，可用 PORT 覆盖
# 访问 http://localhost:3000
```

## 2. 容器命令（本机未安装 Docker 时走第 4 节替代路径）

```bash
docker build -t aiqa:1.0 .
docker run -d --name aiqa-web -p 3001:3000 aiqa:1.0
docker logs -f aiqa-web        # 查看启动与请求日志
docker rm -f aiqa-web          # 删除容器
```

## 3. 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| PORT | 3000 | 服务监听端口 |
| LLM_FAIL | 未设置 | 设为 1 时模拟大模型故障，接口返回 502 |
| NODE_ENV | production（镜像内） | 运行环境标识 |

凭据不入镜像、不入仓库：真实接入大模型时通过 `docker run -e LLM_API_KEY=...` 或 CI secrets 注入。

## 4. 替代启动方式（无 Docker）

```bash
bash start.sh      # 依次执行：依赖安装 → 单元/集成/覆盖率/E2E → 启动服务
```

## 5. 故障排查

| 现象 | 排查步骤 |
|---|---|
| 端口占用 EADDRINUSE | `netstat -ano | findstr :3000` 找到 PID 后结束进程，或 `PORT=3001 npm start` |
| 容器起不来 | `docker logs aiqa-web`；先看是否有 `SyntaxError`（data/qa-records.json 需为合法 JSON） |
| 页面 404 | 确认 `public/` 已复制进镜像；`docker exec -it aiqa-web ls /app/public` |
| 数据不落盘 | 容器内写 `data/qa-records.json`，需 `-v $(pwd)/data:/app/data` 挂载才能持久化 |
| 健康检查失败 | `docker inspect --format '{{.State.Health.Status}}' aiqa-web`，再按上面两条排查 |

## 6. 运维清单

- [ ] 发布前 `npm test` / `npm run test:api` / `npm run test:e2e` 全绿
- [ ] 覆盖率不低于 80%（`npm run test:coverage`，低于门槛自动失败）
- [ ] 镜像使用固定标签的基础镜像（node:24-alpine），不使用 latest
- [ ] 容器带重启策略 `--restart=unless-stopped`
- [ ] 日志可查（docker logs / 健康检查状态）
