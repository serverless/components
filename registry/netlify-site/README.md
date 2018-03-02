# WIP Netlify Site Component

Adds a site to a netlify account and configures CI/CD through github

Only github repo URLs are currently supported

## Usage

1. `npm install` component dependancies

2. [Create a netlify API token](https://app.netlify.com/account/applications/personal)

3. [Create a github access token](https://blog.github.com/2013-05-16-personal-api-tokens/)

4. Configure the values in `serverless.yml`

    ```yml
    type: netlify-site

    # Inputs are WIP
    inputs:
      netlifyApiToken: xyz-123-999
      githubApiToken: xyz-123-4532
      siteSettings:
        name: mysite.netlify.com
        customDomain: lol.com
        forceSsl: true
        repo:
          url: https://github.com/serverless/platform
          buildCommand: npm run build
          buildDirectory: demo
          branch: master
          allowedBranchs:
            - master
    ```

4. Run `node ../../bin/serverless deploy`

Removal is not setup

## Netlify API Docs

- https://open-api.netlify.com/#!/default/createSite
- https://github.com/netlify/open-api/blob/master/swagger.yml
- https://www.netlify.com/docs/api/
- https://www.netlify.com/docs/cli/

Zip upload only netlify upload

```
curl -H 'Content-Type: application/zip' \
     -H 'Authorization: Bearer my-netlify-api-access-token' \
     --data-binary '@website.zip' \
     https://api.netlify.com/api/v1/sites/mysite.netlify.com/deploys
```

## Terraform examples

- https://github.com/ajcrites/times-tables/blob/c0b23af47ef48513935dd34201a8dab9b7c0d834/infrastructure/main.tf

## Travis examples

- https://github.com/Mallain23/vacation-app-react-capstone/blob/814468d0764abc83fbd547e332e76129ccca8c20/.travis.yml
