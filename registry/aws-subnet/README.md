<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Subnet

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
| **vpcId**| `string` | The id of the VPC
| **availabilityZone**| `string` | Availability Zone for the Subnet
| **cidrBlock**| `string` | CIDR Block for the Subnet
| **ipv6CidrBlock**| `string` | IPv6 CIDR Block for the Subnet

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **subnetId**| `string` | Subnet id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSubnet:
    type: aws-subnet
    inputs:
      vpcId: us-east-1a
      availabilityZone: us-east-1a
      cidrBlock: 10.0.0.0/24
      ipv6CidrBlock: '2600:1f18:24c2:b200::/64'

```
<!-- AUTO-GENERATED-CONTENT:END -->
