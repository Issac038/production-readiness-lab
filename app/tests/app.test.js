'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../app');

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function get(server, path) {
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}${path}`);
  const text = await res.text();
  return { status: res.status, text };
}

test('GET / returns service info', async () => {
  const server = await listen(createApp());
  try {
    const res = await get(server, '/');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /production-readiness-lab/);
  } finally {
    server.close();
  }
});

test('GET /health returns healthy', async () => {
  const server = await listen(createApp());
  try {
    const res = await get(server, '/health');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /healthy/);
  } finally {
    server.close();
  }
});

test('GET /metrics exposes prometheus metrics', async () => {
  const server = await listen(createApp());
  try {
    const res = await get(server, '/metrics');
    assert.strictEqual(res.status, 200);
    assert.match(res.text, /http_requests_total/);
  } finally {
    server.close();
  }
});
