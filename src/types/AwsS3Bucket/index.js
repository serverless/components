import { get, isString } from '@serverless/utils'
import { createBucket, deleteBucket } from './utils'

const DEPLOY = 'deploy'
const REPLACE = 'replace'

const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    construct(inputs, context) {
      this.bucketName = inputs.bucketName
      this.provider = inputs.provider || context.get('provider')
    }

    // hydrate(state, context) {
    //   super.hydrate(state, context)
    //   this.bucketName = state.bucketName || this.bucketName
    // }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return DEPLOY
      }

      if (prevInstance.bucketName !== this.bucketName) {
        return REPLACE
      }
    }

    async deploy(prevInstance, context) {
      context.log(`Creating Bucket: '${get('bucketName', this)}'`)
      await createBucket(this)
      // context.saveState(this, { bucketName: this.bucketName }) // provider?
      // await context.saveState()
    }

    async remove(context) {
      context.log(`Removing Bucket: '${this.bucketName}'`)
      await deleteBucket(this)
    }

    async updateS3Config({ event, filter, function: func }) {
      await this.deploy({ event, filter, function: func })
    }

    async deploySource(subscription) {
      const config = subscription.getConfig()
      const sinkConfig = subscription.getSinkConfig()

      if (sinkConfig.protocol === 'AwsLambdaFunction') {
        await this.updateS3Configuration({
          event: config.event,
          filter: config.filter,
          function: sinkConfig.uri // the Lambda arn
        })
      } else if (sinkConfig.protocol === 'AwsSNSTopic') {
        await this.updateS3Configuration({
          event: config.event,
          filter: config.filter,
          topic: sinkConfig.uri // the SNS Topic arn
        })
      }
    }

    getSourceConfig() {
      return {
        uri: this.arn
      }
    }
  }

export default AwsS3Bucket
