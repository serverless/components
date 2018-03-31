const path = require('path')
const _ = require('lodash')

// TODO: Validate config
// TODO: Process deployments in parallel
// TODO: Find a better way to instantiate child components

const deploy = async (inputs, context) => {

  /*
  * Defaults
  */

  let i = inputs
  let o = {}
  let g = _.merge({
    prefix: true
  }, inputs.global || {})
  let state = {
    back: {
      functions: {}
    }
  }

  /*
  * Process functions
  * - Loop through functions and deploy
  */

  for (var f in inputs.back) {
    let fn = inputs.back[f]

    // Assemble temporary state
    let fnState = {
      name: (g.prefix ? i.name + '-' + (fn.name || f) : (fn.name || f)),
      code: path.join(process.cwd(), 'app', 'back', fn.code),
      runtime: fn.runtime || g.runtime || 'nodejs6.10',
      memory: fn.memory || g.memory || 512,
      timeout: fn.timeout || g.timeout || 10,
      env: fn.env || g.env || {},
      events: fn.events || {}
    }

    // Make function
    fn = await context.load('aws-lambda', f, {
      name: fnState.name || f,
      handler: fnState.code,
      runtime: fnState.runtime,
      memory: fnState.memory || 512,
      timeout: fnState.timeout || 10,
      env: fnState.env
    })

    // Deploy function
    try {
      fn = await fn.deploy()
    } catch(e) {
      console.log(e)
      return {}
    }

    // Update state
    state.back.functions[f] = fnState
    context.state = _.merge(context.state, state)
  }

  // Save state
  context.saveState(context.state)

  /*
  * Return success
  */

  context.log('')
  context.log('finished')
  context.log('')

  return {}
}

const remove = async (inputs, context) => {

  /*
  *  Defaults
  */

  let state = context.state

  /*
  * Process functions
  * - Loop through functions and remove
  */

  for (var f in state.back.functions) {

    let fn = state.back.functions[f]

    // Make function
    fn = await context.load('aws-lambda', f, {
      name: fn.name || f,
      timeout: fn.timeout,
      memory: fn.memory,
      handler: path.join(process.cwd(), 'app', 'back', fn.code)
    })

    // Remove function
    try {
      fn = await fn.remove()
    } catch(e) {
      console.log(e)
      continue
    }
  }

  return {}
}

module.exports = {
  deploy,
  remove
}
