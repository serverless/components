<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Vpc Route Table

Provision AWS VPC Route Table with Serverless Components
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

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **routeTableId**| `string` | The route table id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsVpcRouteTable:
    type: aws-vpc-route-table
    inputs:
      vpcId: vpc-abbaabba

```
<!-- AUTO-GENERATED-CONTENT:END -->
