const AWS = require('aws-sdk');
var eks = new AWS.EKS({apiVersion: '2017-11-01'});

const deploy = async ({
  name,
  subnetIds,
  securityGroupIds,
  roleArn
}) => {

  const params = {
    name: name,
    subnetIds: subnetIds,
    securityGroupIds: securityGroupIds,
    roleArn: roleArn
  }

  const clusterDescription = await eks.createCluster(params).promise();
  const clusterDescriptionData = clusterDescription.data;

  return {
    name: clusterDescriptionData.name,
    arn: clusterDescriptionData.arn,
    status: clusterDescriptionData.status,
    endpoint: clusterDescriptionData.endpoint
  };
}

const remove = async (name) => {
  const params = { name: name };
  var response = await eks.deleteCluster(params).promise();
  return response.data;
}

module.exports = {
  deploy,
  remove
}
