# 单阶段精简镜像：本工程运行时零第三方依赖，无需多阶段构建
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# 先复制依赖清单，依赖未变时可复用缓存层
COPY package.json ./

# 再复制运行所需源码与静态资源
COPY src ./src
COPY public ./public
COPY data ./data

EXPOSE 3000

# 健康检查：/api/history 能返回 200 即视为可用
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/history?limit=1 > /dev/null || exit 1

CMD ["node", "src/server.js"]
