const AWS = require('aws-sdk')
const { keys, merge, map, replace, toUpper, equals, reduce } = require('ramda')

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
    const capitalizedItem = capitalizeObjectKeys(item)
    if (capitalizedItem.IpRanges) {
      capitalizedItem.IpRanges = map(capitalizeObjectKeys, capitalizedItem.IpRanges)
    }
    if (capitalizedItem.Ipv6Ranges) {
      capitalizedItem.Ipv6Ranges = map(capitalizeObjectKeys, capitalizedItem.Ipv6Ranges)
    }
    if (capitalizedItem.PrefixListIds) {
      capitalizedItem.PrefixListIds = map(capitalizeObjectKeys, capitalizedItem.PrefixListIds)
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
  try {
    context.log(`Adding security group ingress to security group "${inputs.groupId}"`)
    await ec2
      .authorizeSecurityGroupIngress({
        GroupId: inputs.groupId,
        IpPermissions: formatIpPermissions(inputs.ipPermissions)
      })
      .promise()
    context.log(`Security group ingress added to security group "${inputs.groupId}"`)
  } catch (exception) {
    // if same ingress has been manually created
    if (exception.code === 'InvalidPermission.Duplicate') {
      context.log(capitalize(exception.message))
    } else {
      throw exception
    }
  }
  // authorizeSecurityGroupIngress returns empty object on success...
  context.saveState(params)
  return {}
}

const remove = async (inputs, context) => {
  const { state } = context
  // @todo check dependencies to other security groups
  context.log(`Removing security group ingress from security group "${inputs.groupId}"`)
  try {
    await ec2.revokeSecurityGroupIngress(state).promise()
  } catch (exception) {
    if (!['InvalidPermission.NotFound', 'InvalidGroup.NotFound'].includes(exception.code)) {
      throw exception
    }
  }
  context.log(`Security group ingress removed from security group "${inputs.groupId}"`)
  return {}
}

module.exports = {
  deploy,
  remove
}
