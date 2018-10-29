import { pick, equals } from '@serverless/utils'

const AwsEventsRule = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)
      this.provider = inputs.provider
      this.lambda = inputs.lambda
      this.enabled = inputs.enabled
      this.schedule = inputs.schedule
    }
    shouldDeploy(prevInstance) {
      if (!prevInstance) {
        return 'deploy'
      }
      if (prevInstance.schedule !== this.schedule) {
        return 'replace'
      }
      return 'deploy'
    }
    async deploy(prevInstance = {}, context) {
      const provider = this.provider
      this.functionRuleName = this.lambda.getId().split(':')[
        this.lambda.getId().split(':').length - 1
      ]
      const AWS = provider.getSdk()
      const cloudWatchEvents = new AWS.CloudWatchEvents()
      const lambda = new AWS.Lambda()

      const inputsProps = ['functionRuleName', 'schedule', 'enabled']
      const inputs = pick(inputsProps, this)
      const prevInputs = pick(inputsProps, prevInstance || {})
      const noChanges = equals(inputs, prevInputs)

      if (noChanges) {
        return this
      }

      context.log('Creating Schedule...')

      const State = this.enabled ? 'ENABLED' : 'DISABLED'

      const putRuleParams = {
        Name: this.functionRuleName,
        ScheduleExpression: this.schedule,
        State
      }

      const putRuleRes = await cloudWatchEvents.putRule(putRuleParams).promise()

      this.arn = putRuleRes.RuleArn

      const putTargetsParams = {
        Rule: this.functionRuleName,
        Targets: [
          {
            Arn: this.lambda.getId(),
            Id: this.functionRuleName
          }
        ]
      }

      await cloudWatchEvents.putTargets(putTargetsParams).promise()

      const addPermissionParams = {
        Action: 'lambda:InvokeFunction',
        FunctionName: this.functionRuleName,
        StatementId: `${this.functionRuleName}-${Math.random()
          .toString(36)
          .substring(7)}`,
        Principal: 'events.amazonaws.com'
      }

      await lambda.addPermission(addPermissionParams).promise()
      context.log('Schedule Created.')
    }
    async remove(context) {
      const AWS = this.provider.getSdk()
      const cloudWatchEvents = new AWS.CloudWatchEvents()

      context.log('Removing Schedule...')

      const removeTargetsParams = {
        Rule: this.functionRuleName,
        Ids: [this.functionRuleName]
      }

      await cloudWatchEvents.removeTargets(removeTargetsParams).promise()

      const deleteRuleParams = {
        Name: this.functionRuleName
      }

      await cloudWatchEvents.deleteRule(deleteRuleParams).promise()

      context.log('Schedule Removed.')
    }
  }

export default AwsEventsRule
