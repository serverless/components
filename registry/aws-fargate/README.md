<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Fargate

Provision AWS ECS Fargate Service with Serverless Components
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
| **exposePublically**| `boolean` | exposePublically
| **cpu**| `string` | cpu
| **memory**| `string` | memory
| **awsVpcConfiguration**| `object` | awsVpcConfiguration
| **serviceName**| `string`<br/>*required* | serviceName
| **containerDefinitions**| `array`<br/>*required* | A list of container definitions in JSON format that describe the different containers that make up your task.
| **desiredCount**| `integer`<br/>*required* | desiredCount

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **serviceArn**| `string` | The ARN that identifies the service.
| **serviceName**| `string` | The name of your service.
| **containers**| `array` | The containers associated with the tasks. Container definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Container.html
| **attachments**| `array` | The attachments associated with the tasks. Attachment definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Attachment.html

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsFargate:
    type: aws-fargate
    inputs:
      exposePublically: true
      cpu: '256'
      memory: '512'
      awsVpcConfiguration:
        securityGroups:
          - SECURITYGROUP_ID_HERE
        subnets:
          - SUBNET_ID_HERE
      serviceName: myAwsEcsFargateService
      containerDefinitions:
        - name: hello
          essential: true
          image: nginx:1.7.9
          portMappings:
          - containerPort: 80
            hostPort: 80
            protocol: tcp
      desiredCount: 1

```
<!-- AUTO-GENERATED-CONTENT:END -->
