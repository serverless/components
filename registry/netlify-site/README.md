# WIP Netlify Site Component

```yml
type: netlify-site

# Inputs are WIP
inputs:
  name: mysite.netlify.com
  custom_domain: lol.com
  force_ssl: true
  netlifyApiToken: xyz
  repo: https://github.com/serverless/platform

```

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

# Terraform examples

- https://github.com/ajcrites/times-tables/blob/c0b23af47ef48513935dd34201a8dab9b7c0d834/infrastructure/main.tf

# Travis examples

- https://github.com/Mallain23/vacation-app-react-capstone/blob/814468d0764abc83fbd547e332e76129ccca8c20/.travis.yml
