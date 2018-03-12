const { merge } = require('ramda')
const fetch = require('node-fetch')
const isValidEventName = require('./isValidEventName')

const TRACK_URL = 'https://serverless.com/api/framework/track'

module.exports = async (eventName, payload) => {
  const data = payload || {}
  let userId = data.id
  let userEmail = data.email

  const TRACKING_IS_DISABLED = get('trackingDisabled')

  // exit early if tracking disabled
  if (TRACKING_IS_DISABLED && !data.force) {
    return
  }

  const config = getConfig()
  const { frameworkId } = config
  // getConfig for values if not provided from .track call
  if (!userId || !userEmail) {
    userId = config.userId // eslint-disable-line
    if (config.users && config.users[userId] && config.users[userId].email) {
      userEmail = config.users[userId].email
    }
  }

  // automatically add `framework:` prefix
  if (eventName.indexOf('framework:') === -1) {
    eventName = `framework:${eventName}` // eslint-disable-line
  }

  // to ensure clean data, validate event name
  if (!isValidEventName(eventName)) {
    return
  }

  const defaultData = {
    event: eventName,
    id: userId,
    frameworkId,
    email: userEmail,
    data: {
      id: userId,
      timestamp: Math.round(+new Date() / 1000)
    }
  }

  delete data.force
  const eventData = merge(defaultData, data)

  const res = await fetch(TRACK_URL, {
    method: 'POST',
    // set to 1000 b/c no response needed
    timeout: '1000',
    body: JSON.stringify(eventData)
  })

  if (res.status === 404) {
    throw new Error('404 api not found')
  }

  return res.json()  // eslint-disable-line
}
