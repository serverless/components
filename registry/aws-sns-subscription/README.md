<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sns Subscription

Provision AWS SNS Subscription with serverless components
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
| **endpoint**| `string` | The endpoint that you want to receive notifications
| **topic**| `string`<br/>*required* | The ARN of your SNS topic to subscribe
| **protocol**| `string`<br/>*required* | The protocol of the subscription, possible values are http, https, email, email-json, sms, sqs, application, and lambda

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **arn**| `string` | The subscription arn

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSnsSubscription:
    type: aws-sns-subscription
    inputs:
      endpoint: 'https://example.com/'
      topic: 'arn:aws:sns:us-east-1:123456789012:my_topic'
      protocol: https

```
<!-- AUTO-GENERATED-CONTENT:END -->
