const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const Route53 = new AWS.Route53({apiVersion: '2013-04-01'})

// If your domain is registered with a registrar
// other than Amazon Route 53, you must update
// the name servers with your registrar to make
// Amazon Route 53 your DNS service.
// Change the name servers for your domain to the set
// of NameServers that CreateHostedZone returns in DelegationSet.

const addRoute53ToCloudFrontDomainMapping = async ({name, domainName, dnsName, privateZone, vpcId, vpcRegion}) => {
  const res1 = await createHostedZone(name, domainName, privateZone, vpcId, vpcRegion)
  const res2 = await upsertAliasRecordSetForCloudFront(domainName, dnsName, res1.hostedZone.id)

  // merge outputs
  const outputs = Object.assign({}, res1, res2)

  return outputs
}

const removeRoute53ToCloudFrontDomainMapping = async (domainName, dnsName, hostedZoneId) => {
  const res1 = await deleteAliasRecordSetForCloudFront(domainName, dnsName, hostedZoneId)
  const res2 = await deleteHostedZone(hostedZoneId)

  // merge outputs
  const outputs = Object.assign({}, res1, res2)

  return outputs
}

// Helper methods
const createHostedZone = async (name, domainName, privateZone, vpcId, vpcRegion) => {
  const callerReference = name + '-' + timestamp()

  const privateHostedZone = {
    HostedZoneConfig: {
      PrivateZone: privateZone
    },
    VPC: {
      VPCId: vpcId,
      VPCRegion: vpcRegion
    }
  }
  const publicHostedZone = {
    CallerReference: callerReference,
    Name: domainName
  }
  let hostedZone = publicHostedZone
  if (privateZone) {
    // merge configs
    hostedZone = Object.assign({}, publicHostedZone, privateHostedZone)
  }
  const hZoneRes = await Route53.createHostedZone(hostedZone).promise()
  console.log(`Route53 Hosted Zone '${callerReference}' creation initiated.`)

  return {
    hostedZone: {
      id: hZoneRes.HostedZone.Id,
      name: hZoneRes.HostedZone.Name,
      callerReference: hZoneRes.HostedZone.CallerReference,
      resourceRecordSetCount: hZoneRes.HostedZone.ResourceRecordSetCount,
      privateZone: hZoneRes.HostedZone.Config.PrivateZone,
      location: hZoneRes.Location,
      changeInfo: {
        id: hZoneRes.ChangeInfo.Id,
        status: hZoneRes.ChangeInfo.Status,
        submittedAt: hZoneRes.ChangeInfo.SubmittedAt,
        comment: hZoneRes.ChangeInfo.Comment
      },
      delegationSet: {
        id: hZoneRes.DelegationSet.Id,
        callerReference: hZoneRes.DelegationSet.CallerReference,
        nameServers: hZoneRes.DelegationSet.NameServers
      }
    }
  }
}

const deleteHostedZone = async (hostedZoneId) => {

  await Route53.deleteHostedZone({
    Id: hostedZoneId
  }).promise()
  console.log(`Route53 Hosted Zone '${hostedZoneId}' deletion initiated.`)

  return {
    hostedZone: null
  }
}

const upsertAliasRecordSetForCloudFront = async (domainName, dnsName, hostedZoneId) => {
  const changeBatch = {
    Changes: [
      {
        Action: "UPSERT",
        ResourceRecordSet: {
          AliasTarget: {
            DNSName: dnsName,
            EvaluateTargetHealth: false,
            HostedZoneId: 'Z2FDTNDATAQYW2' // For CloudFront distribution
          },
          Name: domainName,
          Type: "A"
        }
      }
    ],
    Comment: `CloudFront distribution for ${domainName}`
  }

  const resRecordSetRes = await Route53.changeResourceRecordSets({
    ChangeBatch: changeBatch,
    HostedZoneId: hostedZoneId
  }).promise()
  console.log(`Route53 Record Set ${domainName} => ${dnsName} creation initiated.`)

  return {
    changeRecordSet: {
      changeInfo: {
        id: resRecordSetRes.ChangeInfo.Id,
        status: resRecordSetRes.ChangeInfo.Status,
        submittedAt: resRecordSetRes.ChangeInfo.SubmittedAt,
        comment: resRecordSetRes.ChangeInfo.Comment
      }
    }
  }

}

const deleteAliasRecordSetForCloudFront = async (domainName, dnsName, hostedZoneId) => {
  const changeBatch = {
    Changes: [
      {
        Action: "DELETE",
        ResourceRecordSet: {
          AliasTarget: {
            DNSName: dnsName,
            EvaluateTargetHealth: false,
            HostedZoneId: 'Z2FDTNDATAQYW2' // For CloudFront distribution
          },
          Name: domainName,
          Type: "A"
        }
      }
    ],
    Comment: `CloudFront distribution for ${domainName}`
  }

  const resRecordSetRes = await Route53.changeResourceRecordSets({
    ChangeBatch: changeBatch,
    HostedZoneId: hostedZoneId
  }).promise()
  console.log(`Route53 Record Set ${domainName} => ${dnsName} deletion initiated.`)

  return {
    changeRecordSet: {
      changeInfo: {
        id: resRecordSetRes.ChangeInfo.Id,
        status: resRecordSetRes.ChangeInfo.Status,
        submittedAt: resRecordSetRes.ChangeInfo.SubmittedAt,
        comment: resRecordSetRes.ChangeInfo.Comment
      }
    }
  }

}

// const createTrafficPolicy = async (name, dnsEndpointType, dnsEndpointRegion, dnsEndpointValue) => {
//   const nameTrafficPolicy = name + '-traffic-policy'
//   const endpointId = name + '-endpoint-id'
//
//   const trafficPolicyDocument = {
//     AWSPolicyFormatVersion: "2015-10-01",
//     RecordType: "A",
//     StartEndpoint: endpointId,
//     Endpoints: {
//       `${endpointId}`: {
//          Type: dnsEndpointType,
//          Region: dnsEndpointRegion,
//          Value: dnsEndpointValue
//       }
//     }
//   }
//   console.log("Document: ", JSON.stringify(trafficPolicyDocument))
//
//   const trafficPolRes = await Route53.createTrafficPolicy({
//     Name: nameTrafficPolicy,
//     Document: JSON.stringify(trafficPolicyDocument)
//   }).promise()
//   console.log(`Route53 Traffic Policy ${nameTrafficPolicy} creation initiated.`)
//
//   return {
//     trafficPolicy: {
//       id: trafficPolRes.TrafficPolicy.Id,
//       name: trafficPolRes.TrafficPolicy.Name,
//       version: trafficPolRes.TrafficPolicy.Version,
//       type: trafficPolRes.TrafficPolicy.Type,
//       document: trafficPolRes.TrafficPolicy.Document,
//       comment: trafficPolRes.TrafficPolicy.Comment,
//       location: trafficPolRes.Location
//     }
//   }
// }
//
// const createTrafficPolicyInstance = async (hostedZoneId, domainName, ttl, trafficPolicyId, trafficPolicyVersion) => {
//
//   const trafficPolInstRes = await Route53.createTrafficPolicyInstance({
//     HostedZoneId: hostedZoneId,
//     Name: domainName,
//     TTL: ttl,
//     TrafficPolicyId: trafficPolicyId,
//     TrafficPolicyVersion: trafficPolicyVersion
//   }).promise()
//   console.log(`Route53 Traffic Policy Instance ${trafficPolicyId} creation initiated.`)
//
// }

// Helper methods
const timestamp = () => {
  return Math.floor(Date.now() / 1000)
}


const deploy = async (inputs, state, context) => {
  let outputs = state
  if ((!state.hostedZone || !state.hostedZone.name) && inputs.domainName) {
    context.log(`Creating Route53 to CloudFront mapping: ${inputs.domainName} => ${inputs.dnsName}`)
    outputs = await addRoute53ToCloudFrontDomainMapping(inputs)
  } else if (!inputs.domainName && state.hostedZone.id) {
    context.log(`Removing Route53 to CloudFront mapping: ${inputs.domainName} => ${inputs.dnsName}`)
    outputs = await removeRoute53ToCloudFrontDomainMapping(inputs.domainName, inputs.dnsName, state.hostedZone.id)
  } else if (state.hostedZone && state.hostedZone.name !== inputs.domainName) {
    context.log(`Removing Route53 to CloudFront mapping: ${inputs.domainName} => ${inputs.dnsName}`)
    outputs = await removeRoute53ToCloudFrontDomainMapping(inputs.domainName, inputs.dnsName, state.hostedZone.id)
    context.log(`Re-Creating Route53 to CloudFront mapping: ${inputs.domainName} => ${inputs.dnsName}`)
    outputs = await addRoute53ToCloudFrontDomainMapping(inputs)
  }

  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing Route53 to CloudFront mapping: ${state.hostedZone.name} with id: ${state.hostedZone.id}`)
  const outputs = await removeRoute53ToCloudFrontDomainMapping(inputs.domainName, inputs.dnsName, state.hostedZone.id)

  return outputs
}

module.exports = {
  deploy,
  remove
}
