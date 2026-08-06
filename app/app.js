'use strict';

const express = require('express');
const { register, metricsMiddleware } = require('./metrics');

const PORT = process.env.PORT || 8080;
const START_TIME = Date.now();

function createApp() {
  const app = express();
  app.use(metricsMiddleware);

  // Root endpoint.
  app.get('/', (req, res) => {
    res.json({
      service: 'production-readiness-lab',
      message: 'Service is running',
      version: process.env.APP_VERSION || '1.0.0',
    });
  });

  // Liveness / readiness probe.
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    });
  });

  // Prometheus scrape endpoint.
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  return app;
}

// Only start listening when run directly (not when imported by tests).
if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on port ${PORT}`);
  });
}

module.exports = { createApp };
