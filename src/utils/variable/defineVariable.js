import { defineProperty } from '@serverless/utils'

const defineVariable = (target, prop, variable) => {
  defineProperty(target, prop, {
    configurable: true,
    enumerable: true,
    get() {
      return variable.valueOf()
    },
    set(value) {
      defineProperty(target, prop, {
        configurable: true,
        enumerable: true,
        writeable: true,
        value
      })
    }
  })
}

export default defineVariable
