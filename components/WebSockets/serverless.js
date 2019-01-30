const aws = require('aws-sdk')
const { pick, mergeDeep, filter, keys, not, map, all } = require('../../src/utils')

const Component = require('../Component/serverless')

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

const outputs = ['name', 'stage', 'description', 'routeSelectionExpression', 'routes', 'id', 'url']

const defaults = {
  name: 'serverless',
  stage: 'dev',
  description: 'Serverless WebSockets',
  routeSelectionExpression: '$request.body.action',
  routes: {
    // todo validation?
    $connect: '',
    $disconnect: '',
    $default: ''
  },
  region: 'us-east-1'
}

class WebSockets extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    const apig2 = new aws.ApiGatewayV2()
    const lambda = new aws.Lambda()

    config.id = await getApiId({ apig2, name: config.name })

    const definedRoutes = keys(config.routes || {})
    const providerRoutes = await getRoutes({ apig2, id: config.id })

    if (!config.id) {
      this.cli.status(`Creating WebSockets`)

      config.id = await createApi({
        apig2,
        name: config.name,
        description: config.description,
        routeSelectionExpression: config.routeSelectionExpression
      })
    } else {
      this.cli.status(`Updating WebSockets`)

      await updateApi({
        apig2,
        id: config.id,
        description: config.description,
        routeSelectionExpression: config.routeSelectionExpression
      })
    }

    const routesToDeploy = filter((route) => not(providerRoutes.includes(route)), definedRoutes)
    const routesToRemove = filter((route) => not(definedRoutes.includes(route)), providerRoutes)

    // deploy defined routes that does not exist in provider
    await all(
      map(async (route) => {
        const arn = config.routes[route]
        const integrationId = await createIntegration({ apig2, lambda, id: config.id, arn })
        await createRoute({ apig2, id: config.id, integrationId, route })
      }, routesToDeploy)
    )

    // remove routes that don't exist in inputs
    await removeRoutes({ apig2, id: config.id, routes: routesToRemove })

    // deploy the API
    await createDeployment({ apig2, id: config.id, stage: config.stage })

    config.url = getWebsocketUrl({ id: config.id, region: config.region, stage: config.stage })

    this.state.name = config.name
    this.state.id = config.id
    this.state.url = config.url
    this.save()

    this.cli.success(`WebSockets Deployed`)

    this.cli.log('')
    this.cli.output('Name', `       ${config.name}`)
    this.cli.output('ID', `         ${config.id}`)
    this.cli.output('Stage', `      ${config.stage}`)
    this.cli.output('Expression', ` ${config.routeSelectionExpression}`)
    this.cli.output('URL', `        ${config.url}`)
    this.cli.output('Routes', '')
    keys(config.routes).forEach((route) => this.cli.log(`  - ${route}`))

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    // todo remove by id from state
    const config = { ...defaults, ...inputs }
    config.name = inputs.name || this.state.name
    const apig2 = new aws.ApiGatewayV2()

    config.id = await getApiId({ apig2, name: config.name })

    if (config.id) {
      this.cli.status(`Removing WebSockets`)
      await removeApi({ apig2, id: config.id })
    }

    this.state = {}
    this.save()

    this.cli.success(`WebSockets Removed`)

    return pick(outputs, config)
  }
}

module.exports = WebSockets
