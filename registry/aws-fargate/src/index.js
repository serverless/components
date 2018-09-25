const deploy = async (input, context) => {
  const { state } = context

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
  context.saveState({ ...state, taskDefinition: taskDefinitionOutputs })

  const serviceComponent = await context.load('aws-ecs-service', 'service', {
    launchType: 'FARGATE',
    desiredCount: input.desiredCount,
    taskDefinition: `${taskDefinitionOutputs.family}:${taskDefinitionOutputs.revision}`,
    serviceName: input.serviceName,
    networkConfiguration: {
      awsvpcConfiguration: input.awsVpcConfiguration
    }
  })
  const serviceComponentOutputs = await serviceComponent.deploy()
  context.saveState({ ...state, service: serviceComponentOutputs })
}

const remove = async (input, context) => {
  const { state } = context

  if (state.hasOwnProperty('taskDefinition')) {
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

    context.saveState({ ...state, taskDefinition: null })
  }

  if (state.hasOwnProperty('taskDefinition') && state.hasOwnProperty('service')) {
    const serviceComponent = await context.load('aws-ecs-service', 'service', {
      launchType: 'FARGATE',
      desiredCount: input.desiredCount,
      taskDefinition: `${state.taskDefinition.family}:${state.taskDefinition.revision}`,
      serviceName: input.serviceName,
      networkConfiguration: {
        awsvpcConfiguration: input.awsVpcConfiguration
      }
    })
    await serviceComponent.remove({}, state.service)

    context.saveState({ ...state, service: null })
  }
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
