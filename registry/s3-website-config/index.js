/* eslint-disable no-console */

const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const setBucketForWebsiteConfig = async ({
  rootBucketName,
  indexDocument,
  errorDocument,
  redirectBucketName, // eslint-disable-line no-unused-vars
  redirectToHostName // eslint-disable-line no-unused-vars
}) => {
  const params = {
    Bucket: rootBucketName,
    ContentMD5: '',
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: errorDocument
      },
      IndexDocument: {
        Suffix: indexDocument
      }
    }
  }
  return S3.putBucketWebsite(params).promise()
}

const setBucketForRedirection = async ({
  rootBucketName, // eslint-disable-line no-unused-vars
  indexDocument, // eslint-disable-line no-unused-vars
  errorDocument, // eslint-disable-line no-unused-vars
  redirectBucketName,
  redirectToHostName
}) => {
  const params = {
    Bucket: redirectBucketName,
    WebsiteConfiguration: {
      RedirectAllRequestsTo: {
        HostName: redirectToHostName
      }
    },
    ContentMD5: ''
  }
  return S3.putBucketWebsite(params).promise()
}

const unsetBucketConfig = async (bucketName) => {
  const params = {
    Bucket: bucketName
  }
  return S3.deleteBucketWebsite(params).promise()
}

const deploy = async (inputs, context) => {
  // config
  if (!context.state.rootBucketName && inputs.rootBucketName) {
    context.log(`Setting website configuration for Bucket: '${inputs.rootBucketName}'`)
    await setBucketForWebsiteConfig(inputs)
  } else if (!inputs.rootBucketName && context.state.rootBucketName) {
    context.log(`Unsetting website configuration for Bucket: '${inputs.rootBucketName}'`)
    await unsetBucketConfig(inputs.rootBucketName)
  } else if (context.state.rootBucketName !== inputs.rootBucketName) {
    context.log(`Setting website configuration for Bucket: '${inputs.rootBucketName}'`)
    await setBucketForWebsiteConfig(inputs)
  }

  // redirect
  if (!context.state.redirectBucketName && inputs.redirectBucketName) {
    context.log(`Setting redirection for Bucket: '${inputs.redirectBucketName}'`)
    await setBucketForRedirection(inputs)
  } else if (!inputs.redirectBucketName && context.state.redirectBucketName) {
    context.log(`Unsetting redirection for Bucket: '${inputs.redirectBucketName}'`)
    await unsetBucketConfig(inputs.redirectBucketName)
  } else if (context.state.redirectBucketName !== inputs.redirectBucketName) {
    context.log(`Setting redirection for Bucket: '${inputs.redirectBucketName}'`)
    await setBucketForRedirection(inputs)
  }
  context.saveState({ ...inputs })
  return inputs
}

const remove = async (inputs, context) => {
  if (!context.state.rootBucketName) return {}

  // context.log(`Unsetting website configuration for Bucket: '${context.state.rootBucketName}'`)
  // await unsetBucketConfig(context.state.rootBucketName)
  // context.log(`Unsetting redirection for Bucket: '${context.state.redirectBucketName}'`)
  // await unsetBucketConfig(context.state.redirectBucketName)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
