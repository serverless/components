import { omit, append, set, get, or, pick, equals, walkReduce } from '@serverless/utils'
import { pickComponentProps } from './utils'

// TODO: move this into @serverless/utils ?!
import isTypeConstruct from '../../../dist/utils/type/isTypeConstruct'
import { isComponent, walkReduceComponentChildren } from '../../../dist/utils/component'

const DEPLOY = 'deploy'

const Component = (SuperClass) =>
  class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)

      // TODO BRN: this is not the best solution, this is causing problems
      this.instanceId = context.generateInstanceId()
      this.components = or(get('components', inputs), this.components, {})
    }

    equals(value) {
      return value.instanceId === this.instanceId
    }

    // sync method is optional
    // the default is that we never check the provider
    // so we return 'unknown' as the status
    sync() {
      return 'unknown'
    }

    hydrate(previousInstance) {
      this.instanceId = or(get('instanceId', previousInstance), this.instanceId)
    }

    async define() {
      return walkReduce(
        (accum, value, pathParts) => {
          if (isTypeConstruct(value) || isComponent(value)) {
            return set(pathParts, value, accum)
          }
          return accum
        },
        {},
        // `parent` is omitted since this value is already resolved and considering it causes infinite loops
        omit(['parent'], this)
      )
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return DEPLOY
      }

      const prevProps = pickComponentProps(prevInstance)
      const nextProps = pickComponentProps(this)

      if (!equals(prevProps, nextProps)) {
        return DEPLOY
      }
    }

    async deploy() {}

    async remove() {}

    async info() {
      const children = await walkReduceComponentChildren(
        async (accum, value) => {
          if (isComponent(value)) {
            const component = value
            return append(await component.info(), accum)
          }
          return accum
        },
        [],
        omit(['parent'], this)
      )
      return {
        title: this.name,
        type: this.name,
        data: pick(['name', 'license', 'version'], this),
        children
      }
    }

    toString() {
      return `${this['@@key']} ${this.name} {  }`
    }
  }

export default Component
