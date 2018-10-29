import { append, get, or, pick, reduce, shallowEquals } from '@serverless/utils'

const DEPLOY = 'deploy'

const Component = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.instanceId = context.generateInstanceId()
    }

    hydrate(state) {
      this.instanceId = get('instanceId', state) || this.instanceId
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

    async info() {
      const children = await reduce(
        async (accum, component) => append(await component.info(), accum),
        [],
        or(this.components, {})
      )
      return {
        title: this.name,
        type: this.extends,
        data: pick(['name', 'license', 'version'], this),
        children
      }
    }

    toString() {
      return `${this['@@key']} ${this.name} {  }`
    }
  }

export default Component
