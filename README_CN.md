[![Serverless Components](https://img.serverlesscloud.cn/20191218/1576684402436-component.gif)](http://serverless.com)

<br/>

**Serverless Components** 是 **[Serverless Framework](https://github.com/serverless/serverless/blob/master/README_CN.md)** 重磅推出的基础设置编排能力，支持开发者通过 **Serverless Components** 构建，组合并部署你的 Serverless 应用。

- - [x] **快速部署 -** Components 支持极速部署 Serverless 架构和应用
- - [x] **全面覆盖 -** 既能支持基础设施的 Components，也可以支持更高维度的，场景级别的 Components。
- - [x] **轻松复用 -** 你构建的每个 Component 都可复用，并且对外发布后，也可以支持他人使用。
- - [x] **灵活组合 -** 可以通过 YAML 或者 Javascript 灵活组合不同的 Components。

下面是一个通过 Serverless Framework 使用 Components 的例子，可以看出 Component 多么易用：

```yaml
# serverless.yml
name: website

website:
  component: '@serverless/tencent-website'
  inputs:
    code:
      src: ./src
      # hook: npm run build
      # domain: www.serverlesscomponents.com
```
<!--
[^ Watch a video guide on using a Serverless Component here](https://www.youtube.com/watch?v=ts26BVuX3j0).
-->

<br/>

- [快速开始](#quick-start)
- [特点](#features)
- [概述](#overview)
- [使用 Components](#using-components)
  - [Serverless.yml 介绍](#serverlessyml-basics)
  - [输入](#inputs)
  - [输出](#outputs)
  - [账号配置](#credentials)
  - [环境变量](#environment-variables)
- [开发 Components](#building-components)
  - [Serverless.js 介绍](#serverlessjs-basics)
  - [开发建议](#development-tips)
- [目前支持的 Components](https://github.com/serverless-components)
- [用例模板](./templates)
- [中文技术社区]](https://serverlesscloud.cn/)
- [后续规划](https://github.com/serverless/components/projects/1)

<br/>

# 快速开始

通过 NPM 安装 [Serverless Framework](https://www.github.com/serverless/serverless) ：

```console
$ npm i -g serverless
```
**确保你使用的是 Serverless Framework 1.49 及以上的版本。**更早的版本无法支持 Serverless Components Beta。

之后，通过 `create --template-url` 命令安装一个 [Serverless Components 模板](./templates)，模板中会包含了 Componenets 及示例代码，可以让你更快的了解 Component。

以下是一些常用的用例模板：

#### [部署 Hexo 静态博客](https://github.com/serverless/components/tree/master/templates/tencent-hexo-blog)

通过 Serverless Website 组件快速构建一个 Serverless Hexo 站点

```shell
serverless create --template-url https://github.com/serverless/components/tree/master/templates/website
```

#### [快速构建 REST API](https://github.com/serverless/components/tree/master/templates/tencent-python-rest-api)

通过 Serverless SCF 组件快速构建一个 REST API 应用，实现 GET/PUT 操作。

```shell
serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-python-rest-api
```

#### [部署 Serverless 全栈 WEB 应用（React.js）](https://github.com/serverless/components/tree/master/templates/tencent-fullstack-react-application)

本示例以 React 为前端，Express 框架作为后端，通过多个 Serverless Components 部署 Serverless 全栈应用程序。

```shell
serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-fullstack-react-application
```

#### [部署 Serverless 全栈 WEB 应用（Vue.js）](https://github.com/serverless/components/tree/master/templates/tencent-fullstack-vue-application)

本示例以 Vue 为前端，Express 框架作为后端，通过多个 Serverless Components 部署 Serverless 全栈应用程序。

```shell
serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-fullstack-vue-application
```

#### [部署其他模板](./templates)

[在这里查看所有预设的 Components 模板](./templates)，你可以通过这些模板方便的部署_REST API_， 网站, _定时任务_等多种场景。每个模板都提供了清晰的 `README.md` 来说明怎样使用。

此外，所有的 Serverless Components 可都在这个 [Github 仓库](https://github.com/serverless-components/)里。

<br/>

# 特点

### 简洁

Serverless Components 可以实现高层级的应用场景，例如网站、博客或者支付系统等。开发者无需关系底层的基础设施配置细节，仅通过简单的配置就可以实现场景的构建。

像下面的例子，仅通过最简单的配置，你可以部署——

- 一个 **Serverless 静态网站**，托管在腾讯云的 COS 服务上，并且通过 CDN 服务进行加速，支持自定义的域名解析，并且支持免费的 SSL 证书做传输加密。

```yaml
# serverless.yml

website:
  component: '@serverless/tencent-website'
  inputs:
    code:
      src: ./src
    domain: www.serverless-app.com
```

- 一个 **Express 框架**，通过腾讯云云函数 SCF 以及 API 网关服务，支持 Node.js 的 Express 框架，支持 HTTPS API 访问。 

```yaml
# serverless.yml

api:
  component: '@serverless/tencent-express'
  inputs:
    code: ./api
    functionName: tencent-express
    apigatewayConf:
      protocols:
        - https
```

- 以及[更多场景](./templates)

### 可复用

While Serverless Components can be easily composed in YAML (`serverless.yml`), they are written as reusable javascript libraries (`serverless.js`), with simple syntax inspired by component-based frameworks, like React.

Serverless Components 可以通过 YAML 中的配置灵活组合 (`serverless.yml`)，这些配置是通过可复用的 javascrpt 库实现的（`serverless.js`），实现语法简单，设计思想受到了组件化的开发框架如  React 的启发。

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyBlog extends Component {
  async default(inputs) {
    this.context.status('Deploying a serverless blog')
    const website = await this.load('@serverless/tencent-website') // Load a component
    const outputs = await website({ code: { src: './blog-code' } }) // Deploy it
    this.state.url = outputs.url
    await this.save()
    return outputs
  }
}

module.exports = MyBlog
```

每个人都可以方便的构建 Serverless Component，并且在我们即将提供的注册中心 Registry 中分享自己的成果。

### 快速部署

大部分 Serverless Components 的部署速度比传统的云服务编排产品快 20 倍左右，我们期望可以设计可以实时部署的 Components，从而无需在本地环境模拟云服务的使用或调试。

### 非厂商绑定

Serverless Components 倾向于支持 Serverless 化的云服务，为了提供更好的产品体验，Serverless 化的云产品支持用户按需付费，无需付费即可享受到最好的服务。

Serverless Components 的设计是非云厂商绑定的，支持你方便的使用不同云厂商的不同服务。例如 腾讯云云函数 SCF，对象存储 COS 服务，AWS 的 Lmabda 服务，Azure Functions，Twilio，Stripe, Algolia, Cloudflare Workers 等。

### Vanilla Javascript

Serverless Components 是用轻量级的 vanilla javascript 框架实现的，并且期望使用最少的依赖，让整个项目对于初学者来说尽可能友好易用。

<br/>

# 概述

Serverless Components 主要通过 Javascript 库封装各种服务的功能，使其变得易用和可复用。

Components 专注于提供后端的场景和用例，并且更多的支持 Serverless 化的基础云服务，这样可以使用户通过更少的开销，更低的成本来构建应用。Serverless Components 更适合后端的场景，对应的 React 组件则更适合前端的场景。

Component 既可以提供基础设施服务（例如，[对象存储 COS](http://github.com/serverless-components/tencent-cos)），也可以提供更高维度的场景——这也是 Components 最擅长的部分。例如以下的场景：

1. 整个多个基础设施服务，提供特定的能力，例如数据处理管道。
2. 提供具体功能，例如用户注册，评论或者支付的模块等。
3. 提供整个应用，例如博客系统，流视频播放系统，或者落地页等。

开发 Serverless Components 的语法可以直接调用和封装低维度的 Component，并且部署对应的资源。这样的设计可以让你无需考虑底层基础设施的配置，快速构建更高维度的 Component。


Serverless Components 可以通过**声明**的方式使用（通过 `serverless.yml` 文件），也可以通过**编程**的方式使用（通过 `serverless.js` 文件）。

如果你希望尽可能简单快速的部署一个 Serverless 应用，并且不会复用这个组件的化，那么用声明的方式来调用 Components 就可以满足你的诉求。

如果你希望构建一个可复用的 Component，那么应该用编程的方式来使用这些基础的 Components，并且快速构建自己的 Serverless 应用。

在[使用 Components](#using-components) 这一章，我们会主要讲解声明方式的用法（`serverless.yml`）；而在[开发 Components](#building-components) 这一章，我们会着重说明编程式的体验（`serverless.js`）。

<br/>

# 使用 Components

### Serverless.yml 介绍

通过 `serverless.yml` ，可以用最简单的方式将 Serverless Components 组合成为一个 Serverless 应用。其语法的使用如下所示：

```yml
name: my-serverless-website

website: # Component 实例的声明
  component: '@serverless/tencent-website' # 具体调用的 Component ，用于创建资源
  inputs: # 传入 Component 的 "default()" 函数中的参数配置
    code:
      src: ./src
```

通过 `$ serverless` 命令，你可以通过 Serverless Framework 快速部署这个 Component。

```console
$ serverless # 安装并部署 components...
```

<!--
可以通过 `--watch` 参数来查询变更情况

```console
$ serverless --watch # 检测变更，并且重新部署
```
-->

当你使用 `serverless.yml` 来调用 Components 的时候，不需要安装额外的依赖，而在部署的时候  `serverless.yml` 中使用的 Components 会被自动下载，并且存储在你的本地环境中。这样 Components 会被缓存在特定的位置，所以你的项目目录中不会直接存储 Components 依赖，并且 Components 也不需要被多次下载。

Serverless Components 通过 [NPM](https://www.npmjs.com/) 进行发布，因此当 Components 被下载时，后台会默认通过 NPM 安装对应的 Compoennts。

正因如此，你在 `component:` 属性中可以直接填写 NPM 的包名。

```yml
website: # Component 实例
  component: '@serverless/tencent-website' # 对应的 NPM 包名
```

You can also use the same semantic versioning strategy that NPM uses.

```yml
website: # Component 实例
  component: '@serverless/tencent-website@1.2.11' # 对应的 NPM 包名，和版本信息
```

当你在配置中写了版本信息时，只有这个特定的版本的包会被使用。如果你不加版本信息的化，每次部署时，Serverless Framework 会自动监测最新的版本并且更新。

**注意：** 在 Component Beta 版本中，目前不能在已有的 Serverless Framework 项目中使用 Component，比如项目中已有 `functions`， `events`， `resources` 或者 `plugins`等属性的时候。

### Inputs

每个 Serverless Component 都有一个用于部署的主函数，也就是 `default()` 函数（你也可以在 “开发 Components” 这一章来了解更多相关信息）。这个 `default()` 函数会把 `inputs` 内的参数作为输入。

当你在 `serverless.yml` 中指定了 `inputs` 参数时，这些参数会被直接作为入参传入到 `default()` 函数中。

```yml
name: my-serverless-website

website:
  component: '@serverless/tencent-website@1.2.11'
  inputs: # Inputs 中的参数作为入参传给 default() 函数
    code:
      src: ./src
```

### Outputs

When a Component function (e.g. the `default()` function) is finished running, it returns an `outputs` object.

You can reference values of this `outputs` object in `serverless.yml` to pass data into Components, like this:

```yml
backend:
  component: '@serverless/backend@1.0.2'
  inputs:
    code:
      src: ./src
    env:
      dbName: ${database.name}
      dbRegion: ${database.region}

database:
  component: '@serverless/aws-dynamodb@4.3.1'
  inputs:
    name: users-database
```

This tells the Serverless Framework to pass a few of the outputs from the `database` instance into the `backend` instance. Specifically, the `name` and `region` of the database are being added as environment variables to the `backend` instance, so that it can interact with that database.

This also tells the Serverless Framework what depends on what. The Framework builds a graph based on this, and deploys everything in that order. Circular references however do not work and the Framework will throw an error.

### 秘钥配置

Upon deployment, whether it's a `serverless.yml` or `serverless.js`, Serverless Components' core looks for a `.env` file in the current working directory.

Upon deployment, if a `.env` file exists, Serverless Components will add the content of it as environment variables. If you use specific environment variable names that match that of a cloud infrastructure vendor's access keys/tokens, upon deployment, Serverless Components will automatically inject that into the Components that need that vendor to provision infrastructure.

These credentials will be used by any and all Components in your `serverless.yml` or `serverless.js` — as well as their child Components — if you specify the environment variables exactly as shown below.

Here are the keys that are currently supported:

#### AWS Credentials

```bash
AWS_ACCESS_KEY_ID=123456789
AWS_SECRET_ACCESS_KEY=123456789
AWS_REGION=us-east-1
```

Components could access these AWS credentials using `this.context.credentials.aws`. This object would look like this:

```js
{
  accessKeyId: '123456789',
  secretAccessKey: '123456789',
  region: 'us-east-1'
}
```

### 环境变量

You can reference environment variables (e.g. those that you defined in the `.env` file) directly in `serverless.yml` by referencing the `${env}` object. For example, if you want to reference the `TABLE` environment variable, you could do that with `${env.TABLE}`.

```yml
backend:
  component: '@serverless/backend'
  inputs:
    code:
      src: ./src
    env:
      table: ${env.TABLE}
```

<br/>

# 开发 Components

If you want to build reusable Serverless Components, it starts and ends with a `serverless.js` file.

### Serverless.js 介绍

In your current working directory, install the Serverless Components core (`@serverless/core`) as a local dependency.

```
npm i --save @serverless/core
```

Create a `serverless.js` file, extend the Component class and add a `default` method, to make a bare minimum Serverless Component, like this:

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  async default(inputs = {}) {
    return {}
  } // The default functionality to run/provision/update your Component
}

module.exports = MyComponent
```

`default()` is always required. It is where the logic resides in order for your Component to _make_ something. Whenever you run the `$ serverless` command, it's always calling the `default()` method.

You can also any other methods to this class. A `remove()` method is often the next logical choice, if you want your Serverless Component to remove the things it creates.

You can add as many methods as you want. This is interesting because it enables you to ship more automation with your Component, than logic that merely _deploys_ and _removes_ something.

You can use the `serverless --watch` flag when you run any method. This would keep watching for changes in the current working directory, and rerun your method if changes are detected. So you could also do `serverless remove --watch` for example.

It's still early days for Serverless Components, but we are starting to work on Components that ship with their own `test()` function, or their own `logs()` and `metrics()` functions, or `seed()` for establishing initial values in a database Component. Overall, there is a lot of opportunity here to deliver outcomes that are loaded with useful automation.

All methods other than the `default()` method are optional. All methods take a single `inputs` object, not individual arguments, and return a single `outputs` object.

Here is what it looks like to add a `remove` method, as well as a custom method.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  /*
   * Default (Required)
   * - The default functionality to run/provision/update your Component
   * - You can run this function by running the "$ serverless" command
   */

  async default(inputs = {}) {
    return {}
  }

  /*
   * Remove (Optional)
   * - If your Component removes infrastructure, this is recommended.
   * - You can run this function by running "$ serverless remove"
   */

  async remove(inputs = {}) {
    return {}
  }

  /*
   * Anything (Optional)
   * - If you want to ship your Component w/ extra functionality, put it in a method.
   * - You can run this function by running "$ serverless anything"
   */

  async anything(inputs = {}) {
    return {}
  }
}

module.exports = MyComponent
```

When inside a Component method, `this` comes with utilities which you can use. Here is a guide to what's available to you within the context of a Component.

```javascript
// serverless.js

const { Component } = require('@serverless/core')

class MyComponent extends Component {
  async default(inputs = {}) {
    // this.context features useful information
    console.log(this.context)

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // when you run "components", then the credentials in .env will be used
    // when you run "components --stage prod", then the credentials in .env.prod will be used...etc
    // if you don't have any .env files, then global aws credentials will be used
    const dynamodb = new AWS.DynamoDB({ credentials: this.context.credentials.aws })

    // You can easily create a random ID to name cloud infrastructure resources with using this utility.
    const s3BucketName = `my-bucket-${this.context.resourceId()}`
    // This prevents name collisions.

    // Components have built-in state storage.
    // Here is how to save state to your Component:
    this.state.name = 'myComponent'
    await this.save()

    // Here is how to load a child Component.
    // This assumes you have the "@serverless/website" component in your "package.json" file and you've run "npm install"
    let website = await this.load('@serverless/website')

    // You can run the default method of a child Component two ways:
    let websiteOutputs = website({ code: { src: './src' } })
    let websiteOutputs = website.default({ code: { src: './src' } })

    // If you are deploying multiple instances of the same Component, include an instance id.
    let website1 = await this.load('@serverless/website', 'website1')
    let website2 = await this.load('@serverless/website', 'website2')

    // Child Components save their state automatically.

    // You can also load a local component that is not yet published to npm
    // just reference the root dir that contains the serverless.js file
    // You can also use similar syntax in serverless.yml to run local Components
    let localComponent = await this.load('../my-local-component')

    // Here is how you can easily remove a Component.
    let websiteRemoveOutputs = await website.remove()

    // Here is how you can call any custom method on a Component.
    let websiteRemoveOutputs = await website.test({})

    // If you want to show a status update to the CLI in an elegant way, use this.
    this.context.status('Uploading')

    // If you want to show a log statement in the CLI in an elegant way, use this.
    this.context.log('this is a log statement')

    // Return your results
    return { url: websiteOutputs.url }
  }
}

module.exports = MyComponent
```

Just run `serverless` in the directory that contains the `serverless.js` file to run your new component. You'll will see all the logs and outputs of your new component. Logs and outputs of any child component you use will not be shown, unless you run in debug mode: `serverless --debug`. You can also run any custom method/command you've defined with `serverless <methodName>`.

For complete real-world examples on writing components, [check out our official components](https://github.com/serverless-components)

### Development Tips

Here are some development tips when it comes to writing Serverless Components:

#### Activate Watch Mode with the `--watch` Flag

During development, it's super helpful to keep the terminal running with `serverless --watch` (or with any method other than the default) while you develop your component. This way you get instant feedback and reduce friction.

#### Use Debug Statements and the `--debug` Flag

The Serverless Components CLI experience is intentionally minimal. But if you ever want to see what Components are doing behnd the scenes, use the `--debug` flag when you run a Component. You'll see output like this:

![Serverless Components Debugging](https://s3.amazonaws.com/assets.github.serverless/components/serverless_components_debugging.png)

Many Serverless Components include debug statements to report what work they are doing. We recommend you add debug statements into your Component as well. Just use this:

```javascript
class MyComponent extends Component {
  async default() {
    this.context.debug(`Starting MyComponent.`)
    this.context.debug(`Creating resources.`)
    this.context.debug(`Waiting for resources to be provisioned.`)
    this.context.debug(`Finished MyComponent.`)
  }
}
```

#### Use Local References

When writing a Serverless Component, you can reference it locally via a `serverless.yml`, or another `serverless.js`. Keep in mind, a directory can only contain 1 `serverless.yml` or `serverless.js`. A directory cannot contain a both a `serverless.yml` and a `serverless.js`.

Here's how to reference a local Component via `serverless.yml`:

```yaml
name: my-project

myComponent:
  component: ../src
  inputs:
    foo: bar
```

Here's how to reference a local Component via `serverless.js`:

```javascript
class myFirstComponent extends Component {
  default() {
    const mySecondComponent = this.load('../components/my-second-component')
  }
}
```

#### Start With The Outcome

When making a Serverless Component, it can be tempting to break it down into several levels of child Components, to maintain separation of concerns and increase the ways your work could be re-used.

However, provisioning back-end logic can be more complicated than designing a front-end React Component. We've learned over-optimizing for granular separation of concerns is a fast way to burn yourself out!

We recommend starting with a focus on your desired outcome. Create one Serverless Component that solves that problem first. After you've achieved your initial goal, then start breaking it down into child Components.

#### The Outcome Is Your Advantage

Provisioning infrastructure can be quite complicated. However, Serverless Components have one powerful advantage over general infrastructure provision tools that seek to enable every possible option and combination (e.g. AWS Cloudformation) — Serverless Components know the specific use-case they are trying to deliver.

One of the most important lessons we've learned about software development tools is that once you know the use-case, you can create a much better tool.

Components know their use-case. You can use that knowledge to: 1) provision infrastructure more reliably, because you have a clear provisioning path and you can program around the pitfalls. 2) provision infrastructure more quickly 3) add use-case specific automation to your Component in the form of custom methods.

#### Keep Most State On The Cloud Provider

Serverless Components save remarkably little state. In fact, many powerful Components have less than 10 properties in their state objects.

Components rely on the state saved within the cloud services they use as the source of truth. This prevents drift issues that break infrastructure provisioning tools. It also opens up the possibility of working with existing resources, that were not originally managed by Serverless Components.

#### Store State Immediately After A Successful Operation

If you do need to store state, try to store it immediately after a successful operation. This way, if anything after that operation fails, your Serverless Component can pick up where it left off, when the end user tries to deploy it again.

#### Optimize For Accessibility

We believe serverless infrastructure and architectures will empower more people to develop software than ever before.

Because of this, we're designing all of our projects to be as approachable as possible. Please try to use simple, vanilla Javascript. Additionally, to reduce security risks and general bloat, please try to use the least amount of NPM dependencies as possible.
