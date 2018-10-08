import { shallowEquals } from '@serverless/utils'

const DEPLOY = 'deploy'

const Component = {
  async construct(context) {
    const state = context.getState(this)
  },

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

  async remove() {}
}

export default Component
