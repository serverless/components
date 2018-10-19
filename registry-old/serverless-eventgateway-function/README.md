<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Serverless Eventgateway Function

Manages Event Gateway function registrations
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
| **space**| `string` | The Event Gateway space which should be used
| **url**| `string`<br/>*required* | The Event Gateway URL
| **accessKey**| `string`<br/>*required* | The access key used to authenticate with the hosted Event Gateway
| **functionId**| `string`<br/>*required* | The function id which is used to register the function
| **functionType**| `string`<br/>*required* | The function type
| **provider**| `object`<br/>*required* | Function related provider specification

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **functionId**| `string` | The function id which is used to register the function

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myServerlessEventgatewayFunction:
    type: serverless-eventgateway-function
    inputs:
      space: acme-marketing-space
      url: 'http://localhost'
      accessKey: s0m34c355k3y
      functionId: sendEmail
      functionType: awslambda
      provider:
        arn: 'arn:aws:lambda:us-east-1:12345:function:example'
        region: us-east-1

```
<!-- AUTO-GENERATED-CONTENT:END -->
