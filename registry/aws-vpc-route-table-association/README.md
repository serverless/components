<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Vpc Route Table Association

Provision AWS VPC Route Table Association with Serverless Components
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
| **routeTableId**| `string`<br/>*required* | AWS VPC route table id
| **subnetId**| `string`<br/>*required* | AWS subnet id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **associationId**| `string` | Route table association id

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsVpcRouteTableAssociation:
    type: aws-vpc-route-table-association
    inputs:
      routeTableId: rtb-abbaabba
      subnetId: subnet-abbaabba

```
<!-- AUTO-GENERATED-CONTENT:END -->
