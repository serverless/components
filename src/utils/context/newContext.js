import { get, pick, set } from '@serverless/utils'
import construct from '../type/construct'
import loadType from '../type/loadType'

const newContext = (props) => {
  const context = pick(['cache', 'cwd', 'data', 'registry', 'root'], props)

  const finalContext = {
    ...context,
    construct: (type, inputs) => construct(type, inputs, context),
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
