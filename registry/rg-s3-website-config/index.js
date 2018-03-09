const AWS = require('aws-sdk')

const S3 = new AWS.S3({ region: 'us-east-1' })

const setBucketForWebsiteConfig = async ({rootBucketName, indexDocument, errorDocument, redirectBucketName, redirectToHostName}) => {
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

const setBucketForRedirection = async ({rootBucketName, indexDocument, errorDocument, redirectBucketName, redirectToHostName}) => {
  const params = {
    Bucket: redirectBucketName,
    WebsiteConfiguration: {
      RedirectAllRequestsTo: {
        HostName: redirectToHostName
      },
    },
    ContentMD5: ''
  }
  return S3.putBucketWebsite(params).promise()
}

const unsetBucketConfig = async (bucketName) => {
  const params = {
    Bucket: bucketName,
  }
  return S3.deleteBucketWebsite(params).promise()
}

const deploy = async (inputs, context) => {
  // config
  if (!context.state.rootBucketName && inputs.rootBucketName) {
    context.log(`Setting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await setBucketForWebsiteConfig(inputs)
  } else if (!inputs.rootBucketName && context.state.rootBucketName) {
    context.log(`Unsetting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await unsetBucketConfig(inputs.rootBucketName)
  } else if (context.state.rootBucketName !== inputs.rootBucketName) {
    context.log(`Setting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await setBucketForWebsiteConfig(inputs)
  }

  // redirect
  if (!context.state.redirectBucketName && inputs.redirectBucketName) {
    context.log(`Setting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await setBucketForRedirection(inputs)
  } else if (!inputs.redirectBucketName && context.state.redirectBucketName) {
    context.log(`Unsetting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await unsetBucketConfig(inputs.redirectBucketName)
  } else if (context.state.redirectBucketName !== inputs.redirectBucketName) {
    context.log(`Setting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await setBucketForRedirection(inputs)
  }
  context.saveState({ ...inputs})
  return inputs
}

const remove = async (inputs, context) => {
  // context.log(`Unsetting Bucket: ${context.state.rootBucketName} with website configuration.`)
  // await unsetBucketConfig(context.state.rootBucketName)
  // context.log(`Unsetting Bucket: ${context.state.redirectBucketName} for redirection.`)
  // await unsetBucketConfig(context.state.redirectBucketName)
  context.saveState({})
  return {}
}

module.exports = {
  deploy,
  remove
}
