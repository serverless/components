<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Vpcgatewayattachment

Provision AWS VPC Gateway Attachment with Serverless Components
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
| **internetGatewayId**| `string`<br/>*required* | Intenet Gateway Id
| **vpcId**| `string`<br/>*required* | The id of the VPC

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **internetGatewayId**| `string` | Intenet Gateway Id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsVpcgatewayattachment:
    type: aws-vpcgatewayattachment
    inputs:
      internetGatewayId: igw-abbaabba
      vpcId: vpc-abbaabba

```
<!-- AUTO-GENERATED-CONTENT:END -->
