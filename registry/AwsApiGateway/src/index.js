import { equals, get, resolve, pick, keys, not } from '@serverless/utils'

const AwsApiGateway = function(SuperClass) {
  return class extends SuperClass {
    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.id = get('id', prevInstance)
      this.baseUrl = get('baseUrl', prevInstance)
      this.urls = get('urls', prevInstance)
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)

      // Eslam:
      // unlike functionName and roleName,
      // the user does not set the rest api id
      // so if it is the first deployment, id would
      // be undefined. So it wouldn't make sense to
      // make a request to the provider
      if (resolve(this.id) === undefined) {
        return 'removed'
      }
      const AWS = provider.getSdk()
      const APIGateway = new AWS.APIGateway()

      const params = {
        exportType: 'swagger',

        restApiId: resolve(this.id),
        stageName: resolve(this.stage),
        parameters: {
          extensions: 'integrations'
        }
      }

      try {
        await APIGateway.getExport(params).promise()

        // Eslam:
        // practically in the real world, the exported swagger template object
        // will always be different than the imported one in small unpredictable details
        // imo in this particular case, the sync should only check the existence of the API
        // but not update the swagger template, and instead rely on the local template for idempotency
        // either way, the putRestApi call is really quick and it would be also fine to always update
        //
        // so ignoring this for now...
        // this.swaggerTemplate = JSON.parse(res.body.toString())
      } catch (e) {
        if (e.code === 'NotFoundException') {
          return 'removed'
        }
        throw e
      }
    }

    async shouldDeploy(prevInstance) {
      const inputs = {
        stage: this.stage,
        swaggerTemplate: this.swaggerTemplate
      }
      const prevInputs = prevInstance ? pick(keys(inputs), prevInstance) : {}
      const configChanged = not(equals(inputs, prevInputs))

      // Eslam:
      // interestingly, there's no replace for APIG!
      // because the user cannot change the rest api id
      // he can only change the name, in which case AWS would do the "replace"
      if (!prevInstance || configChanged) {
        return 'deploy'
      }
    }

    async deploy(prevInstance, context) {
      const aws = this.provider.getSdk()
      const APIGateway = new aws.APIGateway()

      const body = Buffer.from(JSON.stringify(this.swaggerTemplate), 'utf8')

      if (prevInstance && prevInstance.id) {
        context.log(`Updating API Gateway: "${this.swaggerTemplate.info.title}"`)
        const res = await APIGateway.putRestApi({
          restApiId: this.id,
          mode: 'overwrite', // important to ensure we actually replace any changed paths/methods
          body
        }).promise()
        this.id = res.id
      } else {
        context.log(`Creating API Gateway: "${this.swaggerTemplate.info.title}"`)
        const res = await APIGateway.importRestApi({
          body
        }).promise()
        this.id = res.id
      }

      await APIGateway.createDeployment({
        restApiId: this.id,
        stageName: this.stage
      }).promise()

      this.baseUrl = `https://${this.id}.execute-api.${this.provider.region}.amazonaws.com/${
        this.stage
      }/`
      this.urls = ((path) => `${this.baseUrl}${path.replace(/^\/+/, '')}`,
      keys(this.swaggerTemplate.paths))
    }

    async remove(context) {
      const aws = this.inputs.provider.getSdk()
      const APIGateway = new aws.APIGateway()

      try {
        context.log(`Removing API Gateway: "${this.swaggerTemplate.info.title}"`)
        await APIGateway.deleteRestApi({
          restApiId: this.id
        }).promise()
      } catch (error) {
        if (error.code !== 'NotFoundException') {
          throw error
        }
      }
    }
  }
}

export default AwsApiGateway
