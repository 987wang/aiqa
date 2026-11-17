'use strict';
// 被测模块：src/record/qaRecord.js（问答记录的增、查、序列化）
// 测试范围：add 计数与字段完整、list 排序与 limit 边界、writeAll→readAll 往返一致
// describe / it / expect / beforeEach / afterEach 由 vitest 全局注入（见 vitest.config.js）
const fs = require('fs');
const os = require('os');
const path = require('path');
const qaRecord = require('../src/record/qaRecord');

let tmpFile;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), 'qa-unit-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
  fs.writeFileSync(tmpFile, '[]', 'utf8');
  process.env.QA_DATA_FILE = tmpFile;
});

afterEach(() => {
  delete process.env.QA_DATA_FILE;
  try { fs.unlinkSync(tmpFile); } catch (e) { /* 文件可能已不存在 */ }
});

describe('qaRecord 记录模块', () => {
  it('add 后总记录数正确递增 1', () => {
    qaRecord.add({ question: '问题 A', answer: '回答 A' });
    expect(qaRecord.readAll()).toHaveLength(1);
    qaRecord.add({ question: '问题 B', answer: '回答 B' });
    expect(qaRecord.readAll()).toHaveLength(2);
  });

  it('add 保存的字段完整', () => {
    const rec = qaRecord.add({ question: '什么是 Spec 驱动开发？', answer: '先写验收标准', sources: ['教材'], mode: 'demo' });
    expect(rec).toMatchObject({ question: '什么是 Spec 驱动开发？', answer: '先写验收标准', sources: ['教材'], mode: 'demo' });
    expect(typeof rec.id).toBe('string');
    expect(Number.isNaN(Date.parse(rec.createdAt))).toBe(false);
  });

  it('add 保留调用方传入的 id', () => {
    const rec = qaRecord.add({ id: 'r_fixed', question: 'Q', answer: 'A' });
    expect(rec.id).toBe('r_fixed');
  });

  it('add 自动生成的 id 互不重复', () => {
    const a = qaRecord.add({ question: 'Q1', answer: 'A1' });
    const b = qaRecord.add({ question: 'Q2', answer: 'A2' });
    expect(a.id).not.toBe(b.id);
  });

  it('add 的 sources 缺省为空数组、mode 缺省为 demo', () => {
    const rec = qaRecord.add({ question: 'Q', answer: 'A' });
    expect(rec.sources).toEqual([]);
    expect(rec.mode).toBe('demo');
  });

  it('list() 按“最新创建在前”返回（写入 A、B 后应为 [B, A]）', () => {
    qaRecord.add({ question: '问题 A', answer: '回答 A' });
    qaRecord.add({ question: '问题 B', answer: '回答 B' });
    const got = qaRecord.list().map((r) => r.question);
    expect(got).toEqual(['问题 B', '问题 A']);
  });

  it('list() 不带参数时返回全部记录', () => {
    qaRecord.add({ question: 'Q1', answer: 'A1' });
    qaRecord.add({ question: 'Q2', answer: 'A2' });
    qaRecord.add({ question: 'Q3', answer: 'A3' });
    expect(qaRecord.list()).toHaveLength(3);
  });

  it('list(1) 只返回最新的一条', () => {
    qaRecord.add({ question: '问题 A', answer: '回答 A' });
    qaRecord.add({ question: '问题 B', answer: '回答 B' });
    const got = qaRecord.list(1);
    expect(got).toHaveLength(1);
    expect(got[0].question).toBe('问题 B');
  });

  it('list(0) 返回空数组', () => {
    qaRecord.add({ question: 'Q', answer: 'A' });
    expect(qaRecord.list(0)).toEqual([]);
  });

  it('list(-3) 返回空数组（负数边界）', () => {
    qaRecord.add({ question: 'Q', answer: 'A' });
    expect(qaRecord.list(-3)).toEqual([]);
  });

  it('list(999) 超过总数时返回全部', () => {
    qaRecord.add({ question: 'Q1', answer: 'A1' });
    qaRecord.add({ question: 'Q2', answer: 'A2' });
    expect(qaRecord.list(999)).toHaveLength(2);
  });

  it('readAll 遇到空文件返回空数组而不是 null', () => {
    fs.writeFileSync(tmpFile, '', 'utf8');
    expect(qaRecord.readAll()).toEqual([]);
  });

  it('readAll 遇到不存在的文件返回空数组', () => {
    process.env.QA_DATA_FILE = path.join(os.tmpdir(), 'not-exist-' + Date.now() + '.json');
    expect(qaRecord.readAll()).toEqual([]);
  });

  it('writeAll 写入的数据能被 readAll 完整读回', () => {
    const records = [
      { id: 'r1', question: 'Q1', answer: 'A1', sources: ['s1'], mode: 'demo', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'r2', question: 'Q2', answer: 'A2', sources: [], mode: 'demo', createdAt: '2026-01-02T00:00:00.000Z' }
    ];
    qaRecord.writeAll(records);
    expect(qaRecord.readAll()).toEqual(records);
  });

  it('writeAll 是覆盖写，不会追加残留', () => {
    qaRecord.writeAll([{ id: 'r1', question: 'Q1', answer: 'A1', sources: [], mode: 'demo', createdAt: '2026-01-01T00:00:00.000Z' }]);
    qaRecord.writeAll([]);
    expect(qaRecord.readAll()).toEqual([]);
  });

  it('createdAt 为可解析的时间字符串', () => {
    const rec = qaRecord.add({ question: 'Q', answer: 'A' });
    expect(new Date(rec.createdAt).toISOString()).toBe(rec.createdAt);
  });

  it('连续 add 的记录按写入顺序落盘', () => {
    qaRecord.add({ question: 'Q1', answer: 'A1' });
    qaRecord.add({ question: 'Q2', answer: 'A2' });
    const raw = qaRecord.readAll();
    expect(raw.map((r) => r.question)).toEqual(['Q1', 'Q2']);
  });
});
