<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Eventgateway

Event Gateway Serverless Component.
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
| **cors**| `boolean` | cors
| **method**| `string` | method
| **eventGatewayApiKey**| `string` | API key of your event gateway space
| **event**| `string`<br/>*required* | event
| **path**| `string`<br/>*required* | path
| **space**| `string`<br/>*required* | space
| **lambdaArn**| `string`<br/>*required* | The ARN of the lambda function being called by the event gateway

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **subscriptionId**| `string` | The generated subscription id
| **url**| `string` | The generated URL

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myEventgateway:
    type: eventgateway
    inputs:
      lambdaArn: 'arn:aws:lambda:us-east-1:123456789012:function:ProcessKinesisRecords'

```
<!-- AUTO-GENERATED-CONTENT:END -->
