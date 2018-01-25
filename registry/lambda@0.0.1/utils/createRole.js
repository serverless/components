const ServerlessComponentsEslam = require('serverless-components-eslam')
const { AWS } = ServerlessComponentsEslam

const IAM = new AWS.IAM({region: 'us-east-1'})

module.exports = async (lambdaName) => {
  const assumeRolePolicyDocument = {
    Version: '2012-10-17',
    Statement: {
      Effect: 'Allow',
      Principal: {
        Service: 'lambda.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }
  }
  const roleRes = await IAM.createRole({
    RoleName: `lambda-${lambdaName}`,
    Path: '/',
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
  }).promise()

  await IAM.attachRolePolicy({
    RoleName: `lambda-${lambdaName}`,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  return roleRes.Role.Arn
}
