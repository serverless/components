<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sqs

Provision AWS SQS components
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
| **queueName**| `string` | The name of the SQS to create
| **delaySeconds**| `string` | The length of time, in seconds, for which the delivery of all messages in the queue is delayed
| **maximumMessageSize**| `string` | The limit of how many bytes a message can contain before Amazon SQS rejects it. Valid values- An integer from 1,024 bytes (1 KiB) to 262,144 bytes (256 KiB)
| **messageRetentionPeriod**| `string` | The length of time, in seconds, for which Amazon SQS retains a message. Valid values- An integer from 60 seconds (1 minute) to 1,209,600 seconds (14 days)
| **receiveMessageWaitTimeSeconds**| `string` | The length of time, in seconds, for which a ReceiveMessage action waits for a message to arrive. Valid values- An integer from 0 to 20 (seconds)
| **visibilityTimeout**| `string` | The visibility timeout for the queue, in seconds. Valid values- An integer from 0 to 43,200 (12 hours). Default- 30.
| **fifoQueue**| `boolean` | Designates a queue as FIFO. Valid values- true, false
| **contentBasedDeduplication**| `boolean` | Enables content-based deduplication. Valid values- true, false

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **queueUrl**| `string` | The name of the role

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSqs:
    type: aws-sqs
    inputs:
      queueName: myQueue
      delaySeconds: '22'
      maximumMessageSize: '1024'
      messageRetentionPeriod: '60'
      receiveMessageWaitTimeSeconds: '2'
      visibilityTimeout: '20'
      fifoQueue: true

```
<!-- AUTO-GENERATED-CONTENT:END -->