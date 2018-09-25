<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Fargate

Provision AWS ECS Fargate Service with Serverless Components
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
| **cpu**| `string` | cpu
| **memory**| `string` | memory
| **serviceName**| `string`<br/>*required* | serviceName
| **containerDefinitions**| `array`<br/>*required* | A list of container definitions in JSON format that describe the different containers that make up your task.
| **desiredCount**| `integer`<br/>*required* | desiredCount
| **awsVpcConfiguration**| `object`<br/>*required* | awsVpcConfiguration

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
| **createdAt**| `datetime` | createdAt
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
  myAwsFargate:
    type: aws-fargate
    inputs:
      cpu: '256'
      memory: '512'
      serviceName: myAwsEcsFargateService
      containerDefinitions:
        - name: sleep
          command:
            - sleep
            - '360'
          essential: true
          image: busybox
      desiredCount: 1
      awsVpcConfiguration:
        assignPublicIp: DISABLED
        securityGroups: []
        subnets:
          - SUBNET_ID_HERE

```
<!-- AUTO-GENERATED-CONTENT:END -->
