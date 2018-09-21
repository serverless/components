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
| **description**| `string` | Ingress rule desription
| **rules**| `array` | Ingress rules

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
      description: Ingress rule for accessing ephemeral port range
      rules:
        - cidrIp: 10.0.0.0/16
          cidrIpv6: '2600:1f18:24c2:b200::/56'
          fromPort: 1024
          groupId: sg-abbaabbba
          groupName: my-group
          ipProtocol: tcp
          sourceSecurityGroupName: security-group-name
          sourceSecurityGroupOwnerId: '123456789012'
          toPort: 65535
        - cidrIp: 172.16.0.0/16
          fromPort: 1024
          groupId: sg-abbaabbba
          groupName: my-group
          ipProtocol: tcp
          sourceSecurityGroupName: security-group-name
          sourceSecurityGroupOwnerId: '123456789012'
          toPort: 65535

```
<!-- AUTO-GENERATED-CONTENT:END -->
