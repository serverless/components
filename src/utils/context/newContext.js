import { get, pick, set } from '@serverless/utils'
import { propOr } from 'ramda' // Eslam todo: move to @serverless/utils
import loadApp from '../app/loadApp'
import defineComponent from '../component/defineComponent'
import defineComponentFromState from '../component/defineComponentFromState'
import generateInstanceId from '../component/generateInstanceId'
import { DEFAULT_PLUGINS } from '../constants'
import createDeployment from '../deployment/createDeployment'
import loadDeployment from '../deployment/loadDeployment'
import loadPreviousDeployment from '../deployment/loadPreviousDeployment'
import log from '../logging/log'
import loadPlugins from '../plugin/loadPlugins'
import loadProject from '../project/loadProject'
import getState from '../state/getState'
import saveState from '../state/saveState'
import loadState from '../state/loadState'
import construct from '../type/construct'
import loadType from '../type/loadType'

const newContext = (props) => {
  const context = pick(
    [
      'app',
      'cache',
      'cwd',
      'data',
      'deployment',
      'options',
      'overrides',
      'plugins',
      'project',
      'registry',
      'root',
      'state',
      'Type'
    ],
    props
  )
  const overrides = context.overrides || {}
  const finalContext = {
    ...context,
    construct: (type, inputs) => construct(type, inputs, finalContext),
    createDeployment: async (previousDeployment) => {
      const { app } = finalContext
      if (!app) {
        throw new Error(
          'createDeployment method expects context to have an app loaded. You must first call loadApp on context before calling createDeployment'
        )
      }
      const deployment = await createDeployment(previousDeployment, app)

      const nextContext = newContext({
        ...context,
        deployment
      })
      return nextContext.loadState()
    },
    defineComponent: (component) => defineComponent(component, finalContext),
    defineComponentFromState: (component) => defineComponentFromState(component, finalContext),
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
      const deployment = await loadPreviousDeployment(app)
      if (!deployment) {
        return finalContext
      }
      const nextContext = newContext({
        ...context,
        deployment
      })
      return nextContext.loadState()
    },
    loadProject: async () => {
      const projectPath = propOr(finalContext.cwd, 'project', finalContext.options)
      const project = await loadProject(projectPath, finalContext)
      return newContext({
        ...context,
        project
      })
    },
    loadState: async () => {
      const { deployment } = finalContext
      if (!deployment) {
        throw new Error(
          'loadState method expects context to have a deployment loaded. You must first call loadDeployment, loadPreviousDeployment or createDeployment on context before calling loadState'
        )
      }
      const state = await loadState(deployment)
      return newContext({
        ...context,
        state
      })
    },
    loadType: (...args) => loadType(...args, finalContext),
    log,
    merge: (value) =>
      newContext({
        ...context,
        ...value
      }),
    saveState: (query, state) => {
      const { deployment } = finalContext
      if (!deployment) {
        throw new Error(
          'saveState method expects context to have a deployment loaded. You must first call loadDeployment, loadPreviousDeployment or createDeployment on context before calling saveState'
        )
      }
      return saveState(deployment, state)
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
