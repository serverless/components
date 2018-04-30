const { is, isEmpty } = require('ramda')
const generateContext = require('./generateContext')
const compareInputsToState = require('./compareInputsToState')
const resolvePostExecutionVars = require('../variables/resolvePostExecutionVars')
const diffValues = require('./diffs')
const { getInputs, getState } = require('../state')

const executeComponent = async (
  componentId,
  components,
  stateFile,
  archive,
  command,
  options,
  rollback = false
) => {
  const component = components[componentId]
  component.inputs = resolvePostExecutionVars(component.inputs, components)

  if (rollback) {
    command = 'rollback'
    stateFile[componentId] = archive[componentId]
  } else if (command === 'remove') {
    component.inputs = getInputs(stateFile, componentId)
  }

  const context = generateContext(components, component, stateFile, archive, options, command)

  if (command === 'remove') {
    if (isEmpty(context.state)) {
      return component
    }
  }

  let retainState = false
  const fns = component.fns

  /* Handle deploy command */
  const hasDeployFunction = fns.deploy && is(Function, fns.deploy)
  const hasCreateFunction = fns.Create && is(Function, fns.Create)
  const hasDeleteFunction = fns.Delete && is(Function, fns.Delete)
  const hasUpdateFunction = fns.Update && is(Function, fns.Update)
  const hasRequiredMethods = hasDeployFunction || hasCreateFunction || hasDeleteFunction || hasUpdateFunction // eslint-disable-line
  if (command === 'deploy' && hasRequiredMethods) {
    const deployFunction = (hasDeployFunction) ? fns.deploy : defaultDeploy
    try {
      component.outputs = (await deployFunction(component.inputs, context, component)) || {}
    } catch (e) {
      if (command === 'remove' && e.code === 'RETAIN_STATE') {
        retainState = true
      } else {
        throw e
      }
    }
    component.executed = true
  }

  /* Handle remove command */
  const hasRemoveFunction = fns.remove && is(Function, fns.remove)
  const hasRemoveMethods = hasDeleteFunction || hasRemoveFunction
  if (command === 'remove' && hasRemoveMethods) {
    const removeFunction = (hasRemoveFunction) ? fns.remove : defaultRemove
    try {
      component.outputs = (await removeFunction(component.inputs, context, component)) || {}
    } catch (e) {
      if (command === 'remove' && e.code === 'RETAIN_STATE') {
        retainState = true
      } else {
        throw e
      }
    }
    component.executed = true
  }

  component.state = getState(stateFile, component.id)

  component.promise.resolve(component)

  if (command === 'remove' && !retainState) {
    stateFile[componentId] = {
      type: component.type,
      state: {}
    }
  }

  return component
}

async function defaultRemove(inputs, context, component) {
  const fns = component.fns
  // const inputTypes = component.inputTypes
  // const componentData = compareInputsToState(inputs, context.state)
  // console.log('component diff data', componentData)
  // const inputsChanged = !componentData.isEqual
  // console.log('inputs changed', inputsChanged)
  const hasDeleteFunction = fns.Delete && is(Function, fns.Delete)

  if (!hasDeleteFunction) {
    throw new Error(`${context.type} has no delete function exported from file`)
  }

  context.log(`${context.type}: ○ Removing resource "${context.type}"`)
  const deleteOutputs = await fns.Delete(inputs, context)
  context.log(`${context.type}: ✓ Finished Removing resource "${context.type}"`)
  // Then Save state
  context.saveState()
  return deleteOutputs
}

async function defaultDeploy(inputs, context, component) {
  const fns = component.fns
  const inputTypes = component.inputTypes

  const componentData = compareInputsToState(inputs, context.state)
  // console.log('component diff data', componentData)
  const inputsChanged = !componentData.isEqual
  // console.log('inputs changed', inputsChanged)

  const defaultOutputs = { ...inputs, ...context.state }

  const hasCreateFunction = fns.Create && is(Function, fns.Create)
  const hasDeleteFunction = fns.Delete && is(Function, fns.Delete)
  const hasUpdateFunction = fns.Update && is(Function, fns.Update)

  if (!hasCreateFunction) {
    throw new Error(`${context.type} has no create function exported from file`)
  }
  if (!hasDeleteFunction) {
    throw new Error(`${context.type} has no delete function exported from file`)
  }
  if (!hasUpdateFunction) {
    throw new Error(`${context.type} has no update function exported from file`)
  }

  /* No state found, run create flow */
  if (!componentData.hasState) {
    context.log(`${context.type}: ○ Creating resource "${context.type}"`)
    const creationOutputs = await fns.Create(inputs, context)
    context.log(`${context.type}: ✓ Finished Created resource "${context.type}"`)
    // Then Save state
    const createState = { ...inputs, ...creationOutputs }
    context.saveState(createState)
    return createState
  }

  /* Has state, run update flow if inputsChanged */
  if (inputsChanged) {
    context.log(`${context.type}: ○ Updating`)
    /* Get critical values from inputTypes */
    const criticalValues = Object.keys(inputTypes).filter((inputKey) => {
      const inputData = inputTypes[inputKey]
      return inputData.critical
    })
    // console.log('criticalValues', criticalValues)

    /* Then check if a critical value has changed */
    const criticalValueChanged = criticalValues.some((r) => { // eslint-disable-line
      return componentData.keys.includes(r)
    })
    // console.log('criticalValueChanged', criticalValueChanged)

    // Log out diffs
    componentData.keys.forEach((item) => {
      const newInput = componentData.diffs[item].inputs
      const currentState = componentData.diffs[item].state
      const diff = diffValues(currentState, newInput)
      if (diff) {
        context.log(`${context.type}: Property "${item}" changed`)
        context.log(`${diff}\n`)
        //  from '${currentState}' to '${newInput}'
      }
    })

    /* If critical value change. Run delete and then create */
    if (criticalValueChanged) {
      context.log(`${context.type}: ○ Running Critical Update for "${context.type}"`)
      context.log(`${context.type}: ○ Removing old "${context.type}" resource`)
      await fns.Delete(inputs, context)
      context.log(`${context.type}: ✓ Removed old "${context.type}" resource`)
      // Then create new webhook at new repo
      context.log(`${context.type}: ○ Creating new "${context.type}" resource`)
      const creationOutputs = await fns.Create(inputs, context)
      context.log(`${context.type}: ✓ Created new "${context.type}" resource`)
      // Save state
      const createState = { ...inputs, ...creationOutputs }
      context.saveState(createState)
      context.log(`${context.type}: ✓ Critical Update Complete for "${context.type}"`)
      return createState
    }
    /* no critical value change. Run normal update */
    context.log(`${context.type}: ○ Running Update for "${context.type}"`)
    const updateOutputs = await fns.Update(inputs, context)
    // Save state
    const updateState = { ...inputs, ...updateOutputs }
    context.saveState(updateState)
    context.log(`${context.type}: ✓ Update Complete for "${context.type}"`)
    return updateState
  }
  context.log(`${context.type}: No changes in ${context.type}. Skipping updates`)
  // NoOp. Return default
  return defaultOutputs
}

module.exports = executeComponent
