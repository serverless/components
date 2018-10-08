<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Lambda

AWS Lambda Serverless Component
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
| **memory**| `number`<br/>*required* | The functions memory size in Megabyte
| **timeout**| `number`<br/>*required* | The function execution time at which Lambda should terminate the function
| **runtime**| `string`<br/>*required* | Runtime for the function.<br/>Possible values are java8, nodejs6.10, nodejs8.10, python2.7, python3.6 and dotnetcore1.0<br/>
| **handler**| `string`<br/>*required* | The path to the exported handler function
| **name**| `string` | The Lambda function name
| **description**| `string` | A short, user-defined function description.<br/>Lambda does not use this value. Assign a meaningful description as you see fit<br/>
| **root**| `string` | Path to source code
| **role**| `object` | The Amazon Resource Name (ARN) of the IAM role that Lambda assumes<br/>when it executes your function to access any other Amazon Web Services (AWS) resources<br/>
| **env**| `object` | Lambda functions environment's configuration settings

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **arn**| `string` | The Lambda functions arn
| **roleArn**| `string` | The arn of the created / managed role the Lambda function uses

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsLambda:
    type: aws-lambda
    inputs:
      memory: 512
      timeout: 3
      runtime: nodejs8.10
      handler: products.create
      name: 'myProject-functionName-${self.instanceId}'
      description: The function that does XYZ to ABC
      root: '${self.path}/code'
      env:
        foo: true
        tableName: 'products-${self.appId}'

```
<!-- AUTO-GENERATED-CONTENT:END -->
