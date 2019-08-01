[![Serverless Components](https://s3.amazonaws.com/assets.github.serverless/components/serverless_components_github_readme_2.gif)](http://serverless.com)

<br/>

**Forget infrastructure.**  Serverless Components gives you a new option for deploying **entire serverless use-cases**, like a *blog*, a *user registration system*, a *payment system* or an *entire application* — without managing complex cloud infrastructure configurations.

You can use them now via [Serverless Framework](https://www.github.com/serverless/serverless).

<br/>

- [Quick-Start](#quick-start)
- [Features](#features)
- [Getting Started](#getting-started)
- [Using Components](#declarative-usage)
- [Building Components](#programatic-usage)
- [Example Templates](./templates)
- [Join Us on Slack](https://serverless.com/slack)
- [Roadmap](https://github.com/serverless/components/projects/1)

<br/>

# Quick-Start

Install the [Serverless Framework](https://www.github.com/serverless/serverless) via NPM:

  ```console
  $ npm i -g serverless
  ```

[Clone one of the pre-made Templates and deploy it](./templates), to rapidly create a serverless *REST API*, *Websockets API*, *Website*, *Scheduled Task*, and much more!  Each Template has a `README.md` with clear instructions on what it does and how to get started.

Check out more Serverless Components [here](https://github.com/serverless-components/)

<br/>

# Features

### Simplicity

Serverless Components are mostly built around higher-order use-cases (e.g. a website, blog, payment system).  Irrelevant low-level infrastructure details are abstracted away, and simpler configuration is offered instead.

For example, with minimal configuration, you can deploy... 

* A **serverless website** hosted on AWS S3, delivered globally and quickly w/ AWS Cloudfront, via a custom domain on AWS Route 53, secured by a free AWS ACM SSL Certificate:


  ```yaml
  # serverless.yml

  website:
    component: @serverless/website
    inputs:
      code:
        src: ./src
      domain: www.serverless-app.com
  ```

* A **serverless API** hosted on AWS Lambda, accessible via an AWS API Gateway endpoint under a custom domain on AWS Route 53, secured by a free AWS ACM SSL Certificate:


  ```yaml
  # serverless.yml

  api:
    component: @serverless/backend
    inputs:
      code:
        src: ./src
      domain: api.serverless-app.com
  ```

* A **serverless real-time websockets API** hosted on AWS Lambda, accessible via an AWS API Gateway Websockets endpoint:

  ```yaml
  # serverless.yml

  api:
    component: @serverless/backend-socket
    inputs:
      code:
        src: ./src
  ```

* and [much more!](./templates)


### Reusability

Serverless Components are easy to compose.  You can compose them declaratively via YAML (**serverless.yml**) or programatically via javascript (**serverless.js**).

```yaml
# serverless.yml

backend:
  component: @serverless/backend
  inputs:
    code:
      src: ./backend

website:
  component: @serverless/website
  inputs:
    code:
      src: ./frontend
    env:
      api: ${backend.url} # An output from "backend" to make available in the website
```

```javascript
// serverless.js

MyComponent extends Component {
  async default() {
    const website = await this.load('@serverless/website') // Load a component
    const outputs = await website({ code: { src: './src' } }) // Deploy it
    this.state.url = outputs.url
    await this.save()
    return outputs
  }
}
```

#### Serverless & Vendor-Agnostic

Serverless Components favor cloud services with serverless qualities (shocker!) across all vendors, like AWS Lambda, AWS S3, Azure Functions, Google Big Query, Twilio, Stripe, Algolia, Cloudflare Workers and more.

#### Fast Deployments

Most Serverless Componetns deploy 10x faster than traditional cloud provisioning tools.  One of Serverless Components' goals is to deploy near instantly, removing the need to emulate clodu services locally.

#### Vanilla Javascript

Serverless Components are written in vanilla javascript and seek to use the least amount of dependencies and fads, enabling ease of understanding by both beginning and fatigued javascripters.

<br/>

# Getting Started

Install the [Serverless Framework](https://www.github.com/serverless/serverless).

```shell
$ npm i -g serverless
```

Serverless Components can written by anyone, but you can see several [available Components here](https://www.github.com/serverless-components).

<br/>

# Declarative Usage

If you want to compose components together and deploy them, you can do it declaratively via the Serverless Framework's `serverless.yml` file, like this:

```yml
name: my-stack

website: # An instance of a component.
  component: @serverless/website@2.0.5 # The component you want to create an instance of.
  inputs: # Inputs to pass into the component.
    code:
      src: ./src
```

Deploy everything with:

```shell
$ serverless # Deploys the components...
```
