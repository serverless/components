import { get, isUndefined, pick, propOr, set } from '@serverless/utils'
import loadApp from '../app/loadApp'
import defineComponent from '../component/defineComponent'
import defineComponentFromState from '../component/defineComponentFromState'
import generateInstanceId from '../component/generateInstanceId'
// import setKey from '../component/setKey'
import { DEFAULT_PLUGINS } from '../constants'
import { log, debug, warn, error, info } from '../logging'
import createDeployment from '../deployment/createDeployment'
import createRemovalDeployment from '../deployment/createRemovalDeployment'
import loadDeployment from '../deployment/loadDeployment'
import loadPreviousDeployment from '../deployment/loadPreviousDeployment'
import loadPlugins from '../plugin/loadPlugins'
import loadProject from '../project/loadProject'
import deserialize from '../serialize/deserialize'
import serialize from '../serialize/serialize'
import getState from '../state/getState'
import saveState from '../state/saveState'
import loadState from '../state/loadState'
import construct from '../type/construct'
import create from '../type/create'
import defType from '../type/defType'
import loadType from '../type/loadType'
import walkReduceComponentChildrenDepthFirst from '../component/walkReduceComponentChildrenDepthFirst'

const newContext = (props) => {
  const context = pick(
    [
      'app',
      'cache',
      'cwd',
      'data',
      'deployment',
      'instance',
      'options',
      'overrides',
      'plugins',
      'previousDeployment',
      'previousInstance',
      'project',
      'registry',
      'root',
      'state',
      'symbolMap',
      'Type'
    ],
    props
  )
  const overrides = context.overrides || {}
  const finalContext = {
    ...context,
    log: (...args) => log(finalContext, ...args),
    debug: (...args) => debug(finalContext, ...args),
    console: {
      log: (...args) => log(finalContext, ...args),
      debug: (...args) => debug(finalContext, ...args),
      warn: (...args) => warn(finalContext, ...args),
      error: (...args) => error(finalContext, ...args),
      info: (...args) => info(finalContext, ...args)
    },
    construct: (type, inputs = {}) => construct(type, inputs, finalContext),
    create,
    createDeployment: async () => {
      const { app, previousDeployment } = finalContext
      if (!app) {
        throw new Error(
          'createDeployment method expects context to have an app loaded. You must first call loadApp on context before calling createDeployment'
        )
      }
      if (isUndefined(previousDeployment)) {
        throw new Error(
          'createDeployment method expects context to have an previousDeployment loaded. You must first call loadPreviousDeployment on context before calling createDeployment'
        )
      }
      const deployment = await createDeployment(previousDeployment, app)

      const nextContext = newContext({
        ...context,
        deployment
      })
      return nextContext.loadState()
    },
    createRemovalDeployment: async () => {
      const { app, previousDeployment } = finalContext
      if (!app) {
        throw new Error(
          'createDeployment method expects context to have an app loaded. You must first call loadApp on context before calling createDeployment'
        )
      }
      if (isUndefined(previousDeployment)) {
        throw new Error(
          'createDeployment method expects context to have an previousDeployment loaded. You must first call loadPreviousDeployment on context before calling createDeployment'
        )
      }
      const deployment = await createRemovalDeployment(previousDeployment, app)

      const nextContext = newContext({
        ...context,
        deployment
      })
      return nextContext.loadState()
    },
    createInstance: async () => {
      const { project, state } = finalContext
      if (!project) {
        throw new Error(
          'createInstance method expects context to have a project loaded. You must first call loadProject on context before calling createInstance'
        )
      }
      let instance = await finalContext.construct(project.Type, {})
      // instance = setKey('$', instance)

      const stateInstance = await deserialize(state.instance, finalContext)

      // NOTE BRN: instance gets defined based on serverless.yml and type code
      instance = await finalContext.defineComponent(instance, stateInstance)

      return newContext({
        ...context,
        instance
      })
    },
    defineComponent: (component, state) => defineComponent(component, state, finalContext),
    defineComponentFromState: (component) => defineComponentFromState(component, finalContext),
    define: (def) => defType(def, finalContext),
    generateInstanceId: () => {
      const { app } = finalContext
      if (!app) {
        throw new Error(
          'generateInstanceId method expects context to have an app loaded. You must first call loadApp on context before calling generateInstanceId'
        )
      }
      return generateInstanceId(app.id)
    },
    get: (selector) => get(selector, finalContext.data),
    getState: (query) => getState(query, finalContext.state),
    loadApp: async () => {
      let { stage } = finalContext.options

      // TODO BRN: Remove this after we add default support to options
      if (!stage) {
        stage = 'prod'
      }
      const { project } = finalContext
      if (!project) {
        throw new Error(
          'loadApp method expects context to have a project loaded. You must first call loadProject on context before calling loadApp'
        )
      }

      const appId = `${project.name}-${stage}`
      const app = await loadApp(appId, project)
      return newContext({
        ...context,
        app
      })
    },
    loadDeployment: async (deploymentId) => {
      const { app } = finalContext
      if (!app) {
        throw new Error(
          'loadDeployment method expects context to have an app loaded. You must first call loadApp on context before calling loadDeployment'
        )
      }
      const deployment = await loadDeployment(deploymentId, app)
      if (!deployment) {
        return finalContext
      }
      const nextContext = newContext({
        ...context,
        deployment
      })
      return nextContext.loadState()
    },
    loadInstance: async () => {
      const { state } = finalContext
      if (!state) {
        throw new Error(
          'loadInstance method expects context to have state loaded. You must first call loadState on context before calling loadInstance'
        )
      }
      let { instance } = state
      instance = await deserialize(instance, finalContext)

      // TODO BRN: Add hydrate step for instance

      return newContext({
        ...context,
        instance
      })
    },
    loadPreviousInstance: async () => {
      const { state } = finalContext
      if (!state) {
        throw new Error(
          'loadPreviousInstance method expects context to have state loaded. You must first call loadState on context before calling loadPreviousInstance'
        )
      }
      let { previousInstance } = state
      previousInstance = await deserialize(previousInstance, finalContext)

      // TODO BRN: Add hydrate step for previous instance

      // make sure we sync the previous instance (if any)
      // with the actual state on the provider
      if (previousInstance) {
        previousInstance = await walkReduceComponentChildrenDepthFirst(
          async (accum, currentInstance) => {
            currentInstance.status = await currentInstance.sync(finalContext)
            return accum
          },
          previousInstance,
          previousInstance
        )
      }
      return newContext({
        ...context,
        previousInstance
      })
    },
    loadPlugins: async () => {
      // TODO BRN: Allow for the plugins to be configured via options or config
      const plugins = await loadPlugins(DEFAULT_PLUGINS, finalContext)
      return newContext({
        ...context,
        plugins
      })
    },
    loadPreviousDeployment: async () => {
      const { app } = finalContext
      if (!app) {
        throw new Error(
          'loadPreviousDeployment method expects context to have an app loaded. You must first call loadApp on context before calling loadPreviousDeployment'
        )
      }
      const previousDeployment = await loadPreviousDeployment(app)
      return newContext({
        ...context,
        previousDeployment
      })
    },
    loadProject: async () => {
      const projectPath = propOr(finalContext.cwd, 'project', finalContext.options)
      const project = await loadProject(projectPath, finalContext)
      return newContext({
        ...context,
        project
      })
    },
    loadState: async (deployment) => {
      if (!deployment) {
        deployment = finalContext.deployment || finalContext.previousDeployment
      }
      if (!deployment) {
        throw new Error(
          'loadState method expects context to have a deployment loaded. You must first call loadDeployment, loadPreviousDeployment or createDeployment on context before calling loadState'
        )
      }

      // NOTE BRN: This loads state from the current deployment which should already have state set during the createDeployment step. That step loads the state from the previous deployment and coppies it over as a starting point for the new deployment.
      const state = await loadState(deployment)
      return newContext({
        ...context,
        state
      })
    },
    import: (...args) => loadType(...args, finalContext),
    merge: (value) =>
      newContext({
        ...context,
        ...value
      }),
    saveState: async () => {
      const { deployment, instance, previousInstance } = finalContext
      if (!deployment) {
        throw new Error(
          'saveState method expects context to have a deployment loaded. You must first call loadDeployment or createDeployment on context before calling saveState'
        )
      }
      if (isUndefined(previousInstance)) {
        throw new Error(
          'saveState method expects context to have a previousInstance loaded. You must first call loadPreviousInstance on context before calling saveState'
        )
      }
      if (isUndefined(instance)) {
        throw new Error(
          'saveState method expects context to have an instance loaded. You must first call createInstance or loadInstance on context before calling saveState'
        )
      }
      const state = {
        instance: serialize(instance, finalContext),
        previousInstance: serialize(previousInstance, finalContext)
      }
      await saveState(deployment, state)
      return newContext({
        ...context,
        state
      })
    },
    set: (selector, value) =>
      newContext({
        ...context,
        data: set(selector, value, context.data)
      }),
    ...overrides
  }
  return finalContext
}

export default newContext
