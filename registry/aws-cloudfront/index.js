/* eslint-disable no-console */

const AWS = require('aws-sdk')

const CloudFront = new AWS.CloudFront({ apiVersion: '2017-03-25' })

// Helper Methods
const getDistribution = async (distributionId) => {
  const distRes = await CloudFront.getDistribution({
    Id: distributionId
  }).promise()

  return distRes
}

// eslint-disable-next-line no-unused-vars
const getDistributionConfig = async (distributionId) => {
  const distConfigRes = await CloudFront.getDistributionConfig({
    Id: distributionId
  }).promise()

  return distConfigRes
}

const timestamp = () => Math.floor(Date.now() / 1000)

// [] Create Create Distribution
//    Origin Domain Name => siteurl (without scheme) (Origins)
//    Default Cache Behavior Settings => default values
//    Distribution Settings =>
//    Alternate Domain Names (CNAMEs) (Optional) (Aliases)
//      Create a CNAME
//      If you add a CNAME for www.example.com to your distribution,
//      you also need to create (or update) a CNAME record with your
//      DNS service to route queries for www.example.com
//      to d111111abcdef8.cloudfront.net.
//    SSL Certificate => defaults (*.cloudfront.net)
//    Default Root Object => index.html
//    Logging => Off
//    Cookie Logging => Off
//    Distribution State => Enabled

const createDistribution = async ({
  name,
  defaultRootObject,
  originId,
  originDomain,
  aliasDomain,
  distributionEnabled,
  loggingEnabled,
  loggingBucket,
  loggingIncludeCookies,
  loggingPrefix,
  priceClass
}) => {
  const callerReference = `${name}-${timestamp()}`

  const distributionConfig = {
    CallerReference: callerReference,
    Comment: `CloudFront distribution for ${originId}`,
    DefaultCacheBehavior: {
      ForwardedValues: {
        Cookies: {
          Forward: 'none'
        },
        QueryString: true,
        Headers: {
          Quantity: 0
        }
      },
      MinTTL: 0,
      TargetOriginId: originId,
      TrustedSigners: {
        Enabled: false,
        Quantity: 0
      },
      ViewerProtocolPolicy: 'allow-all',
      AllowedMethods: {
        Items: ['GET', 'HEAD'],
        Quantity: 2,
        CachedMethods: {
          Items: ['GET', 'HEAD'],
          Quantity: 2
        }
      },
      Compress: false,
      DefaultTTL: 86400,
      LambdaFunctionAssociations: {
        Quantity: 0
      },
      MaxTTL: 31536000,
      SmoothStreaming: false
    },
    Enabled: distributionEnabled,
    Origins: {
      Quantity: 1,
      Items: [
        {
          DomainName: originDomain,
          Id: originId,
          S3OriginConfig: {
            OriginAccessIdentity: ''
          }
        }
      ]
    },
    Aliases: {
      Quantity: 1,
      Items: [aliasDomain]
    },
    DefaultRootObject: defaultRootObject,
    Logging: {
      Bucket: loggingBucket,
      Enabled: loggingEnabled,
      IncludeCookies: loggingIncludeCookies,
      Prefix: loggingPrefix
    },
    PriceClass: priceClass
  }

  const distRes = await CloudFront.createDistribution({
    DistributionConfig: distributionConfig
  }).promise()
  console.log(`CloudFront distribution '${name}' creation initiated`)

  return {
    distribution: {
      id: distRes.Id,
      arn: distRes.ARN,
      status: distRes.Status,
      lastModifiedTime: distRes.LastModifiedTime,
      domainName: distRes.DomainName,
      location: distRes.Location,
      eTag: distRes.ETag,
      distConfig: {
        callerReference: distRes.DistributionConfig.CallerReference,
        enabled: distRes.DistributionConfig.Enabled
      }
    }
  }
}

const updateDistribution = async (distributionId, eTag, newDistributionConfig) => {
  // update logic
  // The new configuration replaces the existing configuration;
  // the values that you specify in an UpdateDistribution request
  // are not merged into the existing configuration.
  const distRes = await CloudFront.updateDistribution({
    Id: distributionId,
    IfMatch: eTag,
    DistributionConfig: newDistributionConfig
  }).promise()
  console.log(`CloudFront distribution '${distributionId}' update initiated`)

  return {
    distribution: {
      id: distRes.Id,
      arn: distRes.ARN,
      status: distRes.Status,
      lastModifiedTime: distRes.LastModifiedTime,
      domainName: distRes.DomainName,
      location: distRes.Location,
      eTag: distRes.ETag,
      distConfig: {
        callerReference: distRes.DistributionConfig.CallerReference,
        enabled: distRes.DistributionConfig.Enabled
      }
    }
  }
}

const toggleEnabledForDistribution = async (distributionId, enabled) => {
  const distRes = await getDistribution(distributionId)

  if (distRes.DistributionConfig.Enabled !== enabled) {
    distRes.DistributionConfig.Enabled = enabled
    const distUpdateRes = await updateDistribution(
      distributionId,
      distRes.ETag,
      distRes.DistributionConfig
    )
    return distUpdateRes
  }
  return {
    distribution: {
      id: distRes.Id,
      arn: distRes.ARN,
      status: distRes.Status,
      lastModifiedTime: distRes.LastModifiedTime,
      domainName: distRes.DomainName,
      location: distRes.Location,
      eTag: distRes.ETag,
      distConfig: {
        callerReference: distRes.DistributionConfig.CallerReference,
        enabled: distRes.DistributionConfig.Enabled
      }
    }
  }
}

const deleteDistribution = async (distributionId) => {
  // disable distribution first
  const res = await toggleEnabledForDistribution(distributionId, false)

  await CloudFront.deleteDistribution({
    Id: distributionId,
    IfMatch: res.distribution.eTag
  }).promise()

  console.log(`CloudFront distribution '${distributionId}' deletion initiated`)
}

const deploy = async (inputs, context) => {
  let outputs = context.state
  if (!context.state.distribution && inputs.name) {
    context.log(`Creating CloudFront distribution: '${inputs.name}'`)
    outputs = await createDistribution(inputs)
  } else if (!inputs.name && context.state.distribution.id) {
    context.log(
      `Removing CloudFront distribution: '${context.state.name}' with id: ` +
        `'${context.state.distribution.id}'`
    )
    await deleteDistribution(context.state.distribution.id)
  } else if (context.state.name !== inputs.name && context.state.distribution) {
    context.log(
      `Removing CloudFront distribution: '${context.state.name}' with id: '${
        context.state.distribution.id
      }'`
    )
    const res = await deleteDistribution(context.state.distribution.id)
    if (!res.error) {
      context.log(`Creating CloudFront distribution: '${inputs.name}'`)
      outputs = await createDistribution(inputs)
    }
  } else if (
    context.state.name &&
    context.state.distribution &&
    inputs.distributionEnabled !== context.state.distribution.distConfig.enabled
  ) {
    context.log(`Toggling CloudFront distribution to '${inputs.distributionEnabled}'`)
    outputs = await toggleEnabledForDistribution(
      context.state.distribution.id,
      inputs.distributionEnabled
    )
  }
  context.saveState({ ...inputs, ...outputs })
  return outputs
}

const remove = async (inputs, context) => {
  if (!context.state.name) return {}

  try {
    context.log(
      `Removing CloudFront distribution: '${context.state.name}' with id: '${
        context.state.distribution.id
      }'`
    )
    await deleteDistribution(context.state.distribution.id, context.state.distribution.eTag)
  } catch (e) {
    if (e.message.includes('The distribution you are trying to delete has not been disabled')) {
      context.log(
        'Could not delete distribution as it is not disabled or is still being disabled. Please disable it or try again later.'
      )
      e.code = 'RETAIN_STATE'
      throw e
    } else if (!e.message.includes('The specified distribution does not exist')) {
      throw e
    }
  }
  return {}
}

module.exports = {
  deploy,
  remove
}
