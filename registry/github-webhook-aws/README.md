<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Github Webhook AWS

Github webhook component using AWS API gateway
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **function**| `string`<br/>*required* | function
| **githubApiToken**| `string`<br/>*required* | GitHub personal access token needed for access to the GitHub API.<br/>[Create a token](https://github.com/settings/tokens)<br/>
| **githubRepo**| `string`<br/>*required* | The GitHub repos URL
| **webhookTriggers**| `array`<br/>*required* | webhookTriggers

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myGithubWebhookAws:
    type: github-webhook-aws
    inputs:
      githubApiToken: 2c5acc7de3b140ser3114fd40a24vd5ie3d843b5
      githubRepo: 'https://github.com/serverless/components/'
      webhookTriggers:
        - create

```
<!-- AUTO-GENERATED-CONTENT:END -->
