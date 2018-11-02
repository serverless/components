import { get, or, pick, resolve, resolvable } from '@serverless/utils'
import { createBucket, deleteBucket } from './utils'

const DEPLOY = 'deploy'
const REPLACE = 'replace'

const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      // NOTE: the bucket name needs to be lower case when auto-generating
      this.bucketName = resolvable(() =>
        or(inputs.bucketName, `bucket-${this.instanceId.toLowerCase()}`)
      )
      this.provider = resolvable(() => or(inputs.provider, context.get('provider')))
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return DEPLOY
      }

      if (prevInstance.bucketName !== resolve(this.bucketName)) {
        return REPLACE
      }
    }

    async deploy(prevInstance, context) {
      context.log(`Creating Bucket: '${get('bucketName', this)}'`)
      await createBucket(this)
      context.log(`Bucket created: '${get('bucketName', this)}'`)
    }

    async remove(context) {
      context.log(`Removing Bucket: '${this.bucketName}'`)
      await deleteBucket(this)
    }

    async info() {
      return {
        title: this.name,
        type: this.extends,
        data: pick(['name', 'license', 'version', 'bucketName'], this)
      }
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
