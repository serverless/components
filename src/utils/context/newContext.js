import { get, pick, set } from '@serverless/utils'
import loadType from '../type/loadType'

const newContext = (props) => {
  const context = pick(['cache', 'cwd', 'data', 'registry'], props)

  const finalContext = {
    ...context,
    get: (selector) => get(selector, context.data),
    loadType: (...args) => loadType(...args, finalContext),
    merge: (value) =>
      newContext({
        ...context,
        ...value
      }),
    set: (selector, value) =>
      newContext({
        ...context,
        data: set(selector, value, context.data)
      })
  }
  return finalContext
}

export default newContext
