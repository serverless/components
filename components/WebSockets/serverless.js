const aws = require('aws-sdk')
const { pick, mergeDeepRight, not } = require('../../src/utils')
const {
  getApiId,
  createApi,
  updateApi,
  createIntegration,
  getRoutes,
  createRoute,
  removeRoutes,
  createDeployment,
  removeApi,
  getWebsocketUrl
} = require('./utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

let outputs = ['name', 'deploymentStage', 'description', 'routeSelectionExpression', 'routes', 'id', 'url']

const defaults = {
  name: 'serverless',
  deploymentStage: 'dev',
  description: 'Serverless WebSockets',
  routeSelectionExpression: '$request.body.action',
  routes: {}, // key (route): value (lambda arn)
  region: 'us-east-1'
}

class WebSockets extends Component {
  async default(inputs = {}) {

    const config = mergeDeepRight(defaults, inputs)
    const apig2 = new aws.ApiGatewayV2({ region: config.region, credentials: this.context.credentials.aws })
    const lambda = new aws.Lambda({ region: config.region, credentials: this.context.credentials.aws })

    this.cli.status(`Deploying`)

    config.id = await getApiId({ apig2, id: config.id || this.state.id }) // validate with provider

    const definedRoutes = Object.keys(config.routes || {})
    const providerRoutes = await getRoutes({ apig2, id: config.id })

    if (!config.id) {
      this.cli.status(`Creating`)
      config.id = await createApi({ apig2, ...config })
    } else {
      this.cli.status(`Updating`)
      await updateApi({ apig2, ...config })
    }

    const routesToDeploy = definedRoutes.filter((route) => not(providerRoutes.includes(route)))
    const routesToRemove = providerRoutes.filter((route) => not(definedRoutes.includes(route)))

    await Promise.all(
      routesToDeploy.map(async (route) => {
        const arn = config.routes[route]
        const integrationId = await createIntegration({ apig2, lambda, id: config.id, arn })
        await createRoute({ apig2, id: config.id, integrationId, route })
      })
    )

    // remove routes that don't exist in inputs
    await removeRoutes({ apig2, id: config.id, routes: routesToRemove })

    // deploy the API
    await createDeployment({ apig2, id: config.id, deploymentStage: this.context.stage })

    config.url = getWebsocketUrl({ id: config.id, region: config.region, deploymentStage: this.context.stage })

    // if the user has changed the id,
    // remove the previous API
    if (this.state.id && this.state.id !== config.id) {
      this.cli.status(`Replacing`)
      await removeApi({ apig2, id: config.id })
    }

    this.state.id = config.id
    this.state.url = config.url
    await this.save()

    outputs = pick(outputs, config)
    this.cli.outputs(outputs)
    return outputs
  }

  async remove(inputs = {}) {
    const config = { ...defaults, ...inputs }
    config.id = config.id || this.state.id
    const apig2 = new aws.ApiGatewayV2({ region: config.region, credentials: this.context.credentials.aws })

    this.cli.status(`Removing`)

    if (config.id) {
      await removeApi({ apig2, id: config.id })
    }

    this.state = {}
    await this.save()

    return {}
  }
}

module.exports = WebSockets
