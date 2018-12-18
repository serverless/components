import { get, pick, resolve } from '@serverless/utils'
import { createBucket, deleteBucket } from './utils'

const DEPLOY = 'deploy'
const REPLACE = 'replace'

const AwsS3Bucket = (SuperClass) =>
  class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)

      // TODO: remove this validation once core supports full RAML spec
      const bucketNameRegex = new RegExp(this.inputTypes.bucketName.pattern)
      if (inputs.bucketName && !bucketNameRegex.test(inputs.bucketName)) {
        throw new Error(`Bucket name does not match regex "${bucketNameRegex.toString()}"`)
      }
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)
      const AWS = provider.getSdk()
      const S3 = new AWS.S3()

      try {
        await S3.getBucketLocation({ Bucket: resolve(this.bucketName) }).promise()
      } catch (e) {
        if (e.code === 'NoSuchBucket') {
          return 'removed'
        }
        throw e
      }
    }

    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return DEPLOY
      }

      if (prevInstance.bucketName !== this.bucketName) {
        return REPLACE
      }
    }

    async deploy(prevInstance, context) {
      console.log('s3 deploy')
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
        type: this.name,
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
