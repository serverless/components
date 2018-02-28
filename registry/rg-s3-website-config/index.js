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

const deploy = async (inputs, state, context) => {
  let outputs = state

  // config
  if (!state.rootBucketName && inputs.rootBucketName) {
    context.log(`Setting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await setBucketForWebsiteConfig(inputs)
  } else if (!inputs.rootBucketName && state.rootBucketName) {
    context.log(`Unsetting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await unsetBucketConfig(inputs.rootBucketName)
  } else if (state.rootBucketName !== inputs.rootBucketName) {
    context.log(`Setting Bucket: ${inputs.rootBucketName} with website configuration.`)
    await setBucketForWebsiteConfig(inputs)
  }

  // redirect
  if (!state.redirectBucketName && inputs.redirectBucketName) {
    context.log(`Setting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await setBucketForRedirection(inputs)
  } else if (!inputs.redirectBucketName && state.redirectBucketName) {
    context.log(`Unsetting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await unsetBucketConfig(inputs.redirectBucketName)
  } else if (state.redirectBucketName !== inputs.redirectBucketName) {
    context.log(`Setting Bucket: ${inputs.redirectBucketName} for redirection.`)
    await setBucketForRedirection(inputs)
  }

  return outputs
}

const remove = async (inputs, state, context) => {
  let outputs = state

  // context.log(`Unsetting Bucket: ${state.rootBucketName} with website configuration.`)
  // await unsetBucketConfig(state.rootBucketName)
  // context.log(`Unsetting Bucket: ${state.redirectBucketName} for redirection.`)
  // await unsetBucketConfig(state.redirectBucketName)

  return outputs
}

module.exports = {
  deploy,
  remove
}
