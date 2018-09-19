<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Ecs Taskdefinition

Provision AWS ECS TaskDefinition with Serverless Components
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
| **placementConstraints**| `object` | placementConstraints
| **volumes**| `array` | volumes
| **cpu**| `integer` | cpu
| **memory**| `integer` | memory
| **networkMode**| `string` | networkMode
| **requiresCompatibilities**| `array` | requiresCompatibilities
| **executionRoleArn**| `string` | executionRoleArn
| **taskRoleArn**| `string` | taskRoleArn
| **containerDefinitions**| `array` | containerDefinitions
| **family**| `string`<br/>*required* | family

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **taskDefinitionArn**| `string` | taskDefinitionArn
| **executionRoleArn**| `string` | executionRoleArn
| **networkMode**| `string` | networkMode
| **revisions**| `integer` | revisions
| **taskRoleArn**| `string` | taskRoleArn
| **status**| `string` | status
| **requiresAttributes**| `string` | requiresAttributes
| **placementConstraints**| `array` | placementConstraints
| **compatibilities**| `array` | compatibilities
| **requiresCompatibilities**| `string` | requiresCompatibilities
| **family**| `string` | family
| **cpu**| `string` | cpu
| **containerDescriptions**| `array` | containerDescriptions
| **memory**| `string` | memory
| **volumes**| `array` | volumes

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsEcsTaskdefinition:
    type: aws-ecs-taskdefinition
    inputs:
      volumes: []
      containerDefinitions:
        - name: sleep
          command:
            - sleep
            - '360'
          cpu: 10
          essential: true
          image: busybox
          memory: 10
      family: sleep360

```
<!-- AUTO-GENERATED-CONTENT:END -->
