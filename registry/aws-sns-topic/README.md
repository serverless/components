<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sns Topic

Provision AWS SNS Topic with serverless components
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
| **displayName**| `string` | The display name of your SNS topic
| **policy**| `object` | The policy for your SNS topic
| **deliveryPolicy**| `object` | The delivery policy for your SNS topic
| **name**| `string`<br/>*required* | The name of your SNS topic

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **arn**| `string` | The topic arn

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSnsTopic:
    type: aws-sns-topic
    inputs:
      displayName: My SNS Topic display name
      policy:
        Version: '2008-10-17'
        Id: policy_id
        Statement:
          - Effect: Allow
            Sid: statement_id
            Principal:
              AWS: '*'
            Action:
              - 'SNS:Publish'
              - 'SNS:RemovePermission'
              - 'SNS:SetTopicAttributes'
              - 'SNS:DeleteTopic'
              - 'SNS:ListSubscriptionsByTopic'
              - 'SNS:GetTopicAttributes'
              - 'SNS:Receive'
              - 'SNS:AddPermission'
              - 'SNS:Subscribe'
            Resource: 'arn:aws:sns:us-east-1:000000000000:my-sns-topic'
            Condition:
              StringEquals:
                'AWS:SourceOwner': '000000000000'
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
