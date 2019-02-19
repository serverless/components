const getApiId = async ({ apig2, id }) => {
  if (!id) {
    return null
  }
  // validate provided id still exists in provider...
  try {
    await apig2.getApi({ ApiId: id }).promise()
  } catch (e) {
    if (e.code !== 'NotFoundException') {
      throw e
    }
    return null
  }
  return id
}

const createApi = async ({ apig2, name, description, routeSelectionExpression }) => {
  const params = {
    Name: name,
    Description: description,
    ProtocolType: 'WEBSOCKET',
    RouteSelectionExpression: routeSelectionExpression
  }

  const api = await apig2.createApi(params).promise()
  return api.ApiId
}

const updateApi = async ({ apig2, id, name, description, routeSelectionExpression }) => {
  const params = {
    ApiId: id,
    Name: name,
    Description: description,
    RouteSelectionExpression: routeSelectionExpression
  }

  const api = await apig2.updateApi(params).promise()
  return api.ApiId
}

const createIntegration = async ({ apig2, lambda, id, arn }) => {
  const functionName = arn.split(':')[6]
  const accountId = arn.split(':')[4]
  const region = arn.split(':')[3]

  const createIntegrationParams = {
    ApiId: id,
    IntegrationMethod: 'POST',
    IntegrationType: 'AWS_PROXY',
    IntegrationUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${arn}/invocations`
  }

  const integration = await apig2.createIntegration(createIntegrationParams).promise()

  const addPermissionParams = {
    Action: 'lambda:InvokeFunction',
    FunctionName: arn,
    Principal: 'apigateway.amazonaws.com',
    SourceArn: `arn:aws:execute-api:${region}:${accountId}:${id}/*/*`,
    StatementId: `${functionName}-websocket`
  }

  try {
    await lambda.addPermission(addPermissionParams).promise()
  } catch (e) {
    if (e.code !== 'ResourceConflictException') {
      throw e
    }
  }

  return integration.IntegrationId
}

const getRoutes = async ({ apig2, id }) => {
  if (!id) {
    return []
  }
  const routes = await apig2.getRoutes({ ApiId: id }).promise()
  return routes.Items.map((route) => route.RouteKey)
}

const createRoute = async ({ apig2, id, integrationId, route }) => {
  const params = {
    ApiId: id,
    RouteKey: route,
    Target: `integrations/${integrationId}`
  }

  try {
    const res = await apig2.createRoute(params).promise()
    return res.RouteId
  } catch (e) {
    if (e.code !== 'ConflictException') {
      throw e
    }
  }
}

const removeRoutes = async ({ apig2, id, routes }) => {
  const res = await apig2.getRoutes({ ApiId: id }).promise()

  const routeIds = res.Items.filter((route) => routes.includes(route.RouteKey)).map(
    (route) => route.RouteId
  )
  return Promise.all(
    routeIds.map((routeId) => apig2.deleteRoute({ ApiId: id, RouteId: routeId }).promise())
  )
}

const createDeployment = async ({ apig2, id, deploymentStage }) => {
  const { DeploymentId } = await apig2
    .createDeployment({
      ApiId: id
    })
    .promise()

  const params = {
    ApiId: id,
    StageName: deploymentStage,
    DeploymentId
  }

  try {
    await apig2.updateStage(params).promise()
  } catch (e) {
    if (e.code === 'NotFoundException') {
      await apig2.createStage(params).promise()
    }
  }
}

const removeApi = async ({ apig2, id }) => {
  return apig2.deleteApi({ ApiId: id }).promise()
}

const getWebsocketUrl = ({ id, region, deploymentStage }) => {
  return `wss://${id}.execute-api.${region}.amazonaws.com/${deploymentStage}/`
}

module.exports = {
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
}
