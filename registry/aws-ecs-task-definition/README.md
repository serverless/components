<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Ecs Task Definition

Provision AWS ECS TaskDefinition with Serverless Components
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
| **cpu**| `integer` | The number of CPU units used by the task. It can be expressed as an integer using CPU units, for example 1024, or as a string using vCPUs, for example 1 vCPU or 1 vcpu, in a task definition.
| **memory**| `integer` | The amount of memory (in MiB) used by the task. It can be expressed as an integer using MiB, for example 1024, or as a string using GB, for example 1GB or 1 GB, in a task definition.
| **networkMode**| `string` | The Docker networking mode to use for the containers in the task. The valid values are none, bridge, awsvpc, and host. The default Docker network mode is bridge. If using the Fargate launch type, the awsvpc network mode is required. If using the EC2 launch type, any network mode can be used. If the network mode is set to none, you can't specify port mappings in your container definitions, and the task's containers do not have external connectivity. The host and awsvpc network modes offer the highest networking performance for containers because they use the EC2 network stack instead of the virtualized network stack provided by the bridge mode. With the host and awsvpc network modes, exposed container ports are mapped directly to the corresponding host port (for the host network mode) or the attached elastic network interface port (for the awsvpc network mode), so you cannot take advantage of dynamic host port mappings. If the network mode is awsvpc, the task is allocated an Elastic Network Interface, and you must specify a NetworkConfiguration when you create a service or run a task with the task definition. For more information, see Task Networking in the Amazon Elastic Container Service Developer Guide. If the network mode is host, you can't run multiple instantiations of the same task on a single container instance when port mappings are used. Docker for Windows uses different network modes than Docker for Linux. When you register a task definition with Windows containers, you must not specify a network mode.
| **placementConstraints**| `object` | An array of placement constraint objects to use for the task. You can specify a maximum of 10 constraints per task (this limit includes constraints in the task definition and those specified at run time).
| **requiresCompatibilities**| `array` | The launch type required by the task. If no value is specified, it defaults to EC2.
| **executionRoleArn**| `string` | The Amazon Resource Name (ARN) of the task execution role that the Amazon ECS container agent and the Docker daemon can assume.
| **taskRoleArn**| `string` | The short name or full Amazon Resource Name (ARN) of the IAM role that containers in this task can assume. All containers in this task are granted the permissions that are specified in this role.
| **containerDefinitions**| `array` | A list of container definitions in JSON format that describe the different containers that make up your task.
| **volumes**| `array` | A list of volume definitions in JSON format that containers in your task may use.
| **family**| `string`<br/>*required* | You must specify a family for a task definition, which allows you to track multiple versions of the same task definition. The family is used as a name for your task definition. Up to 255 letters (uppercase and lowercase), numbers, hyphens, and underscores are allowed.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **taskDefinitionArn**| `string` | The full Amazon Resource Name (ARN) of the task definition.
| **executionRoleArn**| `string` | The Amazon Resource Name (ARN) of the task execution role that the Amazon ECS container agent and the Docker daemon can assume.
| **networkMode**| `string` | The Docker networking mode to use for the containers in the task. The valid values are none, bridge, awsvpc, and host. The default Docker network mode is bridge. If using the Fargate launch type, the awsvpc network mode is required. If using the EC2 launch type, any network mode can be used. If the network mode is set to none, you can't specify port mappings in your container definitions, and the task's containers do not have external connectivity. The host and awsvpc network modes offer the highest networking performance for containers because they use the EC2 network stack instead of the virtualized network stack provided by the bridge mode. With the host and awsvpc network modes, exposed container ports are mapped directly to the corresponding host port (for the host network mode) or the attached elastic network interface port (for the awsvpc network mode), so you cannot take advantage of dynamic host port mappings. If the network mode is awsvpc, the task is allocated an Elastic Network Interface, and you must specify a NetworkConfiguration when you create a service or run a task with the task definition. For more information, see Task Networking in the Amazon Elastic Container Service Developer Guide. If the network mode is host, you can't run multiple instantiations of the same task on a single container instance when port mappings are used. Docker for Windows uses different network modes than Docker for Linux. When you register a task definition with Windows containers, you must not specify a network mode. If you use the console to register a task definition with Windows containers, you must choose the <default> network mode object.
| **revisions**| `integer` | The revision of the task in a particular family. The revision is a version number of a task definition in a family. When you register a task definition for the first time, the revision is 1; each time you register a new revision of a task definition in the same family, the revision value always increases by one (even if you have deregistered previous revisions in this family).
| **taskRoleArn**| `string` | The ARN of the IAM role that containers in this task can assume. All containers in this task are granted the permissions that are specified in this role.
| **status**| `string` | The status of the task definition.
| **requiresAttributes**| `string` | The container instance attributes required by your task. This field is not valid if using the Fargate launch type for your task.
| **placementConstraints**| `array` | An array of placement constraint objects to use for tasks. This field is not valid if using the Fargate launch type for your task.
| **compatibilities**| `array` | The launch type to use with your task.
| **requiresCompatibilities**| `string` | The launch type the task is using.
| **family**| `string` | The family of your task definition, used as the definition name.
| **cpu**| `string` | cpu
| **containerDescriptions**| `array` | A list of container definitions in JSON format that describe the different containers that make up your task.
| **memory**| `string` | The amount (in MiB) of memory used by the task.
| **volumes**| `array` | The list of volumes in a task.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsEcsTaskDefinition:
    type: aws-ecs-task-definition
    inputs:
      containerDefinitions:
        - name: sleep
          command:
            - sleep
            - '360'
          cpu: 10
          essential: true
          image: busybox
          memory: 10
      volumes: []
      family: sleep360

```
<!-- AUTO-GENERATED-CONTENT:END -->
