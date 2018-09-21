<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Security Group

My component description
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
| **vpcId**| `string`<br/>*required* | The id of the VPC
| **groupName**| `string` | Security Group Name
| **description**| `string` | Security group description

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **groupId**| `string` | The Group id of the security group

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSecurityGroup:
    type: aws-security-group
    inputs:
      vpcId: vpc-abbaabba
      groupName: my-security-group
      description: Security group for my Fargate container

```
<!-- AUTO-GENERATED-CONTENT:END -->
