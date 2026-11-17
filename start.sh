#!/usr/bin/env bash
# 无 Docker 环境下的替代部署脚本：安装依赖 → 分层测试 → 启动服务
set -e

echo "[1/5] 安装依赖"
npm install --no-audit --no-fund

echo "[2/5] 单元测试"
npm test

echo "[3/5] 集成测试"
npm run test:api

echo "[4/5] 覆盖率门槛（80%）"
npm run test:coverage

echo "[5/5] 端到端测试"
npm run test:e2e

echo "启动服务：http://localhost:${PORT:-3000}"
npm start
