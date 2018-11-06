import { getSwaggerDefinition, generateUrl, generateUrls } from './utils'
import {
  append,
  equals,
  get,
  has,
  or,
  resolve,
  reduce,
  resolvable,
  pick,
  keys,
  not
} from '@serverless/utils'

const deleteApi = async (APIGateway, params) => {
  const { id } = params

  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    url: null,
    urls: null
  }
  return outputs
}

const createApi = async (APIGateway, params, region = 'us-east-1') => {
  const { apiName, role, routes } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(apiName, roleArn, routes, region)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: res.id,
    stageName: 'dev'
  }).promise()

  const baseUrl = generateUrl(res.id, region)
  const urls = generateUrls(routes, res.id, region)

  const outputs = {
    id: res.id,
    baseUrl,
    urls
  }
  return outputs
}

const updateApi = async (APIGateway, params, region = 'us-east-1') => {
  const { apiName, role, routes, id } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(apiName, roleArn, routes, region)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: id,
    stageName: 'dev'
  }).promise()

  const baseUrl = generateUrl(id, region)
  const urls = generateUrls(routes, id, region)

  const outputs = {
    id,
    baseUrl,
    urls
  }
  return outputs
}

const AwsApiGateway = function(SuperClass) {
  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      this.provider = resolvable(() => or(inputs.provider, context.get('provider')))
      this.apiName = resolvable(() => or(inputs.apiName, `apig-${this.instanceId}`))
      this.role = inputs.role
      this.routes = inputs.routes
    }

    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.id = get('id', prevInstance)
      this.baseUrl = get('baseUrl', prevInstance)
      this.urls = get('urls', prevInstance)
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }
      const inputs = {
        apiName: resolve(or(this.apiName, `apig-${this.instanceId}`)),
        role: resolve(this.role),
        routes: resolve(this.routes)
      }
      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(inputs, prevInputs))
      if (
        not(equals(prevInstance.apiName, inputs.apiName)) ||
        not(equals(prevInstance.role, inputs.role))
      ) {
        return 'replace'
      } else if (configChanged || not(equals(prevInstance.routes, inputs.routes))) {
        return 'deploy'
      }

      return undefined
    }

    async define() {
      const childComponents = reduce(
        (pathAcc, pathObj) => {
          if (!resolve(pathObj)) {
            return pathAcc
          }
          return reduce(
            (methodAcc, methodObject) => {
              if (!resolve(methodObject)) {
                return pathAcc
              }
              if (has('function', methodObject)) {
                methodAcc = append(get('function', methodObject), methodAcc)
              }
              if (has('authorizer.function', methodObject)) {
                methodAcc = append(get('authorizer.function', methodObject), methodAcc)
              }
              return methodAcc
            },
            pathAcc,
            pathObj
          )
        },
        [],
        or(get('inputs.routes', this), {})
      )

      return childComponents
    }

    async deploy(prevInstance, context) {
      const aws = this.provider.getSdk()
      const APIGateway = new aws.APIGateway()
      const noChanges =
        prevInstance &&
        resolve(this.apiName) === prevInstance.apiName &&
        (resolve(this.role) &&
          prevInstance.role &&
          resolve(this.role.arn) === prevInstance.role.arn) &&
        equals(resolve(this.routes), prevInstance.routes)

      let outputs
      if (noChanges) {
        outputs = prevInstance
      } else if (!prevInstance || (resolve(this.apiName) && !prevInstance.apiName)) {
        context.log(`Creating API Gateway: "${this.apiName}"`)
        outputs = await createApi(APIGateway, this, this.provider.region)
      } else {
        context.log(`Updating API Gateway: "${this.apiName}"`)
        outputs = await updateApi(
          APIGateway,
          {
            ...this,
            id: prevInstance.id,
            baseUrl: prevInstance.baseUrl
          },
          this.inputs.provider.region
        )
      }
      Object.assign(this, outputs)
    }

    async remove(context) {
      const aws = this.inputs.provider.getSdk()
      const APIGateway = new aws.APIGateway()

      try {
        context.log(`Removing API Gateway: "${this.apiName}"`)
        await deleteApi(APIGateway, { apiName: this.apiName, id: this.id })
      } catch (e) {
        if (!e.message.includes('Invalid REST API identifier specified')) {
          throw e
        }
      }
    }
  }
}

export default AwsApiGateway
