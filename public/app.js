'use strict';

const $ = (id) => document.getElementById(id);
const input = $('question');
const btn = $('askBtn');
const result = $('result');
const answer = $('answer');
const meta = $('meta');
const history = $('history');

function renderHistory(items) {
  history.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.setAttribute('data-testid', 'history-item');
    li.textContent = item.question;
    history.appendChild(li);
  });
}

async function loadHistory() {
  const res = await fetch('/api/history?limit=20');
  const body = await res.json();
  if (body.ok) renderHistory(body.data);
}

async function ask() {
  const question = input.value.trim();
  if (!question) {
    input.focus();
    return;
  }
  btn.disabled = true;
  btn.textContent = '思考中…';
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const body = await res.json();
    if (!body.ok) {
      result.classList.remove('hidden');
      answer.textContent = '提问失败：' + body.error;
      meta.textContent = '';
      return;
    }
    result.classList.remove('hidden');
    answer.textContent = body.data.answer;
    meta.textContent = '来源：' + body.data.sources.join('、') + ' · 模式：' + body.data.mode;
    input.value = '';
    await loadHistory();
  } catch (err) {
    result.classList.remove('hidden');
    answer.textContent = '网络异常：' + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '提交提问';
  }
}

btn.addEventListener('click', ask);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ask();
});
loadHistory();
