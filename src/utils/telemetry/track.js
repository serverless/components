const { fileExists, getConfig, readFile } = require('@serverless/utils')
const path = require('path')
const Analytics = require('analytics-node')
const getLocation = require('./getLocation')

module.exports = async (eventName, data = {}) => {
  const trackingFilePath = path.resolve(__dirname, '..', '..', '..', 'tracking-config.json')
  const { trackingDisabled, frameworkId, userId } = await getConfig()

  // exit early if tracking disabled
  if (
    trackingDisabled ||
    !(await fileExists(trackingFilePath)) ||
    process.env.CI ||
    process.env.TRAVIS
  ) {
    return
  }

  const { segmentWriteKey } = await readFile(trackingFilePath) // eslint-disable-line

  if (!segmentWriteKey) return

  const analytics = new Analytics(segmentWriteKey)

  if (!eventName) {
    throw new Error('Please provide an event name for tracking')
  }

  const location = await getLocation()

  const payload = {
    event: eventName,
    userId: userId || frameworkId,
    location: await getLocation(),
    properties: { frameworkId, location, ...data }
  }

  return analytics.track(payload) // eslint-disable-line
}
