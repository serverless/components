const aws = require('aws-sdk')
const ec2 = new aws.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

const deploy = async (input, context) => {
  let { state } = context

  const taskDefinitionComponent = await context.load('aws-ecs-task-definition', 'taskDefinition', {
    family: `${input.serviceName}-family`,
    volumes: [],
    containerDefinitions: input.containerDefinitions,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: input.cpu,
    memory: input.memory
  })
  const taskDefinitionOutputs = await taskDefinitionComponent.deploy()
  state = { ...state, taskDefinition: taskDefinitionOutputs }
  context.saveState(state)

  let securityGroups = []
  let subnets = []
  if (input.awsVpcConfiguration) {
    securityGroups = input.awsVpcConfiguration.securityGroups
    subnets = input.awsVpcConfiguration.subnets
  } else {
    // Create VPC
    const { Vpc: VPCOutput } = await ec2.createVpc({ CidrBlock: '10.0.0.0/16' }).promise()
    if (!VPCOutput.VpcId) throw new Error('Could not get VPC ID')

    state = { ...state, VpcId: VPCOutput.VpcId }
    context.saveState(state)

    const {
      InternetGateway: { InternetGatewayId }
    } = await ec2.createInternetGateway({}).promise()
    if (!InternetGatewayId) throw new Error('Could not attach Internet Gateway')

    state = { ...state, InternetGatewayId }
    context.saveState(state)

    await ec2.attachInternetGateway({ InternetGatewayId, VpcId: VPCOutput.VpcId }).promise()

    const { GroupId } = await ec2
      .createSecurityGroup({
        Description: `${input.serviceName} security group`,
        GroupName: `${input.serviceName}-security-group`,
        VpcId: VPCOutput.VpcId
      })
      .promise()
    if (!GroupId) throw new Error('Could not get Security group')

    state = { ...state, SecurityGroupId: GroupId }
    context.saveState(state)

    const {
      NetworkAcl: { NetworkAclId }
    } = await ec2.createNetworkAcl({ VpcId: VPCOutput.VpcId }).promise()
    if (!NetworkAclId) throw new Error('Could not create Network ACL')

    state = { ...state, NetworkAclId }
    context.saveState(state)

    await ec2
      .authorizeSecurityGroupIngress({
        GroupId: GroupId,
        IpPermissions: [
          {
            FromPort: 0,
            IpProtocol: 'tcp',
            IpRanges: [
              {
                CidrIp: '0.0.0.0/0'
              }
            ],
            ToPort: 0
          }
        ]
      })
      .promise()

    await ec2
      .authorizeSecurityGroupEgress({
        GroupId: GroupId,
        IpPermissions: [
          {
            FromPort: 0,
            IpProtocol: 'tcp',
            IpRanges: [
              {
                CidrIp: '0.0.0.0/0'
              }
            ],
            ToPort: 0
          }
        ]
      })
      .promise()

    const { Subnet } = await ec2
      .createSubnet({
        CidrBlock: '10.0.0.0/16',
        VpcId: VPCOutput.VpcId
      })
      .promise()
    if (!Subnet.SubnetId) throw new Error('Could not get Subnet')

    state = { ...state, SubnetId: Subnet.SubnetId }
    context.saveState(state)

    securityGroups = [GroupId]
    subnets = [Subnet.SubnetId]
  }

  const serviceComponent = await context.load('aws-ecs-service', 'service', {
    launchType: 'FARGATE',
    desiredCount: input.desiredCount,
    taskDefinition: `${taskDefinitionOutputs.family}:${taskDefinitionOutputs.revision}`,
    serviceName: input.serviceName,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: input.exposePublically ? 'ENABLED' : 'DISABLED',
        securityGroups: securityGroups,
        subnets: subnets
      }
    }
  })
  const serviceComponentOutputs = await serviceComponent.deploy()
  context.saveState({ ...state, service: serviceComponentOutputs })
}

const remove = async (input, context) => {
  let { state } = context

  if (state.taskDefinition) {
    const taskDefinitionComponent = await context.load(
      'aws-ecs-task-definition',
      'taskDefinition',
      {
        family: `${input.serviceName}-family`,
        volumes: [],
        containerDefinitions: input.containerDefinitions,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: input.cpu,
        memory: input.memory
      }
    )
    await taskDefinitionComponent.remove({}, context.taskDefinition)

    state = { ...state, taskDefinition: null }
    context.saveState(state)
  }

  if (state.service) {
    const serviceComponent = await context.load('aws-ecs-service', 'service', {
      launchType: 'FARGATE',
      desiredCount: input.desiredCount,
      taskDefinition: '',
      serviceName: input.serviceName,
      networkConfiguration: {}
    })
    await serviceComponent.remove({}, state.service)

    state = { ...state, service: null }
    context.saveState(state)
  }

  if (state.SecurityGroupId) {
    await ec2.deleteSecurityGroup({ GroupId: state.SecurityGroupId }).promise()
    state = { ...state, SecurityGroupId: null }
    context.saveState(state)
  }
  if (state.SubnetId) {
    await ec2.deleteSubnet({ SubnetId: state.SubnetId }).promise()
    state = { ...state, SubnetId: null }
    context.saveState(state)
  }
  if (state.InternetGatewayId) {
    await ec2.deleteInternetGateway({ InternetGatewayId: state.InternetGatewayId }).promise()
    state = { ...state, InternetGatewayId: null }
    context.saveState(state)
  }
  if (state.VpcId) {
    await ec2.deleteVpc({ VpcId: state.VpcId }).promise()
    state = { ...state, VpcId: null }
    context.saveState(state)
  }

  context.saveState({})
}

const get = async (input, context) => {
  const { state } = context
  return state || {}
}

module.exports = {
  deploy,
  get,
  remove
}
