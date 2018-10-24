import { getSwaggerDefinition, generateUrl, generateUrls } from './utils'
import { equals, resolve, reduce } from '@serverless/utils'

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

const createApi = async (APIGateway, params) => {
  const { name, role, routes } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(name, roleArn, routes)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: res.id,
    stageName: 'dev'
  }).promise()

  const url = generateUrl(res.id)
  const urls = generateUrls(routes, res.id)

  const outputs = {
    id: res.id,
    url,
    urls
  }
  return outputs
}

const updateApi = async (APIGateway, params) => {
  const { name, role, routes, id } = params
  const roleArn = role.arn

  const swagger = getSwaggerDefinition(name, roleArn, routes)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({
    restApiId: id,
    stageName: 'dev'
  }).promise()

  const url = generateUrl(id)
  const urls = generateUrls(routes, id)

  const outputs = {
    id,
    url,
    urls
  }
  return outputs
}

module.exports = function(SuperClass) {
  return class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.inputs = inputs
    }

    async define() {
      const childComponents = reduce(
        reduce((pathAcc, methodObject) => {
          if (methodObject.function) {
            pathAcc.push(resolve(methodObject.function))
          }
          if (methodObject.authorizer && methodObject.authorizer.function) {
            pathAcc.push(resolve(methodObject.authorizer.function))
          }
          return pathAcc
        }),
        [],
        this.inputs.routes
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
        outputs = await createApi(APIGateway, inputs)
      } else {
        context.log(`Updating API Gateway: "${inputs.name}"`)
        outputs = await updateApi(APIGateway, {
          ...inputs,
          id: state.id,
          url: state.url
        })
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
