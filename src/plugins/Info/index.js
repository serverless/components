import { handleSignalEvents } from '../../utils'
import { isFunction, isObject } from '@serverless/utils'

const Info = {
  async run(context) {
    context.log('Deploy running...')
    context = await context.loadProject()
    context = await context.loadApp()

    const prevContext = await context.loadPreviousDeployment()
    const nextContext = await context.createDeployment(prevContext.deployment)

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config

    // const prevInstance = await prevContext.loadInstanceFromState()
    const nextInstance = await nextContext.createInstance()

    if (nextInstance && isFunction(nextInstance.info)) {
      const { title, type, data } = await nextInstance.info(context)
      context.log(`${title} - ${type}`)
      if (Array.isArray(data)) {
        printArray(data, context.log)
      }
    }
  }
}

const printArray = (arr, log, level = 1) => {
  arr.forEach((item) => {
    const { type, data } = item
    let { title } = item
    if (!title && data.title) {
      title = data.title
    }
    log(`\n|- ${`  `.repeat(level)}${title} - ${type}`)
    if (Array.isArray(data)) {
      printArray(data, log, level + 2)
    } else {
      printObj(data, log, level + 2)
    }
  })
}

const printObj = (obj, log, level = 1) => {
  if (!obj) {
    return
  }
  if (Object.keys(obj).length === 3 && obj.title && obj.type && obj.data) {
    if (Array.isArray(obj.data)) {
      printArray(obj.data, log, level + 1)
    } else {
      printObj(obj.data, log, level)
    }
  } else {
    Object.entries(obj).forEach(([key, val]) => {
      const space = '  '
      if (isObject(val)) {
        log(`${space.repeat(level)}${key}:`)
        printObj(val, log, level + 1)
      } else {
        log(`${space.repeat(level)}${key}: ${val}`)
      }
    })
  }
}

export default Info