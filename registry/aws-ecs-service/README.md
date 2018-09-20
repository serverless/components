<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Ecs Service

Provision AWS ECS Service with Serverless Components
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **loadBalancers**| `array` | loadBalancers
| **deploymentConfiguration**| `object` | deploymentConfiguration
| **desiredCount**| `integer` | desiredCount
| **healthCheckGracePeriodSeconds**| `integer` | healthCheckGracePeriodSeconds
| **networkConfiguration**| `object` | networkConfiguration
| **launchType**| `string` | launchType
| **placementStrategy**| `array` | placementStrategy
| **platformVersion**| `string` | platformVersion
| **role**| `string` | role
| **schedulingStrategy**| `string` | schedulingStrategy
| **serviceRegistries**| `array` | serviceRegistries
| **cluster**| `string` | cluster
| **placementConstraints**| `array` | placementConstraints
| **taskDefinition**| `string`<br/>*required* | taskDefinition
| **serviceName**| `string`<br/>*required* | serviceName

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **serviceArn**| `string` | serviceArn
| **runningCount**| `integer` | runningCount
| **pendingCount**| `integer` | pendingCount
| **launchType**| `string` | launchType
| **desiredCount**| `integer` | desiredCount
| **taskDefinition**| `string` | taskDefinition
| **deploymentConfiguration**| `object` | deploymentConfiguration
| **deployments**| `array` | deployments
| **roleArn**| `string` | roleArn
| **createdAt**| `any` | createdAt
| **status**| `string` | status
| **placementConstraints**| `array` | placementConstraints
| **serviceRegisteries**| `string` | serviceRegisteries
| **placementStrategy**| `array` | placementStrategy
| **loadBalancers**| `array` | loadBalancers
| **networkConfiguration**| `object` | networkConfiguration
| **clusterArn**| `string` | clusterArn
| **healthCheckGracePeriodSeconds**| `integers` | healthCheckGracePeriodSeconds
| **serviceName**| `string` | serviceName
| **schedulingStrategy**| `string` | schedulingStrategy
| **platformVersion**| `string` | platformVersion

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsEcsService:
    type: aws-ecs-service
    inputs:
      desiredCount: 10
      launchType: FARGATE
      taskDefinition: '${myECSTaskDefinition}'
      serviceName: myAwsEcsService

```
<!-- AUTO-GENERATED-CONTENT:END -->
