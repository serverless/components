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
    if (children) {
      if (isArray(children)) {
        printArray(compact(children), context.log)
      } else {
        printObj(compact(children), context.log)
      }
    }

    return context
  }
}

const printArray = (arr, log, level = 0) =>
  forEach((item) => {
    const { type, data, children } = item
    const title = item.title || data.title
    log(`|- ${title} - ${type}`)
    const subLog = (line) => log(`   ${line}`)
    if (isArray(data)) {
      printArray(compact(data), subLog, level + 1)
    } else {
      printObj(compact(data), subLog, level + 1)
    }
    if (children && level <= 1) {
      if (isArray(children)) {
        printArray(compact(children), subLog)
      } else {
        printObj(compact(children), subLog)
      }
    }
  }, arr)

const printObj = (obj, log, level = 0) => {
  if (!obj) {
    return
  }
  const subLog = (line) => log(`   ${line}`)
  if (
    (keys(obj).length === 3 || (keys(obj).length === 4 && obj.children)) &&
    obj.title &&
    obj.type &&
    obj.data
  ) {
    if (isArray(obj.data)) {
      printArray(compact(obj.data), subLog, level + 1)
    } else {
      printObj(compact(obj.data), subLog, level)
    }
    if (obj.children && level <= 1) {
      if (isArray(obj.children)) {
        printArray(compact(obj.children), subLog)
      } else {
        printObj(compact(obj.children), subLog)
      }
    }
  } else {
    forEach((val, key) => {
      if (isArray(val)) {
        printArray(val, subLog, level + 1)
      } else if (isObject(val)) {
        log(`${key}:`)
        printObj(val, subLog, level + 1)
      } else {
        log(`${key}: ${val}`)
      }
    }, obj)
  }
}

export default Info
