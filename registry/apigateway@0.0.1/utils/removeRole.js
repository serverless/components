const ServerlessComponentsEslam = require('serverless-components-eslam')
const { AWS } = ServerlessComponentsEslam

const IAM = new AWS.IAM({region: 'us-east-1'})

module.exports = async (apiName) => {
  await IAM.detachRolePolicy({
    RoleName: `apig-${apiName}`,
    PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }).promise()

  await IAM.deleteRole({
    RoleName: `apig-${apiName}`
  }).promise()
}
