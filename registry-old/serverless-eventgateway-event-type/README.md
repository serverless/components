<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Serverless Eventgateway Event Type

Manages Event Gateway Event Types
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
| **authorizerId**| `string` | The authorizer function id
| **url**| `string`<br/>*required* | The Event Gateway URL
| **accessKey**| `string`<br/>*required* | The access key used to authenticate with the hosted Event Gateway
| **name**| `string`<br/>*required* | The event type name

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The event type name

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myServerlessEventgatewayEventType:
    type: serverless-eventgateway-event-type
    inputs:
      space: acme-marketing-space
      authorizerId: authorizerFunction
      url: 'http://localhost'
      accessKey: s0m34c355k3y
      name: user.created

```
<!-- AUTO-GENERATED-CONTENT:END -->
