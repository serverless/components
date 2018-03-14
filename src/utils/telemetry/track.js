const uuid = require('uuid')
const path = require('path')
const Analytics = require('analytics-node')
const getConfig = require('../config/getConfig')

// commented out because fetching location adds 1-2 seconds delay
// do we want it for tracking?
// const getLocation = require('./getLocation')

const { segmentWriteKey } = require(path.join('..', '..', 'tracking-config.json')) // eslint-disable-line

const analytics = new Analytics(segmentWriteKey)

module.exports = async (eventName, data = {}) => {
  if (!eventName) {
    throw new Error('Please provide an event name for tracking')
  }
  const { trackingDisabled, frameworkId, userId } = await getConfig()

  // exit early if tracking disabled
  if (trackingDisabled) {
    return
  }

  const payload = {
    event: eventName,
    frameworkId,
    userId: userId || uuid.v1(),
    // location: await getLocation(),
    properties: data
  }

  return analytics.track(payload)  // eslint-disable-line
}
