import { getSwaggerDefinition, generateUrl, generateUrls } from './utils'
import { append, equals, get, has, or, resolve, reduce } from '@serverless/utils'

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
  const { name, role, routes } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(name, roleArn, routes, region)
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
  const { name, role, routes, id } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(name, roleArn, routes, region)
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
      this.inputs = inputs
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
      const inputs = this.inputs
      const aws = inputs.provider.getSdk()
      const APIGateway = new aws.APIGateway()
      const state = prevInstance || {}
      const noChanges =
        inputs.name === state.name &&
        (inputs.role && state.role && inputs.role.arn === state.role.arn) &&
        equals(inputs.routes, state.routes)

      let outputs
      if (noChanges) {
        outputs = state
      } else if (inputs.name && !state.name) {
        context.log(`Creating API Gateway: "${inputs.name}"`)
        outputs = await createApi(APIGateway, inputs, this.inputs.provider.region)
      } else {
        context.log(`Updating API Gateway: "${inputs.name}"`)
        outputs = await updateApi(
          APIGateway,
          {
            ...inputs,
            id: state.id,
            baseUrl: state.baseUrl
          },
          this.inputs.provider.region
        )
      }
      // context.saveState(this, { ...inputs, ...outputs })
      return Object.assign(this, outputs)
    }

    async remove(context) {
      const aws = this.inputs.provider.getSdk()
      const APIGateway = new aws.APIGateway()

      try {
        context.log(`Removing API Gateway: "${this.name}"`)
        await deleteApi(APIGateway, { name: this.name, id: this.id })
      } catch (e) {
        if (!e.message.includes('Invalid REST API identifier specified')) {
          throw e
        }
      }
    }
  }
}

export default AwsApiGateway
