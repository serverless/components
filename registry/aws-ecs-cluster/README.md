<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Ecs Cluster

Provision AWS ECS Cluster with Serverless Components
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
| **clusterName**| `string` | The name of the cluster

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **clusterArn**| `string` | The ARN that identifies the cluster

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsEcsCluster:
    type: aws-ecs-cluster
    inputs:
      clusterName: my-cluster

```
<!-- AUTO-GENERATED-CONTENT:END -->
