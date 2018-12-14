<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Step Functions

A Serverless Component for AWS Step Function
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
| **name**| `string`<br/>*required* | The name of the state machine
| **definition**| `object`<br/>*required* | The Amazon States Language definition of the state machine.
| **roleArn**| `string`<br/>*required* | The Amazon Resource Name (ARN) of the IAM role to use for this state machine.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **stateMachineArn**| `string` | The Amazon Resource Name (ARN) that identifies the created state machine.
| **creationDate**| `string` | The date the state machine is created.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example 
```
type: my-project
version: 0.0.1

components:
  StepFunction:
    type: aws-step-functions
    inputs:
      name: MainStateMachine
      definition:
          StartAt: HelloWorld
          States:
            HelloWorld:
              Type: Pass
              Result: Hello World!
              End: true
      roleArn: ${myRole.arn}
  myRole:
    type: aws-iam-role@0.2.0
    inputs:
      service: lambda.amazonaws.com

```
<!-- AUTO-GENERATED-CONTENT:END -->

