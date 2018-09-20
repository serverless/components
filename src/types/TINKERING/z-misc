/* eslint-disable */

const Foo = async (SuperClass, context) => {
  const ISource = await context.loadType('ISource')
  const AWSLambdaFunction = await context.loadType('AWSLambdaFunction')

  const type = {
    deploy(instance, context) {
      // ... do deployment
      context.construct(AWSLambdaFunction, { provider: instance.provider })
    }
  }

  type = implement(type, ISource)
  return type
}

export default Foo

// ------------

const Function = {
  deploy() {
    if (satisfies(ISource, someInstance)) {

    }
    instance.compute.deployFunction(arg1, arg2, context)
  }
}

const AWSLambdaCompute = {
  deployFunction(instance: this, arg1, arg2, context) {

  }
}

// ------------

// serverless.yml

name: MyType
extends: Component
implements: ISource, ISink

inputTypes:
  name:
    type: string

props: ${inputs}

const MyType = {
  deploy(instance, context) {
    instance.props.name
  }
}
