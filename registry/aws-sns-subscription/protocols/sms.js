/* eslint-disable no-console */

const { subscribe, unsubscribe } = require('./lib')

const deploy = async ({ topic, protocol, endpoint = '' }, context) =>
  subscribe({ topic, protocol, endpoint }, context)

const remove = async ({ subscriptionArn }, context) => unsubscribe({ subscriptionArn }, context)

module.exports = {
  deploy,
  remove,
  types: ['sms']
}
