import { isEmpty, not, equals, pick } from 'ramda'

const AwsEventsRule = {
  construct(inputs) {
    this.provider = inputs.provider
    // this.lambdaArn = inputs.lambdaArn
    this.function = inputs.function
    this.schedule = inputs.schedule
    this.enabled = inputs.enabled
    // this.name = inputs.lambdaArn.split(':')[inputs.lambdaArn.split(':').length - 1]
    this.ruleName = 'abc'
  },

  async define(context) {
    const compute = this.function.compute.get()
    this.lambda = await compute.defineFunction(this.function, context)
    return { lambda: this.lambda }
  },

  async deploy(prevInstance, context) {
    const AWS = this.provider.getSdk()
    const cloudWatchEvents = new AWS.CloudWatchEvents()
    const lambda = new AWS.Lambda()

    console.log('Creating Schedule')


    const name = this.lambda.arn.split(':')[this.lambda.arn.split(':').length - 1]
    //


    // const inputsProps = ['name', 'lambdaArn', 'schedule', 'enabled']
    // const inputs = pick(inputsProps, this)
    // const prevInputs = pick(inputsProps, prevInstance)
    // const noChanges = equals(inputs, prevInputs)
    //
    // if (noChanges) {
    //   return this
    // } else if (not(isEmpty(prevInstance))) {
    //   await this.remove(context)
    // }
    //
    const State = this.enabled ? 'ENABLED' : 'DISABLED'
    const putRuleParams = {
      Name: name,
      ScheduleExpression: this.schedule,
      State
    }

    const putRuleRes = await cloudWatchEvents.putRule(putRuleParams).promise()

    this.arn = putRuleRes.RuleArn

    const putTargetsParams = {
      Rule: name,
      Targets: [
        {
          Arn: this.lambda.arn,
          Id: name
        }
      ]
    }

    await cloudWatchEvents.putTargets(putTargetsParams).promise()

    const addPermissionParams = {
      Action: 'lambda:InvokeFunction',
      FunctionName: name,
      StatementId: name,
      Principal: 'events.amazonaws.com'
    }

    await lambda.addPermission(addPermissionParams).promise()
  },

  async remove(prevInstance) {
    if (!prevInstance.name) return this
    const cloudWatchEvents = new this.provider.sdk.CloudWatchEvents()
    const removeTargetsParams = {
      Rule: this.name,
      Ids: [this.name]
    }

    await cloudWatchEvents.removeTargets(removeTargetsParams).promise()

    const deleteRuleParams = {
      Name: this.name
    }

    await cloudWatchEvents.deleteRule(deleteRuleParams).promise()

    return this
  }
}

export default AwsEventsRule
