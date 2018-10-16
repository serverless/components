import { shallowEquals } from '@serverless/utils'

const DEPLOY = 'deploy'

const Component = (SuperClass) =>
  class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)
      this.instanceId = context.generateInstanceId()
    }

    hydrate(state) {
      this.instanceId = state.instanceId
    }

    async define() {
      return {
        ...this.components
      }
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance || !shallowEquals(prevInstance, this)) {
        return DEPLOY
      }
    }

    async deploy() {}

    async remove() {}

    toString() {
      return `${this['@@key']} ${this.name} {  }`
    }
  }

export default Component
