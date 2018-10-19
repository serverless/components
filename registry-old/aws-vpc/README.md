<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Vpc

Provision AWS VPC with Serverless Components
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
| **cidrBlock**| `string` | CIDR Block for the VPC
| **amazonProvidedIpv6CidrBlock**| `boolean` | CIDR Block for the VPC
| **instanceTenancy**| `string` | Instance Tenancy, possible values default, dedicated or host.

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **vpcId**| `string` | VPC id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsVpc:
    type: aws-vpc
    inputs:
      cidrBlock: 10.0.0.0/16
      amazonProvidedIpv6CidrBlock: true
      instanceTenancy: default

```
<!-- AUTO-GENERATED-CONTENT:END -->
