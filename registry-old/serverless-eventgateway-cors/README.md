<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Serverless Eventgateway Cors

Manages Event Gateway CORS configurations
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
| **space**| `string` | The Event Gateway space which should be used
| **allowedOrigins**| `array` | The allowed origins for the CORS configuration
| **allowedMethods**| `array` | The allowed methods for the CORS connfiguration
| **allowedHeaders**| `array` | The allowed headers for the CORS configuration
| **allowCredentials**| `boolean` | Whether credentials are allowed for the CORS configuration
| **url**| `string`<br/>*required* | The Event Gateway URL
| **accessKey**| `string`<br/>*required* | The access key used to authenticate with the hosted Event Gateway
| **method**| `string`<br/>*required* | The method CORS configuration should be applied to
| **path**| `string`<br/>*required* | The path CORS configuration should be applied to

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **corsId**| `string` | The CORS configuration id
| **method**| `string` | The method CORS configuration is applied to
| **path**| `string` | The path CORS configuration is applied to

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myServerlessEventgatewayCors:
    type: serverless-eventgateway-cors
    inputs:
      space: acme-marketing-space
      allowedOrigins:
        - 'http://*.domain.com'
      allowedMethods:
        - POST
        - GET
      allowedHeaders:
        - Origin
        - Accept
      url: 'http://localhost'
      accessKey: s0m34c355k3y
      method: POST
      path: /acme

```
<!-- AUTO-GENERATED-CONTENT:END -->
