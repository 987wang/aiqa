'use strict';
const qaRecord = require('../record/qaRecord');

const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(new Error('INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

// POST /api/ask
async function handleAsk(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    return json(res, 400, { ok: false, error: '请求体不是合法 JSON' });
  }
  const question = String(body.question || '').trim();
  if (!question) {
    return json(res, 400, { ok: false, error: '问题内容不能为空' });
  }
  try {
    if (process.env.LLM_FAIL === '1') throw new Error('LLM_ERROR');
    const answer = `（演示模式）关于“${question}”：Spec 驱动开发强调先写清验收标准，再让 AI 实现代码，最后由测试证明实现没有跑偏。`;
    const record = qaRecord.add({
      question,
      answer,
      sources: ['教材 7.2 AI 辅助测试'],
      mode: 'demo'
    });
    return json(res, 200, { ok: true, data: record });
  } catch (e) {
    return json(res, 502, { ok: false, error: '大模型服务暂时不可用' });
  }
}

// GET /api/history?limit=20
function handleHistory(req, res, url) {
  const raw = url.searchParams.get('limit');
  const limit = raw === null ? 20 : Number(raw);
  return json(res, 200, { ok: true, data: qaRecord.list(limit) });
}

module.exports = { handleAsk, handleHistory };
