<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Vpc Route

Provision AWS VPC Route with Serverless Components
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
| **destinationCidrBlock**| `string` | Destination Ipv4 Cidr Block
| **destinationIpv6CidrBlock**| `string` | Destination Ipv6 Cidr Block
| **egressOnlyInternetGatewayId**| `string` | Egress Only Internet Gateway Id
| **gatewayId**| `string` | Gateway Id
| **instanceId**| `string` | Instance Id
| **natGatewayId**| `string` | Nat Gateway Id
| **networkInterfaceId**| `string` | NetworkInterface Id
| **routeTableId**| `string` | RouteTable Id
| **vpcPeeringConnectionId**| `string` | Vpc Peering Connection Id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **myOutput**| `string` | my output string

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsVpcRoute:
    type: aws-vpc-route
    inputs:
      destinationCidrBlock: 10.0.0.0/16
      destinationIpv6CidrBlock: '2600:1f18:24c2:b200::/64'
      egressOnlyInternetGatewayId: eigw-abbaabba
      gatewayId: igw-abbaabba
      instanceId: i-abbaabba
      natGatewayId: nat-abbaabba
      networkInterfaceId: eni-abbaabba
      routeTableId: rtb-abbaabba
      vpcPeeringConnectionId: pcx-abbaabba

```
<!-- AUTO-GENERATED-CONTENT:END -->
