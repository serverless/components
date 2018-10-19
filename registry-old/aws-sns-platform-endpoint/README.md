<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sns Platform Endpoint

Provision AWS SNS Platform Endpoint with Serverless Components
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
| **attributes**| `object` | Endpoint attributes, see https://docs.aws.amazon.com/sns/latest/api/API_SetEndpointAttributes.html
| **customUserData**| `string` | User data to associate with the endpoint
| **platformApplication**| `string`<br/>*required* | The Arn of SNS platform application
| **token**| `string`<br/>*required* | Unique id that is generated for an app in the device by the notification service

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **arn**| `string` | Endpoint Arn

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSnsPlatformEndpoint:
    type: aws-sns-platform-endpoint
    inputs:
      attributes:
        Enabled: true
      customUserData: SomeUserData
      platformApplication: 'arn:aws:sns:us-east-1:000000000000:app/GCM/some-application-name'
      token: >-
        APA91bGi7fFachkC1xjlqT66VYEucGHochmf1VQAr9kererjsM0PKPxKhddCzx6paEsyay9Zn3D4wNUJb8m6HZrBEXAMPLE

```
<!-- AUTO-GENERATED-CONTENT:END -->
