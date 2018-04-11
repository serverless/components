<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# AWS Route53

Provision AWS route53 definitions with serverless components
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **domainName**| `string` | The domain name used in route 53
| **dnsName**| `string` | The DNS name used in route 53
| **privateZone**| `boolean` | Whether this is a private zone
| **vpcId**| `string` | The VPC's Id
| **vpcRegion**| `string` | The VPC's region

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAwsRoute53:
    type: aws-route53
    inputs:
      domainName: www.defaultdomain.com
      dnsName: d111111abcdef8.cloudfront.net
      vpcId: my-existing-vpc-id
      vpcRegion: mydefaultvpcregion

```
<!-- AUTO-GENERATED-CONTENT:END -->
