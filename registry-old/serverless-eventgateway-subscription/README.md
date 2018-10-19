<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Serverless Eventgateway Subscription

Manages Event Gateway Subscriptions
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
| **path**| `string` | The subscriptions path
| **method**| `string` | The subscriptions method
| **url**| `string`<br/>*required* | The Event Gateway URL
| **accessKey**| `string`<br/>*required* | The access key used to authenticate with the hosted Event Gateway
| **subscriptionType**| `string`<br/>*required* | Subscription type (`sync` or `async`)
| **eventType**| `string`<br/>*required* | The event type name
| **functionId**| `string`<br/>*required* | The function id which should be used for the subscription

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **subscriptionId**| `string` | The subscription id

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myServerlessEventgatewaySubscription:
    type: serverless-eventgateway-subscription
    inputs:
      space: acme-marketing-space
      path: /acme
      method: POST
      url: 'http://localhost'
      accessKey: s0m34c355k3y
      subscriptionType: async
      eventType: user.created
      functionId: sendEmail

```
<!-- AUTO-GENERATED-CONTENT:END -->
