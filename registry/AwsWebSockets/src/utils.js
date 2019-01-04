import { map, all, filter } from '@serverless/utils'

const getApi = async ({ APIG2, apiName }) => {
  const apis = await APIG2.getApis({}).promise()
  const websocketApi = apis.Items.find((api) => api.Name === apiName)
  const apiId = websocketApi ? websocketApi.ApiId : null
  return apiId
}

const createApi = async ({ APIG2, apiName, routeSelectionExpression }) => {
  const params = {
    Name: apiName,
    ProtocolType: 'WEBSOCKET',
    RouteSelectionExpression: routeSelectionExpression
  }

  const api = await APIG2.createApi(params).promise()
  return api.ApiId
}

const createIntegration = async ({ APIG2, Lambda, apiId, arn }) => {
  const functionName = arn.split(':')[6]
  const accountId = arn.split(':')[4]
  const region = arn.split(':')[3]

  const createIntegrationParams = {
    ApiId: apiId,
    IntegrationMethod: 'POST',
    IntegrationType: 'AWS_PROXY',
    IntegrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`
  }

  const integration = await APIG2.createIntegration(createIntegrationParams).promise()

  const addPermissionParams = {
    Action: 'lambda:InvokeFunction',
    FunctionName: arn,
    Principal: 'apigateway.amazonaws.com',
    SourceArn: `arn:aws:execute-api:${region}:${accountId}:${apiId}/*/*`,
    StatementId: `${functionName}-websocket`
  }

  try {
    await Lambda.addPermission(addPermissionParams).promise()
  } catch (e) {
    if (e.code !== 'ResourceConflictException') {
      throw e
    }
  }

  return integration.IntegrationId
}

const getRoutes = async ({ APIG2, apiId }) => {
  const routes = await APIG2.getRoutes({ ApiId: apiId }).promise()
  return routes.Items.map((route) => route.RouteKey)
}

const createRoute = async ({ APIG2, apiId, integrationId, route }) => {
  const params = {
    ApiId: apiId,
    RouteKey: route,
    Target: `integrations/${integrationId}`
  }

  try {
    const res = await APIG2.createRoute(params).promise()
    return res.RouteId
  } catch (e) {
    if (e.code !== 'ConflictException') {
      throw e
    }
  }
}

const removeRoutes = async ({ APIG2, apiId, routes }) => {
  const res = await APIG2.getRoutes({ ApiId: apiId }).promise()

  const routeIds = filter((route) => routes.includes(route.RouteKey), res.Items).map(
    (route) => route.RouteId
  )

  return all(
    map((routeId) => APIG2.deleteRoute({ ApiId: apiId, RouteId: routeId }).promise(), routeIds)
  )
}

const createDeployment = async ({ APIG2, apiId, stage }) => {
  const { DeploymentId } = await APIG2.createDeployment({
    ApiId: apiId
  }).promise()

  const params = {
    ApiId: apiId,
    StageName: stage,
    DeploymentId
  }

  try {
    await APIG2.updateStage(params).promise()
  } catch (e) {
    if (e.code === 'NotFoundException') {
      await APIG2.createStage(params).promise()
    }
  }
}

const removeApi = async ({ APIG2, apiId }) => {
  return APIG2.deleteApi({ ApiId: apiId }).promise()
}

const getWebsocketUrl = ({ apiId, region, stage }) => {
  return `wss://${apiId}.execute-api.${region}.amazonaws.com/${stage}/`
}

export {
  getApi,
  createApi,
  createIntegration,
  getRoutes,
  createRoute,
  removeRoutes,
  createDeployment,
  removeApi,
  getWebsocketUrl
}
