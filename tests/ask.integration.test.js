'use strict';
// 集成测试：验证 POST /api/ask 与 GET /api/history 的接口契约与数据传递
// 每条用例开始前把问答记录文件恢复为空，避免用例之间互相污染
// describe / it / expect / beforeEach / afterEach 由 vitest 全局注入（见 vitest.config.js）
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('../src/server');

let app;
let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), 'qa-int-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
  fs.writeFileSync(tmpFile, '[]', 'utf8');
  process.env.QA_DATA_FILE = tmpFile;
  app = createServer();
});

afterEach(() => {
  delete process.env.QA_DATA_FILE;
  delete process.env.LLM_FAIL;
  try { fs.unlinkSync(tmpFile); } catch (e) { /* ignore */ }
});

describe('POST /api/ask', () => {
  it('正常提问返回 200，回答非空且字段齐全', async () => {
    const res = await request(app).post('/api/ask').send({ question: '什么是 Spec 驱动开发？' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.answer.length).toBeGreaterThan(0);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('question', '什么是 Spec 驱动开发？');
    expect(res.body.data).toHaveProperty('sources');
    expect(res.body.data).toHaveProperty('mode');
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('问题为空（或只有空格）时返回 400 与“问题内容不能为空”', async () => {
    const res = await request(app).post('/api/ask').send({ question: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('问题内容不能为空');
  });

  it('大模型调用失败时返回 502', async () => {
    process.env.LLM_FAIL = '1';
    const res = await request(app).post('/api/ask').send({ question: '测试 502' });
    expect(res.status).toBe(502);
    expect(res.body.ok).toBe(false);
  });
});

describe('GET /api/history 与 POST /api/ask 的数据串联', () => {
  it('提问后能在 history 中查到刚写入的那一条，且最新在前', async () => {
    await request(app).post('/api/ask').send({ question: '第一个问题' });
    await request(app).post('/api/ask').send({ question: '什么是 MCP？' });

    const res = await request(app).get('/api/history?limit=20');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].question).toBe('什么是 MCP？');
    expect(res.body.data[1].question).toBe('第一个问题');
  });
});
