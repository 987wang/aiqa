'use strict';
const request = require('supertest');
const { createServer } = require('../src/server');

const app = createServer();

describe('静态资源与路由兜底', () => {
  it('GET / 返回 index.html', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('AI 答疑助手');
  });

  it('GET /app.js 返回 JavaScript', async () => {
    const res = await request(app).get('/app.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('javascript');
  });

  it('GET 不存在的文件返回 404 纯文本', async () => {
    const res = await request(app).get('/not-exist.js');
    expect(res.status).toBe(404);
    expect(res.text).toBe('404 Not Found');
  });

  it('GET /api/history 返回历史列表', async () => {
    const res = await request(app).get('/api/history?limit=1');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
