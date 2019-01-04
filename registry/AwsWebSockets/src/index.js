import {
  getApi,
  getRoutes,
  createApi,
  createIntegration,
  createRoute,
  removeRoutes,
  createDeployment,
  removeApi,
  getWebsocketUrl
} from './utils'

import { resolve, reduce, map, all, isEmpty, filter, keys, not, get } from '@serverless/utils'

const AwsWebSockets = (SuperClass) =>
  class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)
      // this needs to be in the constructor because
      // we can't reference variables as defaults atm
      this.apiName = inputs.apiName || `websocket-${this.instanceId}`
    }

    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.apiId = get('apiId', prevInstance)
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)
      const AWS = provider.getSdk()
      const APIG2 = new AWS.ApiGatewayV2()

      // get & set apiId
      this.apiId = await getApi({ APIG2, apiName: this.apiName })

      const { apiId } = this

      if (!apiId) {
        return 'removed'
      }

      // set existing routes
      this.routes = await getRoutes({ APIG2, apiId })
    }

    async shouldDeploy(prevInstance) {
      // figure out which routes to deploy
      const providerRoutes = prevInstance ? prevInstance.routes || [] : []
      const slsRoutes = keys(this.routes || {})

      this.routesToDeploy = filter((route) => not(providerRoutes.includes(route)), slsRoutes)
      this.routesToRemove = filter((route) => not(slsRoutes.includes(route)), providerRoutes)

      if (prevInstance && prevInstance.apiName !== this.apiName) {
        return 'replace'
      } else if (
        !prevInstance ||
        !prevInstance.apiId ||
        !isEmpty(this.routesToDeploy) ||
        !isEmpty(this.routesToRemove)
      ) {
        return 'deploy'
      }
    }

    async deploy(prevInstance, context) {
      const { provider, apiName, stage, routeSelectionExpression, routes } = this
      const AWS = provider.getSdk()
      const APIG2 = new AWS.ApiGatewayV2()
      const Lambda = new AWS.Lambda()

      context.log(`Deploying WebSockets API named "${apiName}"...`)

      // create the websocket api if it doesn't exist
      if (prevInstance && prevInstance.apiId) {
        this.apiId = prevInstance.apiId
      } else {
        this.apiId = await createApi({ APIG2, apiName, routeSelectionExpression })
      }

      const { apiId } = this

      // deploy routes that don't exist in provider
      await all(
        map(async (route) => {
          const arn = routes[route].getId()
          const integrationId = await createIntegration({ APIG2, Lambda, apiId, arn })
          await createRoute({ APIG2, apiId, integrationId, route })
        }, this.routesToDeploy)
      )

      // remove routes that don't exist in serverless.yml
      await removeRoutes({ APIG2, apiId, routes: this.routesToRemove })

      // deploy the API
      await createDeployment({ APIG2, apiId, stage })

      context.log(`WebSockets API named "${apiName}" with ID "${apiId}" has been deployed.`)
      context.log(`  URL: ${getWebsocketUrl({ apiId, region: provider.region, stage })}`)
    }

    async remove(context) {
      const { provider, apiName, apiId } = this
      const AWS = provider.getSdk()
      const APIG2 = new AWS.ApiGatewayV2()

      context.log(`Removing WebSockets API named "${apiName}" with ID "${apiId}"`)

      await removeApi({ APIG2, apiId })
    }

    async info() {
      const { provider, apiName, apiId, stage, routes } = this
      let data = {
        baseUrl: getWebsocketUrl({ apiId, region: provider.region, stage }),
        routes: {}
      }

      data = reduce(
        (accum, route) => {
          accum.routes[route] = `${getWebsocketUrl({
            apiId,
            region: provider.region,
            stage
          })}${route}`
          return accum
        },
        data,
        keys(routes)
      )

      return {
        title: apiName,
        type: this.name,
        data
      }
    }
  }

export default AwsWebSockets
