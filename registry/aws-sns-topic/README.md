<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sns Topic
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **displayName**| `string` | The display name of your SNS topic
| **deliveryPolicy**| `object` | The delivery policy for your SNS topic
| **name**| `string`<br/>*required* | The name of your SNS topic

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSnsTopic:
    type: aws-sns-topic
    inputs:
      displayName: My SNS display name
      deliveryPolicy:
        http:
          defaultHealthyRetryPolicy:
            minDelayTarget: 20
            maxDelayTarget: 20
            numRetries: 3
            numMaxDelayRetries: 0
            numNoDelayRetries: 0
            numMinDelayRetries: 2
            backoffFunction: linear
          disableSubscriptionOverrides: true
          defaultThrottlePolicy:
            maxReceivesPerSecond: 3
      name: 'my-project-sns-${self.instanceId}'

```
<!-- AUTO-GENERATED-CONTENT:END -->
