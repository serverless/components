# AWS ELB

Provision AWS application and network loadbalancer with serverless components

- Input Types
- Output Types
- Example

## Input Types

| Name	  |                   Type |                      Description |
| ------ | ------ |------ |
|name	|                     string| 	                     Name of the ELB |
elbtype        |              string            |              Type of ELB application or network |
subnets	       |   array of strings	       |     List of subnets for the ELB |
securityGroups |        array of strings        |        List of security groups for the ELB |
scheme         |            string             |            Scheme of the ELB internet-facing or internal |
ipAddressType  |        string                  |        IpAddressType ipv4 or dualstack |
subnetMappings |             Array of SubnetMapping objects|   SubnetMapping for the ELB. Must be specified for network type.|
tags           |             Array of key value pairs. |        Tags to be attached with the ELB.|

## Output Types

|Name|	        Type |	Description|
| ------ | ------ |------ |
|loadBalancerArn |	string|	Amanzon resource name (ARN) of the ELB created.|

## EXAMPLE
```
type: my-application
components:
  myELB:
    type: aws-elb
    inputs:
      name: my-project-elb1
      subnets: ["subnet-0b8da2094908e1b23","subnet-02579e43d5262dfeb"]
      securityGroups: ["sg-06f16046d66441c1c"]
