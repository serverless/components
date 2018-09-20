<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Ecs Service

Provision AWS ECS Service with Serverless Components
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
| **loadBalancers**| `array` | A load balancer object representing the load balancer to use with your service. Currently, you are limited to one load balancer or target group per service. After you create a service, the load balancer name or target group ARN, container name, and container port specified in the service definition are immutable. For Classic Load Balancers, this object must contain the load balancer name, the container name (as it appears in a container definition), and the container port to access from the load balancer. When a task from this service is placed on a container instance, the container instance is registered with the load balancer specified here. For Application Load Balancers and Network Load Balancers, this object must contain the load balancer target group ARN, the container name (as it appears in a container definition), and the container port to access from the load balancer. When a task from this service is placed on a container instance, the container instance and port combination is registered as a target in the target group specified here. Services with tasks that use the awsvpc network mode (for example, those with the Fargate launch type) only support Application Load Balancers and Network Load Balancers; Classic Load Balancers are not supported. Also, when you create any target groups for these services, you must choose ip as the target type, not instance, because tasks that use the awsvpc network mode are associated with an elastic network interface, not an Amazon EC2 instance.
| **deploymentConfiguration**| `object` | Optional deployment parameters that control how many tasks run during the deployment and the ordering of stopping and starting tasks.
| **desiredCount**| `integer` | The number of instantiations of the specified task definition to place and keep running on your cluster.
| **healthCheckGracePeriodSeconds**| `integer` | The period of time, in seconds, that the Amazon ECS service scheduler should ignore unhealthy Elastic Load Balancing target health checks after a task has first started. This is only valid if your service is configured to use a load balancer. If your service's tasks take a while to start and respond to Elastic Load Balancing health checks, you can specify a health check grace period of up to 7,200 seconds during which the ECS service scheduler ignores health check status. This grace period can prevent the ECS service scheduler from marking tasks as unhealthy and stopping them before they have time to come up.
| **networkConfiguration**| `object` | The network configuration for the service. This parameter is required for task definitions that use the awsvpc network mode to receive their own Elastic Network Interface, and it is not supported for other network modes
| **launchType**| `string` | The launch type on which to run your service.
| **placementStrategy**| `array` | The placement strategy objects to use for tasks in your service. You can specify a maximum of five strategy rules per service.
| **platformVersion**| `string` | The platform version on which to run your service. If one is not specified, the latest version is used by default.
| **role**| `string` | The name or full Amazon Resource Name (ARN) of the IAM role that allows Amazon ECS to make calls to your load balancer on your behalf. This parameter is only permitted if you are using a load balancer with your service and your task definition does not use the awsvpc network mode. If you specify the role parameter, you must also specify a load balancer object with the loadBalancers parameter. If your specified role has a path other than /, then you must either specify the full role ARN (this is recommended) or prefix the role name with the path. For example, if a role with the name bar has a path of /foo/ then you would specify /foo/bar as the role name. For more information, see Friendly Names and Paths in the IAM User Guide.
| **schedulingStrategy**| `string` | The scheduling strategy to use for the service. For more information, see Services. There are two service scheduler strategies available, REPLICA-The replica scheduling strategy places and maintains the desired number of tasks across your cluster. By default, the service scheduler spreads tasks across Availability Zones. You can use task placement strategies and constraints to customize task placement decisions. DAEMON-The daemon scheduling strategy deploys exactly one task on each active container instance that meets all of the task placement constraints that you specify in your cluster. When using this strategy, there is no need to specify a desired number of tasks, a task placement strategy, or use Service Auto Scaling policies. Note, Fargate tasks do not support the DAEMON scheduling strategy.
| **serviceRegistries**| `array` | The details of the service discovery registries to assign to this service. For more information, see Service Discovery.
| **cluster**| `string` | The short name or full Amazon Resource Name (ARN) of the cluster on which to run your service. If you do not specify a cluster, the default cluster is assumed.
| **placementConstraints**| `array` | An array of placement constraint objects to use for tasks in your service. You can specify a maximum of 10 constraints per task (this limit includes constraints in the task definition and those specified at run time).
| **taskDefinition**| `any`<br/>*required* | A reference to an AWS ECS TaskDefinition component, the family and revision (family:revision) or full ARN of the task definition to run in your service. If a revision is not specified, the latest ACTIVE revision is used.
| **serviceName**| `string`<br/>*required* | The name of your service. Up to 255 letters (uppercase and lowercase), numbers, hyphens, and underscores are allowed. Service names must be unique within a cluster, but you can have similarly named services in multiple clusters within a Region or across multiple Regions.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **serviceArn**| `string` | The ARN that identifies the service. The ARN contains the arn:aws:ecs namespace, followed by the Region of the service, the AWS account ID of the service owner, the service namespace, and then the service name. For example, arn:aws:ecs:region:012345678910:service/my-service .
| **desiredCount**| `integer` | The desired number of instantiations of the task definition to keep running on the service.
| **runningCount**| `integer` | The number of tasks in the cluster that are in the RUNNING state.
| **pendingCount**| `integer` | The number of tasks in the cluster that are in the PENDING state.
| **launchType**| `string` | The launch type on which your service is running.
| **status**| `string` | The status of the service. The valid values are ACTIVE, DRAINING, or INACTIVE.
| **taskDefinition**| `string` | The task definition to use for tasks in the service.
| **deploymentConfiguration**| `object` | Optional deployment parameters that control how many tasks run during the deployment and the ordering of stopping and starting tasks.
| **deployments**| `array` | The current state of deployments for the service.
| **roleArn**| `string` | The ARN of the IAM role associated with the service that allows the Amazon ECS container agent to register container instances with an Elastic Load Balancing load balancer.
| **createdAt**| `any` | The Unix time stamp for when the service was created.
| **serviceRegisteries**| `string` | Array of ServiceRegistry objects
| **placementConstraints**| `array` | The placement constraints for the tasks in the service.
| **loadBalancers**| `array` | A list of Elastic Load Balancing load balancer objects, containing the load balancer name, the container name (as it appears in a container definition), and the container port to access from the load balancer. Services with tasks that use the awsvpc network mode (for example, those with the Fargate launch type) only support Application Load Balancers and Network Load Balancers; Classic Load Balancers are not supported. Also, when you create any target groups for these services, you must choose ip as the target type, not instance, because tasks that use the awsvpc network mode are associated with an elastic network interface, not an Amazon EC2 instance.
| **placementStrategy**| `array` | The placement strategy that determines how tasks for the service are placed.
| **clusterArn**| `string` | The Amazon Resource Name (ARN) of the cluster that hosts the service.
| **networkConfiguration**| `object` | The VPC subnet and security group configuration for tasks that receive their own elastic network interface by using the awsvpc networking mode.
| **events**| `array` | The event stream for your service. A maximum of 100 of the latest events are displayed.
| **healthCheckGracePeriodSeconds**| `integers` | The period of time, in seconds, that the Amazon ECS service scheduler ignores unhealthy Elastic Load Balancing target health checks after a task has first started.
| **serviceName**| `string` | The name of your service. Up to 255 letters (uppercase and lowercase), numbers, hyphens, and underscores are allowed. Service names must be unique within a cluster, but you can have similarly named services in multiple clusters within a Region or across multiple Regions.
| **schedulingStrategy**| `string` | The scheduling strategy to use for the service. For more information, see Services. There are two service scheduler strategies available, REPLICA-The replica scheduling strategy places and maintains the desired number of tasks across your cluster. By default, the service scheduler spreads tasks across Availability Zones. You can use task placement strategies and constraints to customize task placement decisions. DAEMON-The daemon scheduling strategy deploys exactly one task on each active container instance that meets all of the task placement constraints that you specify in your cluster. When using this strategy, there is no need to specify a desired number of tasks, a task placement strategy, or use Service Auto Scaling policies. Note, Fargate tasks do not support the DAEMON scheduling strategy.
| **platformVersion**| `string` | The platform version on which your task is running.

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsEcsService:
    type: aws-ecs-service
    inputs:
      desiredCount: 10
      launchType: FARGATE
      taskDefinition: '${myECSTaskDefinition}'
      serviceName: myAwsEcsService

```
<!-- AUTO-GENERATED-CONTENT:END -->
