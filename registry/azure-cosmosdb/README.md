<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Azure Cosmosdb

Azure CosmosDB Serverless Component
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
| **description**| `string` | A short, user-defined CosmosDB description.<br/>Azure does not use this value. Assign a meaningful description as you see fit<br/>
| **apiType**| `string` | API type to interact with CosmosDB
| **appId**| `string` | The Azure App Client ID
| **appSecret**| `string` | The Azure App Client Secret
| **name**| `string`<br/>*required* | The Azure CosmosDB name
| **resourceGroup**| `string`<br/>*required* | The functions resource group
| **subscriptionId**| `string`<br/>*required* | The Azure subscription ID
| **directoryId**| `string`<br/>*required* | The Azure Directory/Tenant
| **location**| `string`<br/>*required* | The region to deploy the CosmosDB

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The name of the CosmosDB
| **primaryMasterKey**| `string` | Primary master key
| **secondaryMasterKey**| `string` | Secondary master key
| **primaryReadonlyMasterKey**| `string` | Primary read only master key
| **secondaryReadonlyMasterKey**| `string` | Secondary read only master key

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAzureCosmosdb:
    type: azure-cosmosdb
    inputs:
      description: The CosmosDB for serverless
      apiType: SQL
      name: 'cosmos${self.instanceId}'
      resourceGroup: serverless-rg
      subscriptionId: 38ee4b45-d54e-451e-bdff-d08b951f32ae
      directoryId: qwertyuiop.onmicrosoft.com

```
<!-- AUTO-GENERATED-CONTENT:END -->
