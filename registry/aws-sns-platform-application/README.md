<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Sns Platform Application

Provision AWS SNS Platform Application with Serverless Components
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
| **name**| `string`<br/>*required* | The name of your SNS platform application
| **platform**| `string`<br/>*required* | The platform application is using, possible values are ADM, APNS, APNS_SANDBOX, and GCM
| **attributes**| `object`<br/>*required* | Platform specific attributes, see https://docs.aws.amazon.com/sns/latest/api/API_SetPlatformApplicationAttributes.html

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **arn**| `string` | Platform Application Arn

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSnsPlatformApplication:
    type: aws-sns-platform-application
    inputs:
      name: my_platform_application
      platform: https
      attributes: 'https://example.com/'

```
<!-- AUTO-GENERATED-CONTENT:END -->
