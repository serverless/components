const AWS = require('aws-sdk')
const BbPromise = require('bluebird')

const Route53 = new AWS.Route53({apiVersion: '2013-04-01'})

// If your domain is registered with a registrar
// other than Amazon Route 53, you must update
// the name servers with your registrar to make
// Amazon Route 53 your DNS service.
// change the name servers for your domain to the set
// of NameServers that CreateHostedZone returns in DelegationSet.
//
// [] Create a Hosted Zone
// [] testDNSAnswer

const createHostedZone = async ({name, domainName, privateZone, vpcId, vpcRegion}) => {
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

// Helper methods
const timestamp = () => {
  return Math.floor(Date.now() / 1000)
}


const deploy = async (inputs, state, context) => {
  let outputs = state
  if ((!state.hostedZone || !state.hostedZone.name) && inputs.domainName) {
    context.log(`Creating Route53 Hosted Zone: ${inputs.domainName}`)
    outputs = await createHostedZone(inputs)
  } else if (!inputs.domainName && state.hostedZone.id) {
    context.log(`Removing Route53 Hosted Zone: ${state.hostedZone.name} with id: ${state.hostedZone.id}`)
    outputs = await deleteHostedZone(state.hostedZone.id)
  } else if (state.hostedZone && state.hostedZone.name !== inputs.domainName) {
    context.log(`Removing Route53 Hosted Zone: ${state.hostedZone.name} with id: ${state.hostedZone.id}`)
    outputs = await deleteHostedZone(state.hostedZone.id)
    context.log(`Re-creating Route53 Hosted Zone: ${inputs.domainName}`)
    outputs = await createHostedZone(inputs)
  }

  return outputs
}

const remove = async (inputs, state, context) => {
  context.log(`Removing Route53 Hosted Zone: ${state.hostedZone.name} with id: ${state.hostedZone.id}`)
  const outputs = await deleteHostedZone(state.hostedZone.id)

  return outputs
}

module.exports = {
  deploy,
  remove
}
