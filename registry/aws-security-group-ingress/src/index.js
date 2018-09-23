const AWS = require('aws-sdk')
const {
  keys,
  merge,
  map,
  replace,
  toUpper,
  head,
  last,
  equals,
  omit,
  reduce,
  isEmpty
} = require('ramda')

const ec2 = new AWS.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const capitalize = replace(/^./, toUpper)

const capitalizeObjectKeys = (object) =>
  reduce(
    (result, key) => {
      const capitalizedKey = capitalize(key)
      return merge(result, { [capitalizedKey]: object[key] })
    },
    {},
    keys(object)
  )

const formatIpPermissions = (ipPermissions) => {
  const capitalized = map((item) => {
    let capitalizedItem = capitalizeObjectKeys(item)
    // parse port range
    if (capitalizedItem.PortRange) {
      const ports = capitalizedItem.PortRange.split('-')
      let fromPort = head(ports)
      let toPort = last(ports)
      if (fromPort.toUpperCase() === 'ALL') {
        fromPort = 0
      }
      if (toPort.toUpperCase() === 'ALL') {
        toPort = 65535
      }
      capitalizedItem = merge(capitalizedItem, {
        FromPort: parseInt(fromPort, 10),
        ToPort: parseInt(toPort, 10)
      })
      capitalizedItem = omit(['PortRange'], capitalizedItem)
    }
    if (capitalizedItem.IpRanges) {
      capitalizedItem.IpRanges = map(capitalizeObjectKeys, capitalizedItem.IpRanges)
    }
    if (capitalizedItem.Ipv6Ranges) {
      capitalizedItem.Ipv6Ranges = map(capitalizeObjectKeys, capitalizedItem.Ipv6Ranges)
    }
    if (capitalizedItem.PrefixListIds) {
      capitalizedItem.PrefixListIds = map(capitalizeObjectKeys, capitalizedItem.PrefixListIds)
    }
    if (capitalizedItem.UserIdGroupPairs) {
      capitalizedItem.UserIdGroupPairs = map(capitalizeObjectKeys, capitalizedItem.UserIdGroupPairs)
    }
    return capitalizedItem
  }, ipPermissions)
  return capitalized
}

const deploy = async (inputs, context) => {
  const { state } = context
  const params = {
    GroupId: inputs.groupId,
    IpPermissions: formatIpPermissions(inputs.ipPermissions)
  }

  if (equals(state, params)) {
    return {}
  }

  let succeedMessage

  if (isEmpty(state)) {
    context.log(`Adding security group ingress to security group "${inputs.groupId}"`)
    succeedMessage = 'Security group ingress added'
  } else {
    context.log(`Updating security group ingress in security group "${inputs.groupId}"`)
    context.log('Ingress update requires replacement')
    await remove(inputs, context)
    succeedMessage = 'Security group ingress updated'
  }

  try {
    // authorizeSecurityGroupIngress returns empty object on success...
    await ec2
      .authorizeSecurityGroupIngress({
        GroupId: inputs.groupId,
        IpPermissions: formatIpPermissions(inputs.ipPermissions)
      })
      .promise()
    context.log(succeedMessage)
  } catch (exception) {
    // if same ingress has been manually created
    if (exception.code === 'InvalidPermission.Duplicate') {
      context.log(capitalize(exception.message))
    } else {
      throw exception
    }
  }

  context.saveState(params)
  return {}
}

const remove = async (inputs, context) => {
  const { state } = context
  // @todo check dependencies to other security groups
  context.log(`Removing security group ingress from security group "${state.GroupId}"`)
  try {
    await ec2.revokeSecurityGroupIngress(state).promise()
  } catch (exception) {
    if (!['InvalidPermission.NotFound', 'InvalidGroup.NotFound'].includes(exception.code)) {
      throw exception
    }
  }
  context.log(`Security group ingress removed from security group "${state.GroupId}"`)
  return {}
}

module.exports = {
  deploy,
  remove
}
