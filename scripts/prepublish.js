const { writeFile } = require('@serverless/utils')
const path = require('path')

const trackingConfigFilePath = path.join(process.cwd(), 'tracking-config.json')

// don't release without Sentry key!
if (!process.env.SENTRY_DSN) {
  throw new Error('SENTRY_DSN env var not set')
}

// don't release without Segment write key!
if (!process.env.SEGMENT_WRITE_KEY) {
  throw new Error('SEGMENT_WRITE_KEY env var not set')
}

const trackingConfig = {
  sentryDSN: process.env.SENTRY_DSN,
  environment: 'production',
  segmentWriteKey: process.env.SEGMENT_WRITE_KEY
};
(() => writeFile(trackingConfigFilePath, trackingConfig))()
