<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Azure Storage Blob

Azure Storage Blob Serverless Component
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
| **description**| `string` | A short, user-defined storage blob description.<br/>Azure does not use this value. Assign a meaningful description as you see fit<br/>
| **appId**| `string` | The Azure App Client ID
| **appSecret**| `string` | The Azure App Client Secret
| **location**| `string` | The region to deploy the storage account
| **name**| `string`<br/>*required* | The Azure storage account name
| **blobContainer**| `string`<br/>*required* | The Azure storage container name
| **resourceGroup**| `string`<br/>*required* | The functions resource group
| **subscriptionId**| `string`<br/>*required* | The Azure subscription ID
| **directoryId**| `string`<br/>*required* | The Azure Directory/Tenant

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **name**| `string` | The name of the storage account
| **blobContainer**| `string` | The blob container name
| **connectionString**| `string` | Connection string for the storage account

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myAzureStorageBlob:
    type: azure-storage-blob
    inputs:
      description: The blob is for web contents
      name: 'stor${self.serviceId}'
      blobContainer: contents
      resourceGroup: serverless-rg
      subscriptionId: 38ee4b45-d54e-451e-bdff-d08b951f32ae
      directoryId: qwertyuiop.onmicrosoft.com

```
<!-- AUTO-GENERATED-CONTENT:END -->
