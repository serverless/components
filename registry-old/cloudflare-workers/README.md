# Cloudflare Workers

Cloudflare Workers serverless component

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Credentials](#credentials)
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

## Credentials

Find your auth key in the [Cloudflare Dashboard](https://dash.cloudflare.com/164e11ba607e82f8b25f9b1ad43685a9) ➡️ click user icon in top right ➡️ My Profile ➡️ API Keys ➡️ Global API Key

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **accountId**| `string` | accountId
| **scriptName**| `string` | scriptName
| **credentials**| `object`<br/>*required* | credentials
| **zoneId**| `string`<br/>*required* | zoneId
| **scriptPath**| `string`<br/>*required* | scriptPath
| **route**| `string`<br/>*required* | route

<!-- AUTO-GENERATED-CONTENT:END -->


<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **successScript**| `boolean` | Success status returned by the Cloudflare Worker Script API endpoint
| **resultScript**| `any` | Contents of the script uploaded to the Cloudflare Worker Script API endpoint
| **errorsScript**| `any` | Errors returned by the Cloudflare Worker Script API endpoint
| **messagesScript**| `any` | Messages returned by the Cloudflare Worker Script API endpoint
| **successRoute**| `boolean` | Success status returned by the Cloudflare Worker Route API endpoint
| **resultRoute**| `any` | Routes that the script are deployed on
| **errorsRoute**| `any` | Errors returned by the Cloudflare Worker Route API endpoint
| **messagesRoute**| `any` | Messages returned by the Cloudflare Worker Route API endpoint

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myCloudflareWorkers:
    type: cloudflare-workers
    inputs:
      accountId: ACCOUNT_ID_HERE
      credentials:
        authKey: CLOUDFLARE_AUTH_KEY_HERE
        authEmail: CLOUDFLARE_AUTH_EMAIL_HERE
      zoneId: ZONE_ID_HERE
      scriptPath: ./index.js
      route: example.com/path/*

```
<!-- AUTO-GENERATED-CONTENT:END -->
