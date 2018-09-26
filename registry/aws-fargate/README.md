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
| **cpu**| `string` | The number of CPU units used by the task.
| **memory**| `string` | The amount of memory (in MiB) used by the task.
| **exposePublically**| `boolean` | Whether to assign a public IP address to container instances or not.
| **awsVpcConfiguration**| `object` | The VPC subnets and security groups associated with a task. AwsVpcConfiguration definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_AwsVpcConfiguration.html
| **serviceName**| `string`<br/>*required* | The name of your service. Up to 255 letters (uppercase and lowercase), numbers, hyphens, and underscores are allowed. Service names must be unique within a cluster, but you can have similarly named services in multiple clusters within a Region or across multiple Regions.
| **containerDefinitions**| `array`<br/>*required* | A list of container definitions that describe the different containers that make up your task. ContainerDefinition definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html
| **desiredCount**| `integer`<br/>*required* | The number of instantiations of the specified task definition to place and keep running on your cluster.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **serviceArn**| `string` | The ARN that identifies the service.
| **serviceName**| `string` | The name of your service.
| **containers**| `array` | The containers associated with the tasks. Container definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Container.html
| **attachments**| `array` | The attachments associated with the tasks. Attachment definition: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Attachment.html
| **networkInterfaces**| `array` | Information about one or more network interfaces attached to the Tasks. Network Interface definition: https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_NetworkInterface.html

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsFargate:
    type: aws-fargate
    inputs:
      cpu: '256'
      memory: '512'
      exposePublically: true
      serviceName: myAwsEcsFargateService
      containerDefinitions:
        - name: nginx
          essential: true
          image: 'nginx:1.7.9'
          portMappings:
            - containerPort: 80
              hostPort: 80
              protocol: tcp
      desiredCount: 1

```
<!-- AUTO-GENERATED-CONTENT:END -->
