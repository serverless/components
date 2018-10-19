<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Internetgateway

Provision AWS Internet Gateway with Serverless Components
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
| **vpcId**| `string` | The id of the VPC, if set the Internet Gateway is attached to the VPC, otherwise it is created detatched

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
  myAwsInternetgateway:
    type: aws-internetgateway
    inputs:
      vpcId: vpc-abbaabba

```
<!-- AUTO-GENERATED-CONTENT:END -->
