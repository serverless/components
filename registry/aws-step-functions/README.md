#  AWS Step Function

A Serverless Component for AWS Step Function

- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)


## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The name of the state machine
| **definition**| `string` | The Amazon States Language definition of the state machine.
| **roleArn**| `string` | The Amazon Resource Name (ARN) of the IAM role to use for this state machine.

## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **stateMachineArn**| `string` | The Amazon Resource Name (ARN) that identifies the created state machine.
| **creationDate**| `string` | The date the state machine is created.

##Example 
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


