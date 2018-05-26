/* eslint-disable no-console */

const { map, flatten, contains, find } = require('ramda')

const application = require('./application')
const email = require('./email')
const http = require('./http')
const lambda = require('./lambda')
const sms = require('./sms')
const sqs = require('./sqs')

const protocols = [application, email, http, lambda, sms, sqs]

const types = flatten(map((protocol) => protocol.types, protocols))

const getProtocol = (protocol) => {
  if (!contains(protocol, types)) throw new Error(`Invalid protocol "${protocol}"`)
  return find(({ types: deployTypes }) => contains(protocol, deployTypes), protocols)
}

module.exports = {
  types,
  getProtocol: (protocol) => getProtocol(protocol)
}
