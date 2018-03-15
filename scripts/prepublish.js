const path = require('path')
const { writeFile } = require('../src/utils/fs')

const trackingConfigFilePath = path.join(process.cwd(), 'tracking-config.json')

// don't release without Sentry key!
if (!process.env.SENTRY_DSN) {
  throw new Error('SENTRY_DSN env var not set')
}

const trackingConfig = {
  sentryDSN: process.env.SENTRY_DSN,
  environment: 'production'
};
(() => writeFile(trackingConfigFilePath, trackingConfig))()
