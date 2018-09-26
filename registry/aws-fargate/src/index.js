const aws = require('aws-sdk')
const ec2 = new aws.EC2({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })
const ecs = new aws.ECS({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' })

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
    const {
      Vpc: { VpcId }
    } = await ec2.createVpc({ CidrBlock: '10.0.0.0/16' }).promise()
    if (!VpcId) throw new Error('Could not get VPC ID')
    context.log('VPC: created')

    state = { ...state, VpcId }
    context.saveState(state)

    const {
      InternetGateway: { InternetGatewayId }
    } = await ec2.createInternetGateway({}).promise()
    if (!InternetGatewayId) throw new Error('Could not attach Internet Gateway')
    context.log('Internet Gateway: created')

    state = { ...state, InternetGatewayId }
    context.saveState(state)

    await ec2.attachInternetGateway({ InternetGatewayId, VpcId }).promise()
    context.log('Internet Gateway: attached to VPC')

    const { GroupId } = await ec2
      .createSecurityGroup({
        Description: `${input.serviceName} security group`,
        GroupName: `${input.serviceName}-security-group`,
        VpcId
      })
      .promise()
    if (!GroupId) throw new Error('Could not get Security group')
    context.log('Security Group: created')

    state = { ...state, SecurityGroupId: GroupId }
    context.saveState(state)

    const {
      NetworkAcl: { NetworkAclId }
    } = await ec2.createNetworkAcl({ VpcId }).promise()
    if (!NetworkAclId) throw new Error('Could not create Network ACL')
    context.log('NetworkAcl: created')

    state = { ...state, NetworkAclId }
    context.saveState(state)

    const {
      RouteTable: { RouteTableId }
    } = await ec2.createRouteTable({ VpcId }).promise()
    if (!RouteTableId) throw new Error('Could not create Route Table for VPC')
    context.log('RouteTable: created')

    state = { ...state, RouteTableId }
    context.saveState(state)

    await ec2
      .createRoute({
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: InternetGatewayId,
        RouteTableId: RouteTableId
      })
      .promise()
    await ec2
      .createRoute({
        DestinationIpv6CidrBlock: '::/0',
        GatewayId: InternetGatewayId,
        RouteTableId: RouteTableId
      })
      .promise()
    context.log('RouteTable: routes created')

    await ec2
      .authorizeSecurityGroupIngress({
        GroupId: GroupId,
        IpPermissions: [
          {
            FromPort: -1,
            IpProtocol: '-1',
            IpRanges: [{ CidrIp: '0.0.0.0/0' }],
            Ipv6Ranges: [{ CidrIpv6: '::/0' }],
            ToPort: -1
          }
        ]
      })
      .promise()
    context.log('SecurityGroupIngress: rule created')

    await ec2
      .authorizeSecurityGroupEgress({
        GroupId: GroupId,
        IpPermissions: [
          {
            FromPort: -1,
            IpProtocol: '-1',
            Ipv6Ranges: [{ CidrIpv6: '::/0' }],
            ToPort: -1
          }
        ]
      })
      .promise()
    context.log('SecurityGroupEgress: rule created')

    const {
      Subnet: { SubnetId }
    } = await ec2.createSubnet({ CidrBlock: '10.0.0.0/16', VpcId }).promise()
    if (!SubnetId) throw new Error('Could not get Subnet')
    context.log('Subnet: created')

    state = { ...state, SubnetId }
    context.saveState(state)

    const { AssociationId: RouteTableAssociationId } = await ec2
      .associateRouteTable({ RouteTableId, SubnetId })
      .promise()
    if (!RouteTableAssociationId) throw new Error('Could not associate RouteTable with Subnet')
    context.log('Subnet: route table associated')

    state = { ...state, RouteTableAssociationId }
    context.saveState(state)

    securityGroups = [GroupId]
    subnets = [SubnetId]
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
  state = { ...state, service: serviceComponentOutputs }
  context.saveState(state)

  context.log('Tasks: waiting for provisioning to finish')
  await new Promise((resolve) => setTimeout(() => resolve(), 20000))
  const { taskArns } = await ecs
    .listTasks({ serviceName: serviceComponentOutputs.serviceName })
    .promise()
  const tasks = await waitUntilTaskChangeFinishes(taskArns, 0, 10).catch((res) => res)
  context.log('Tasks: provision complete')
  let containers = []
  let attachments = []
  if (Array.isArray(tasks) && tasks.length) {
    containers = tasks.reduce((prev, current) => prev.concat(current.containers), containers)
    attachments = tasks.reduce((prev, current) => prev.concat(current.attachments), attachments)
  }

  state = { ...state, containers, attachments }
  context.saveState(state)

  return {
    serviceArn: serviceComponentOutputs.serviceArn,
    serviceName: serviceComponentOutputs.serviceName,
    containers,
    attachments
  }
}

async function waitUntilTaskChangeFinishes(taskArns, currentTry, limit) {
  const { tasks } = await ecs.describeTasks({ tasks: taskArns }).promise()
  if (currentTry > limit || !Array.isArray(tasks)) return Promise.reject(tasks)

  const unfinishedTasks = tasks.filter((t) => t.desiredStatus !== t.lastStatus)
  if (unfinishedTasks.length) {
    // Wait 10 seconds because it times some times for tasks to change
    await new Promise((resolve) => setTimeout(() => resolve(), 10000))
    return waitUntilTaskChangeFinishes(unfinishedTasks.map((t) => t.taskArn), currentTry++, limit)
  }

  return tasks
}

const remove = async (input, context) => {
  let { state } = context

  const { taskArns } = await ecs.listTasks({ serviceName: input.serviceName }).promise()

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

  if (Array.isArray(taskArns) && taskArns.length) {
    context.log('Task: waiting for removal to finish')
    await waitUntilTaskChangeFinishes(taskArns, 0, 5)
    context.log('Task: finished')
  }

  if (state.RouteTableAssociationId) {
    await ec2.disassociateRouteTable({ AssociationId: state.RouteTableAssociationId }).promise()
    context.log('RouteTable: disassociated')
    state = { ...state, RouteTableAssociationId: null }
    context.saveState(state)
  }
  if (state.SubnetId) {
    await ec2.deleteSubnet({ SubnetId: state.SubnetId }).promise()
    state = { ...state, SubnetId: null }
    context.log('Subnet: deleted')
    context.saveState(state)
  }
  if (state.SecurityGroupId) {
    await ec2.deleteSecurityGroup({ GroupId: state.SecurityGroupId }).promise()
    context.log('SecurityGroup: deleted')
    state = { ...state, SecurityGroupId: null }
    context.saveState(state)
  }
  if (state.InternetGatewayId) {
    if (state.VpcId) {
      await ec2
        .detachInternetGateway({ InternetGatewayId: state.InternetGatewayId, VpcId: state.VpcId })
        .promise()
      context.log('InternetGateway: detached')
    }
    await ec2.deleteInternetGateway({ InternetGatewayId: state.InternetGatewayId }).promise()
    context.log('InternetGateway: deleted')
    state = { ...state, InternetGatewayId: null }
    context.saveState(state)
  }
  if (state.RouteTableId) {
    const { RouteTables } = await ec2
      .describeRouteTables({ RouteTableIds: [state.RouteTableId] })
      .promise()
    if (Array.isArray(RouteTables) && RouteTables.length) {
      const routeTable = RouteTables.shift()
      if (Array.isArray(routeTable.Routes) && routeTable.Routes.length) {
        const routesToDelete = routeTable.Routes.filter(
          (route) => !['local'].includes(route.GatewayId)
        )
          .map((route) =>
            Object.keys(route)
              .filter((name) => ['DestinationCidrBlock', 'DestinationIpv6CidrBlock'].includes(name))
              .map((name) => ({
                [name]: route[name],
                RouteTableId: routeTable.RouteTableId
              }))
          )
          .map((routeParams) => ec2.deleteRoute(routeParams.shift()).promise())
        await Promise.all(routesToDelete)
      }
    }
    await ec2.deleteRouteTable({ RouteTableId: state.RouteTableId }).promise()
    context.log('RouteTable: deleted')
  }
  if (state.NetworkAclId) {
    const { NetworkAcls } = await ec2
      .describeNetworkAcls({ NetworkAclIds: [state.NetworkAclId] })
      .promise()

    if (Array.isArray(NetworkAcls) && NetworkAcls.length) {
      const acl = NetworkAcls.shift()

      if (Array.isArray(acl.Entries) && acl.Entries.length) {
        const entriesToDelete = acl.Entries.filter(
          (entry) => entry.RuleNumber < 32767 && entry.RuleNumber > 0
        ).map((entry) =>
          ec2
            .deleteNetworkAclEntry({
              RuleNumber: entry.RuleNumber,
              Egress: entry.Egress,
              NetworkAclId: state.NetworkAclId
            })
            .promise()
        )

        await Promise.all(entriesToDelete)
      }
    }
    await ec2.deleteNetworkAcl({ NetworkAclId: state.NetworkAclId }).promise()
    context.log('NetworkAcl: deleted')
    state = { ...state, NetworkAclId: null }
    context.saveState(state)
  }
  if (state.VpcId) {
    await ec2.deleteVpc({ VpcId: state.VpcId }).promise()
    context.log('VPC: deleted')
    state = { ...state, VpcId: null }
    context.saveState(state)
  }

  context.log('Fargate service: removal complete')
  context.saveState({})
  return {}
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
