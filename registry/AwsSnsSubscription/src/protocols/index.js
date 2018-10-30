import { contains, find, flatten, map } from '@serverless/utils'
import * as application from './application'
import * as email from './email'
import * as http from './http'
import * as lambda from './lambda'
import * as sms from './sms'
import * as sqs from './sqs'

const protocols = [application, email, http, lambda, sms, sqs]

const types = flatten(map((protocol) => protocol.types, protocols))

const getProtocol = (protocol) => {
  if (!contains(protocol, types)) {
    throw new Error(`Invalid protocol "${protocol}"`)
  }
  return find(({ types: deployTypes }) => contains(protocol, deployTypes), protocols)
}

export { getProtocol, types }
