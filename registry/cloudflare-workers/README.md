# README.md

# Cloudflare worker component



<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Cloudflare worker component](#cloudflare-worker-component)
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->


<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **zone_id**| `string`<br/>*required* | zone_id
| **script_path**| `string`<br/>*required* | script_path

<!-- AUTO-GENERATED-CONTENT:END -->


<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **success**| `boolean` | If worker script has been successfully deployed
| **result**| `any` | The resultant worker script uploaded
| **errors**| `any` | A list of error messages
| **messages**| `any` | Messages

<!-- AUTO-GENERATED-CONTENT:END -->

## Example
...