<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Security Group Ingress

My component description
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
| **groupId**| `string`<br/>*required* | Security Group Id
| **ipPermissions**| `array`<br/>*required* | Ingress rules

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **myOutput**| `string` | my output string

<!-- AUTO-GENERATED-CONTENT:END -->
<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsSecurityGroupIngress:
    type: aws-security-group-ingress
    inputs:
      groupId: sg-abbaabba
      ipPermissions:
        - fromPort: 80
          toPort: 81
          ipProtocol: tcp
          ipRanges:
            - cidrIp: 10.0.0.0/16
              description: VPC CIDR 1
            - cidrIp: 10.1.0.0/16
              description: VPC CIDR 2
        - portRange: ALL
          ipProtocol: tcp
          ipRanges:
            - cidrIp: 10.0.0.0/16
              description: VPC CIDR 1
        - portRange: HTTPS*
          ipProtocol: tcp
          userIdGroupPairs:
            - groupId: '$\{myOtherAwsSecurityGroup.groupId\}'
              description: 'Allow 2 $\{myOtherAwsSecurityGroup.groupName\}'

```
<!-- AUTO-GENERATED-CONTENT:END -->
