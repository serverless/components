<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Azure Rg

Azure Resource Group Serverless Component
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
| **description**| `string` | A short, user-defined resource group description.<br/>Azure does not use this value. Assign a meaningful description as you see fit<br/>
| **location**| `string` | The region to deploy the resource group
| **name**| `string`<br/>*required* | The Azure resource group name
| **subscriptionId**| `string`<br/>*required* | The Azure subscription ID
| **directoryId**| `string`<br/>*required* | The Azure Directory/Tenant
| **appId**| `string`<br/>*required* | The Azure Client ID
| **appSecret**| `string`<br/>*required* | The Azure App Client Secret

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The name of the resource group

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAzureRg:
    type: azure-rg
    inputs:
      description: The resource group for serverless
      name: serverless-rg
      subscriptionId: 38ee4b45-d54e-451e-bdff-d08b951f32ae
      directoryId: qwertyuiop.onmicrosoft.com

```
<!-- AUTO-GENERATED-CONTENT:END -->
