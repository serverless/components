import { shallowEquals } from '@serverless/utils'

const DEPLOY = 'deploy'

const Component = {
  hydrate(state, context) {
    this.instanceId = state.instanceId || context.generateInstanceId()
  },

  async define() {
    return {
      ...this.components
    }
  },

  shouldDeploy(prevInstance, context) {
    if (!prevInstance || !shallowEquals(prevInstance, this)) {
      return DEPLOY
    }
  },

  async deploy() {},

  async remove() {},

  toString() {
    return `${this['@@key']} ${this.name} {  }`
  }
}

export default Component
