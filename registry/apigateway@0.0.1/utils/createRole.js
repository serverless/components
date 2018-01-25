const ServerlessComponentsEslam = require('serverless-components-eslam')
const { AWS } = ServerlessComponentsEslam

const IAM = new AWS.IAM({region: 'us-east-1'})

module.exports = async (apiName) => {
  const assumeRolePolicyDocument = {
    Version: '2012-10-17',
    Statement: {
      Effect: 'Allow',
      Principal: {
        Service: 'apigateway.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }
  }
  const roleRes = await IAM.createRole({
    RoleName: `apig-${apiName}`,
    Path: '/',
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()

  await IAM.attachRolePolicy({
    RoleName: `apig-${apiName}`,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  return roleRes.Role.Arn
}
