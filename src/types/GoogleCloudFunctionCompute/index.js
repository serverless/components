const { join } = require('path')
const { convertTimeout, convertRuntime } = require('./utils')

async function GoogleCloudFunctionCompute(SuperClass, superContext) {
  const GoogleCloudFunction = await superContext.loadType('GoogleCloudFunction')

  const defineFunction = async function(func, context) {
    // TODO: remove this once setting `functionName` in the `functions` section is supported
    const name = `func-${+new Date()}`

    // TODO: add support for other runtime shims
    let code = func.code.get()
    if (typeof code === 'string') {
      code = [code]
    }
    // inject shim file
    const shimFilePath = join(__dirname, 'shims', 'shim.js')
    code.push(shimFilePath)

    const inputs = {
      provider: this.provider.get(),
      code,
      // "official" Google Cloud Functions parameters
      name,
      description: func.functionDescription.get(),
      availableMemoryMb: func.memory.get(),
      timeout: convertTimeout(func.timeout.get() || this.timeout.get()),
      runtime: convertRuntime(func.runtime.get() || this.runtime.get()),
      entryPoint: 'shim', // NOTE: Google Cloud Functions don't support dotted handlers
      environmentVariables: {
        ...this.environment.get(),
        ...func.environment.get(),
        SERVERLESS_HANDLER: func.handler.get()
      },
      labels: {
        ...this.tags.get(),
        ...func.tags.get()
      },
      // --------------------------- IMPORTANT ---------------------------
      // we need to set an event trigger here since there's no way to define
      // a Google Cloud Function without an event attached to it.
      // The httpsTrigger is the only event source which doesn't require any
      // additional configuration
      // TODO: replace this according to the config of the Subscription type later on
      httpsTrigger: {}
    }

    return context.construct(GoogleCloudFunction, inputs)
  }

  return {
    defineFunction
  }
}

module.exports = GoogleCloudFunctionCompute
