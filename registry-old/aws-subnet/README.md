<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Subnet

Provision AWS Subnet with Serverless Components
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
| **cidrBlock**| `string` | CIDR Block for the Subnet
| **ipv6CidrBlock**| `string` | IPv6 CIDR Block for the Subnet
| **vpcId**| `string`<br/>*required* | The id of the VPC
| **availabilityZone**| `string`<br/>*required* | Availability Zone for the Subnet

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
      cidrBlock: 10.0.0.0/24
      ipv6CidrBlock: '2600:1f18:24c2:b200::/64'
      vpcId: vpc-abbaabba
      availabilityZone: us-east-1a

```
<!-- AUTO-GENERATED-CONTENT:END -->
