const uuid = require('uuid')
const path = require('path')
const Analytics = require('analytics-node')
const getConfig = require('../config/getConfig')

// commented out because fetching location adds 1-2 seconds delay
// do we want it for tracking?
// const getLocation = require('./getLocation')

/*
 * Segment write key is not sensitive and can be exposed in version control:
 * REF: https://community.segment.com/t/m26sng/writekey-accessible-by-anyone
 */
const analytics = new Analytics('IhWcpDxil0KbBkoBXrQ7Brwz82OHwNh3')

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
