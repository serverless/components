<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS IAM Role

Provision AWS IAM Roles with serverless components
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **service**| `string`<br/>*required* | The name of the AWS service to create role for
| **name**| `string` | The name of the role to create.
| **policy**| `object` | The policy that grants an entity permission to assume the role.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsIamRole:
    type: aws-iam-role
    inputs:
      service: lambda.amazonaws.com

```
<!-- AUTO-GENERATED-CONTENT:END -->
