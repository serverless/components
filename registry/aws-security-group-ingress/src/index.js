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
  isEmpty,
  type
} = require('ramda')

const portsMap = require('./ports.json')

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

const getPortMapping = (port, range) => {
  let mappedPort = port
  if (type(mappedPort) === 'String') {
    mappedPort = parseInt(
      portsMap[mappedPort] && !isEmpty(portsMap[mappedPort][range])
        ? portsMap[mappedPort][range]
        : mappedPort,
      10
    )
    if (isNaN(mappedPort)) {
      throw new Error(`Invalid port mapping "${port}"`)
    }
  }
  return mappedPort
}

const getPortRange = (portRange) => {
  const ports = portRange.split('-')
  return {
    from: getPortMapping(head(ports), 'from'),
    to: getPortMapping(last(ports), 'to')
  }
}

const formatIpPermissions = (ipPermissions) => {
  const capitalized = map((item) => {
    let capitalizedItem = capitalizeObjectKeys(item)
    // port mappings
    if (capitalizedItem.FromPort) {
      capitalizedItem.FromPort = getPortMapping(capitalizedItem.FromPort, 'from')
    }
    if (capitalizedItem.ToPort) {
      capitalizedItem.ToPort = getPortMapping(capitalizedItem.ToPort, 'to')
    }
    if (capitalizedItem.PortRange) {
      const { from, to } = getPortRange(capitalizedItem.PortRange)
      capitalizedItem = merge(capitalizedItem, {
        FromPort: from,
        ToPort: to
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
