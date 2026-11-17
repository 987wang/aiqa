'use strict';
const http = require('http');
const { URL } = require('url');
const { handleAsk, handleHistory } = require('./routes/ask');
const { serveStatic } = require('./static');

// 可导出的工厂：只建服务、不监听端口，便于集成测试直接引入
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'POST' && url.pathname === '/api/ask') return await handleAsk(req, res);
      if (req.method === 'GET' && url.pathname === '/api/history') return handleHistory(req, res, url);
      return serveStatic(req, res, url.pathname);
    } catch (err) {
      // 单个请求出错只回 500，不让整个进程退出
      console.error('请求处理失败：', err);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: '服务内部错误' }));
    }
  });
}

// 只有直接运行 node src/server.js 时才监听端口
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createServer().listen(port, () => {
    console.log('AI 答疑助手已启动：http://localhost:' + port);
  });
}

module.exports = { createServer };
