<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Github Webhook

Serverless component that provisions github webhooks
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Example](#example)
- [Github Webhook Event Types](#github-webhook-event-types)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **githubApiToken**| `string`<br/>*required* | GitHub personal access token needed for access to the github API.<br/>[Create a token](https://github.com/settings/tokens)<br/>
| **githubRepo**| `string`<br/>*required* | The GitHub repos URL
| **payloadUrl**| `string`<br/>*required* | Payload Url
| **events**| `array`<br/>*required* | What type of event(s) will trigger the webhook URL.<br/>List of allowed events. For more details on events & payloads [see the docs](https://developer.github.com/v3/activity/events/types/)<br/>

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myGithubWebhook:
    type: github-webhook
    inputs:
      githubApiToken: 2c5acc7de3b140ser3114fd40a24vd5ie3d843b5
      githubRepo: 'https://github.com/serverless/components/'
      payloadUrl: 'https://your-webhook-url-to-trigger-from-repo.com/'
      events:
        - create

```
<!-- AUTO-GENERATED-CONTENT:END -->

## Github Webhook Event Types

List of allowed events. For more details on events & payloads [see the docs](https://developer.github.com/v3/activity/events/types/)

- `*`
- `commit_comment`
- `create`
- `delete`
- `deployment`
- `deployment_status`
- `fork`
- `gollum`
- `installation`
- `installation_repositories`
- `issue_comment`
- `issues`
- `label`
- `marketplace_purchase`
- `member`
- `membership`
- `milestone`
- `organization`
- `org_block`
- `page_build`
- `project_card`
- `project_column`
- `project`
- `public`
- `pull_request_review_comment`
- `pull_request_review`
- `pull_request`
- `push`
- `repository`
- `release`
- `status`
- `team`
- `team_add`
- `watch`
