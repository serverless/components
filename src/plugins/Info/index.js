import { compact, forEach, isFunction, isObject, isArray, keys } from '@serverless/utils'

const Info = {
  async run(context) {
    context.log('Getting info...')
    if (!context.instance) {
      context = await context.loadProject()
      context = await context.loadApp()
      context = await context.loadPreviousDeployment()
      if (!context.previousDeployment) {
        context.log('Nothing deployed!')
        return
      }
      context = await context.loadState()
      // Load the instance from state instead of serverless.yml
      context = await context.loadInstance()
    }

    const { instance } = context
    if (!instance) {
      context.log('Nothing deployed!')
      return
    }
    if (!isFunction(instance.info)) {
      throw new Error(`info method is not implemented for the component ${instance.name}`)
    }

    const { title, type, data, children } = await instance.info(context)
    context.log(`${title} - ${type}`)
    printObj(compact(data), context.log)
    if (isArray(children)) {
      printArray(compact(children), context.log)
    } else {
      printObj(compact(children), context.log)
    }
  }
}

const printArray = (arr, log, level = 1) =>
  forEach((item) => {
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
  }, arr)

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
