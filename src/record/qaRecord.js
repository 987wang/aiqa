'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_FILE = path.join(__dirname, '..', '..', 'data', 'qa-records.json');

function dataFile() {
    return process.env.QA_DATA_FILE || DEFAULT_FILE;
}

function readAll() {
    const file = dataFile();
    try {
        // 去掉 Windows 记事本/PowerShell 可能写入的 BOM，否则 JSON.parse 会失败
        const raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
        if (!raw.trim()) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

function writeAll(records) {
    const file = dataFile();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(records, null, 2), 'utf8');
    return records;
}

function genId() {
    return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function add(entry) {
    const records = readAll();
    const record = {
        id: entry.id || genId(),
        question: entry.question,
        answer: entry.answer,
        sources: entry.sources || [],
        mode: entry.mode || 'demo',
        createdAt: entry.createdAt || new Date().toISOString()
    };
    records.push(record);
    writeAll(records);
    return record;
}

// limit 缺省时返回全部；limit<=0 返回空数组；否则取最新 limit 条
function list(limit) {
    const records = readAll().reverse();
    if (limit === undefined || limit === null) return records;
    const n = Math.floor(Number(limit));
    if (!Number.isFinite(n) || n <= 0) return [];
    return records.slice(0, n);
}

module.exports = { add, list, readAll, writeAll, dataFile };