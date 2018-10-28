import { handleSignalEvents } from '../../utils'
import { forEach, isFunction, isObject, isArray, keys } from '@serverless/utils'

const Info = {
  async run(context) {
    context.log('Running info...')
    context = await context.loadProject()
    context = await context.loadApp()

    const prevContext = await context.loadPreviousDeployment()

    // TODO BRN (low priority): Upgrade this signal handling so that we can tie in a handler that knows what to do when a SIGINT is received. In the case of deploy we may want to ignore the first one and log out the message, then if we receive anther one we stop the current deployment and start a rollback
    handleSignalEvents(context)

    // TODO BRN (low priority): inputs to the top level might be a way to inject project/deployment config

    const prevInstance = await prevContext.loadInstanceFromState()

    if (prevInstance && isFunction(prevInstance.info)) {
      const { title, type, data } = await prevInstance.info(context)
      context.log(`${title} - ${type}`)
      if (isArray(data)) {
        printArray(data, context.log)
      } else {
        printObj(data, context.log)
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
    if (isArray(data)) {
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
  if (keys(obj).length === 3 && obj.title && obj.type && obj.data) {
    if (isArray(obj.data)) {
      printArray(obj.data, log, level + 1)
    } else {
      printObj(obj.data, log, level)
    }
  } else {
    forEach((val, key) => {
      const space = '  '
      if (isArray(val)) {
        printArray(val, log, level + 1)
      } else if (isObject(val)) {
        log(`${space.repeat(level)}${key}:`)
        printObj(val, log, level + 1)
      } else {
        log(`${space.repeat(level)}${key}: ${val}`)
      }
    }, obj)
  }
}

export default Info
