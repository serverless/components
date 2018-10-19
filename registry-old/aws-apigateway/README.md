<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Apigateway

Provision AWS API Gateway with serverless components.
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Output Types](#output-types)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **roleArn**| `string`<br/>*required* | AWS Arn role for API gateway to assume
| **routes**| `object`<br/>*required* | Declaration of routes
| **name**| `string` | Name of API gateway in AWS console

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **id**| `string` | API Gateways id
| **url**| `string` | The API Gateways base URL
| **urls**| `array` | All the generated API Gateway URLs

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->

<!-- AUTO-GENERATED-CONTENT:END -->
