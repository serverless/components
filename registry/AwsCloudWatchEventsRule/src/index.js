import { get, resolve } from '@serverless/utils'

const AwsCloudWatchEventsRule = (SuperClass) =>
  class extends SuperClass {
    hydrate(prevInstance) {
      super.hydrate(prevInstance)
      this.arn = get('arn', prevInstance)
    }

    async sync() {
      let { provider } = this
      provider = resolve(provider)
      const AWS = provider.getSdk()
      const CloudWatchEvents = new AWS.CloudWatchEvents()

      try {
        const res = await CloudWatchEvents.describeRule({
          Name: get('functionName', get('lambda', this))
        }).promise()
        this.schedule = res.ScheduleExpression
        this.enabled = res.State === 'ENABLED' ? true : false
      } catch (e) {
        if (e.code === 'ResourceNotFoundException') {
          return 'removed'
        }
        throw e
      }
    }

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
        StatementId: `${this.lambda.functionName}-cron`,
        Principal: 'events.amazonaws.com'
      }

      try {
        await lambda.addPermission(addPermissionParams).promise()
      } catch (e) {
        // if we are making an update, permissions are already added...
        if (e.code !== 'ResourceConflictException') {
          throw e
        }
      }
    }

    async remove(context) {
      const AWS = this.provider.getSdk()
      const cloudWatchEvents = new AWS.CloudWatchEvents()

      context.log(`Removing Schedule: ${this.lambda.functionName}`)

      const removeTargetsParams = {
        Rule: this.lambda.functionName,
        Ids: [this.lambda.functionName]
      }

      try {
        await cloudWatchEvents.removeTargets(removeTargetsParams).promise()
      } catch (error) {
        if (error.code !== 'ResourceNotFoundException') {
          throw error
        }
      }

      const deleteRuleParams = {
        Name: this.lambda.functionName
      }

      try {
        await cloudWatchEvents.deleteRule(deleteRuleParams).promise()
      } catch (error) {
        if (error.code !== 'InternalException') {
          throw error
        }
      }
    }
  }

export default AwsCloudWatchEventsRule
