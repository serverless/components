<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS S3 Bucket

Provision AWS s3 buckets with serverless components
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
| **name**| `string` | The name of your S3 bucket. Name must be globally unique in AWS

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The S3 bucket name

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsS3Bucket:
    type: aws-s3-bucket
    inputs:
      name: 'my-project-bucket-${self.instanceId}'

```
<!-- AUTO-GENERATED-CONTENT:END -->
