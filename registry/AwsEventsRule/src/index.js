import { get } from '@serverless/utils'

const AwsEventsRule = (SuperClass) =>
  class extends SuperClass {
    shouldDeploy(prevInstance) {
      if (prevInstance && prevInstance.lambda.functionName !== this.lambda.functionName) {
        return 'replace'
      } else if (
        !prevInstance ||
        prevInstance.schedule !== this.schedule ||
        prevInstance.enabled !== this.enabled
      ) {
        return 'deploy'
      }
    }

    async hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
    }

    async deploy(prevInstance, context) {
      // eslint-disable-line
      const AWS = this.provider.getSdk()
      const cloudWatchEvents = new AWS.CloudWatchEvents()
      const lambda = new AWS.Lambda()

      context.log(`Scheduling Function: ${this.lambda.functionName}...`)

      const State = this.enabled ? 'ENABLED' : 'DISABLED'

      const putRuleParams = {
        Name: this.lambda.functionName,
        ScheduleExpression: this.schedule,
        State
      }

      const putRuleRes = await cloudWatchEvents.putRule(putRuleParams).promise()

      this.arn = putRuleRes.RuleArn

      const putTargetsParams = {
        Rule: this.lambda.functionName,
        Targets: [
          {
            Arn: this.lambda.getId(),
            Id: this.lambda.functionName
          }
        ]
      }

      await cloudWatchEvents.putTargets(putTargetsParams).promise()

      const addPermissionParams = {
        Action: 'lambda:InvokeFunction',
        FunctionName: this.lambda.functionName,
        StatementId: `${this.lambda.functionName}`,
        Principal: 'events.amazonaws.com'
      }

      await lambda.addPermission(addPermissionParams).promise()
    }

    async remove(context) {
      const AWS = this.provider.getSdk()
      const cloudWatchEvents = new AWS.CloudWatchEvents()

      context.log(`Removing Schedule: ${this.lambda.functionName}`)

      const removeTargetsParams = {
        Rule: this.lambda.functionName,
        Ids: [this.lambda.functionName]
      }

      await cloudWatchEvents.removeTargets(removeTargetsParams).promise()

      const deleteRuleParams = {
        Name: this.lambda.functionName
      }

      await cloudWatchEvents.deleteRule(deleteRuleParams).promise()
    }
  }

export default AwsEventsRule
