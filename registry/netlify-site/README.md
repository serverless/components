<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Netlify Site

Serverless component that provisions netlify sites
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
- [Usage](#usage)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **siteEnvVars**| `object` | The variables used during netlify site build
| **siteRepoAllowedBranches**| `array` | Site Repo Branch
| **netlifyApiToken**| `string`<br/>*required* | Your personal access token from https://app.netlify.com/account/applications<br/>
| **githubApiToken**| `string`<br/>*required* | Your github API key from https://github.com/settings/tokens.<br/>Github access token requires one of these scopes: repo:status, repo<br/>
| **siteName**| `string`<br/>*required* | The netlify domain you will use for your site.
| **siteDomain**| `string`<br/>*required* | The domain you will use to mask your netlify siteName.
| **siteForceSSL**| `boolean`<br/>*required* | Set to true if you want to force SSL connections
| **siteRepo**| `string`<br/>*required* | The url of your site's repository in github
| **siteBuildDirectory**| `string`<br/>*required* | The output folder of your site's build
| **siteRepoBranch**| `string`<br/>*required* | The production branch that will trigger builds of the netlify site

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **githubDeployKeyData**| `string` | The GitHub deploy key
| **githubWebhookData**| `any` | Information about the GitHub Webhook
| **netlifyDeployKeyData**| `any` | Information about the Netlify deploy key
| **netlifySiteData**| `any` | Information about the Netlify site data
| **netlifyDeployCreatedWebhook**| `any` | Information about the Netlify deploy created Webhook
| **netlifyDeployFailedWebhook**| `any` | Information about the Netlify deploy failed Webhook
| **netlifyDeployBuildingWebhook**| `any` | Information about the Netlify deploy building Webhook

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myNetlifySite:
    type: netlify-site
    inputs:
      siteEnvVars:
        foo: bar
      siteRepoAllowedBranches:
        - master
      netlifyApiToken: xyz-123-netlify-token
      githubApiToken: abc-456-github-token
      siteName: my-awesome-site.netlify.com
      siteDomain: dog-sweatpants.com
      siteRepo: 'https://github.com/DavidWells/dog-sweatpants-frontend'
      siteBuildDirectory: build
      siteRepoBranch: master

```
<!-- AUTO-GENERATED-CONTENT:END -->


## Usage

1. `npm install` component dependancies

2. [Create a netlify API token](https://app.netlify.com/account/applications/personal)

3. [Create a github access token](https://blog.github.com/2013-05-16-personal-api-tokens/)

4. Configure the input values in `serverless.yml`

4. Run `node ../../bin/serverless deploy`
