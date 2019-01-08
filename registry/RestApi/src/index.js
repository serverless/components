import { resolve } from '@serverless/utils'
import { flattenRoutes, normalizeRoutes, getSwaggerDefinition } from './utils'
import { newVariable } from '../../../dist/utils/variable'

const RestApi = async function(SuperClass, SuperContext) {
  const AwsIamRole = await SuperContext.import('AwsIamRole')
  const AwsApiGatewayComponent = await SuperContext.import('AwsApiGateway')

  return class extends SuperClass {
    construct(inputs, context) {
      // TODO: update once declarative defaults are supported
      super.construct(inputs, context)
      this.apiName = inputs.apiName || `api-${this.instanceId}`
    }

    async define(context) {
      const provider = resolve(this.provider)
      if (!['AwsApiGateway'].includes(resolve(this.gateway))) {
        throw new Error('Specified "gateway" is not supported.')
      }

      const apiName = resolve(this.apiName)
      const roleName = `${apiName}-iam-role`
      const service = 'apigateway.amazonaws.com'
      const accountId = await provider.getAccountId()

      // eslint does not allow destructuring because this is a reserved word...
      const roleArn = newVariable('${this.children.role.arn}', { this: this })
      const flatRoutes = flattenRoutes(resolve(this.routes))
      const normalizedRoutes = normalizeRoutes(flatRoutes)
      const swaggerTemplate = getSwaggerDefinition(apiName, roleArn, normalizedRoutes, accountId)

      return {
        role: context.construct(AwsIamRole, {
          roleName,
          service,
          provider
        }),
        gateway: context.construct(AwsApiGatewayComponent, {
          provider,
          swaggerTemplate
        })
      }
    }

    async deploy() {
      Object.assign(this, {
        apiName: resolve(this.apiName),
        paths: this.gateway.urls,
        baseUrl: this.gateway.baseUrl,
        gateway: {
          id: this.gateway.id
        }
      })
    }

    async info() {
      const { inputs } = this
      const flatRoutes = {}
      for (const [path, pathObject] of Object.entries(flattenRoutes(inputs.routes))) {
        const newPathObject = { ...pathObject }
        for (const [method, methodObject] of Object.entries(pathObject)) {
          const newMethodObject = { ...methodObject }
          if (methodObject.function) {
            const func = resolve(methodObject.function)
            newMethodObject.function = `${resolve(func.functionName)}`
          }
          if (methodObject.authorizer) {
            const auth = resolve(methodObject.authorizer)
            const authFunc = resolve(auth.function)
            if (authFunc) {
              newMethodObject.authorizer = Object.assign(auth, {
                function: `${resolve(authFunc.functionName)}`
              })
            }
          }
          newPathObject[method] = newMethodObject
        }
        flatRoutes[path] = newPathObject
      }

      return {
        title: this.apiName,
        type: this.name,
        data: { routes: flatRoutes, baseUrl: this.baseUrl }
      }
    }
  }
}

export default RestApi
