[![Serverless Components](https://s3.amazonaws.com/public.assets.serverless.com/images/readme_serverless_components.gif)](http://serverless.com)

<br/>

<p align="center">
  <b>Serverless Components 当前已正式发布上线  <a href="https://github.com/serverless/components/blob/v1/README_CN.md"> 查看旧版本 Component </a></b>
</p>

<br/>

Serverless Components 是 [Serverless Framework](https://github.com/serverless/serverless) 重磅推出的基础设施编排能力，支持开发者通过 Serverless Components 构建，组合并部署你的 Serverless 应用。

<br/>

- [x] **全面覆盖** - 既能支持基础设施的 Components，也可以支持更高维度的，场景级别的 Components。
- [x] **快速部署** - Components 支持在 4-6s 内极速部署 Serverless 应用。
- [x] **灵活配置** - Components 支持灵活配置和方便的部署
- [x] **注册中心** - 通过注册中心，支持将你构建的组件（Component）或者模板(Template) 分享给团队或公开支持他人复用。

<br/>

下面通过一个 Serverless Framework Component 的例子，可以看出 Component 多么易用：

```yaml
# serverless.yml

component: express # 注册中心的组件名称
name: express-api # 组件实例的名称

inputs: # 对应的组件配置
  src: ./src # 代码路径，在此处代码路径指定为 src
```

# 文档说明

- [一键部署](#一键部署)
- [快速开始](#快速开始)
- [特点](#特点)
- [概述](#概述)
- [使用 Components](#使用-Components)
  - [Serverless.yml 介绍](#serverlessyml-介绍)
  - [输入](#输入)
  - [部署](#部署)
  - [状态](#状态)
  - [版本](#版本)
  - [输出](#输出)
  - [账号配置](#账号配置)
  - [环境](#环境)
  - [变量](#变量)
  - [代理](#代理)
  - [参数](#参数)
- [使用模板（Template）](#使用模板template)
  - [查看可使用的模板](#查看可使用的模板)
  - [从模板初始化项目](#从模板初始化项目)
- [开发 Components](#开发-Components)
  - [Serverless.component.yml](#serverlesscomponentyml)
  - [在 serverless.component.yml 中定义用户可输入的类型](#在-serverlesscomponentyml-中定义用户可输入的类型)
  - [Serverless.js](#serverlessjs)
  - [Component 中涉及源代码的场景](#component-中涉及源代码的场景)
  - [增加 Serverless Agent](#增加-serverless-agent)
  - [开发流程](#开发流程)
  - [开发建议](#开发建议)
- [开发模板 Templates](#开发模板-templates)
  - [什么是项目模板](#什么是项目模板)
  - [如何分享（发布）项目模板](#如何分享发布项目模板)
- [目前支持的 Components 以及 Templates](https://registry.serverless.com)
- [CLI 命令列表](#cli-命令列表)
- [中文技术社区](https://china.serverless.com/)

<br/>

# 一键部署

通过 NPM 安装最新版本的 [Serverless Framework](https://www.github.com/serverless/serverless) ：

```console
$ npm i -g serverless
```

之后在命令行中输入 `serverless`，按照引导进行操作，即可部署一个 SCF、Express.js 或者静态网站托管应用。交互流程如下所示：

```
$ serverless

Serverless: 当前未检测到 Serverless 项目，是否希望新建一个项目？ (Y/n) y
Serverless: 请选择你希望创建的 Serverless 应用 (Use arrow keys)
❯ Express.js app
  SCF Function
  Website app
Serverless: 请输入项目名称 tinatest

tinatest 项目已成功创建！
Serverless: 是否希望立即将该项目部署到云端？ (Y/n) y
Please scan QR code login from wechat.
Wait login...
Login successful for TencentCloud.

serverless ⚡ framework
Action: "deploy" - Stage: "dev" - App: "scfApp" - Name: "scfdemo"

FunctionName: scfFunctionName
Description:
Namespace:    default
Runtime:      Nodejs10.15
Handler:      index.main_handler
MemorySize:   128
Triggers:
  apigw:
    - https://service-9k0ggfbe-1250000000.gz.apigw.tencentcs.com/release/index

23s › scfdemo › Success
```

部署完毕后，访问命令行中输出的网页链接，即可访问已经部署成功的应用。

访问 [Serverless Framework 控制台](https://serverless.cloud.tencent.com/)，查看你的 Serverless 应用的状态和监控信息。

> 如果希望查看部署过程中的详细信息，可以增加 --debug 参数进行查看。

# 快速开始

通过 NPM 安装最新版本的 [Serverless Framework](https://www.github.com/serverless/serverless) ：

```console
$ npm i -g serverless
```

之后，通过 `create --template-url` 命令安装一个 [Serverless Components 模板](https://github.com/serverless/components/tree/master/templates)，模板中会包含了 Componenets 及示例代码，可以让你更快的了解和上手 Component，本文以 Express.js 组件为例。

```shell
serverless create --template-url https://github.com/serverless-components/tencent-express/tree/v2/example
$ cd example
```

执行如下命令，安装 express 应用的对应依赖

```bash
$ cd src && npm install
```

在 serverless.yml 文件下的目录中运行 serverless deploy 进行 express 项目的部署：

```bash
$ serverless deploy
```

部署完毕后，你可以在命令行的输出中查看到你 express 应用的 URL 地址，点击地址即可访问你的 express 项目。

通过运行 `serverless dev` 命令你可以方便的对本地代码的改动进行检测和自动部署，并且支持实时输出云端日志和错误信息等。

```bash
$ serverless dev
```

除了实时日志输出之外，针对 Node.js 应用，当前也支持云端调试能力。在开启 serverless dev 命令之后，将会自动监听远端端口，并将函数的超时时间临时配置为 900s。此时你可以通过访问 chrome://inspect/#devices 查找远端的调试路径，并直接对云端代码进行断点等调试。在调试模式结束后，需要再次部署从而将代码更新并将超时时间设置为原来的值。 详情参考[开发模式和云端调试](https://cloud.tencent.com/document/product/1154/43220)。

当前支持在 Express 组件中引用其他的组件联合进行部署。例如，如果希望引用 `website` 组件中的静态地址，可以直接使用 [Serverless Component 模板](https://github.com/serverless/components/tree/master/templates) 部署其它组件并用如下方式引用。

```yaml
app: your-app # Your App
component: express
name: express-api

inputs:
  src: ./src
  env:
    websiteURL: ${outputs:${stage}:${app}:my-website.api}
```

<br/>

# 特点

### 简洁

Serverless Components 可以实现高阶应用场景，例如网站、博客或者支付系统等。开发者无需关心底层基础设施的配置细节，仅通过简单的配置就可以实现场景的构建。

像下面的例子，仅通过最简单的配置，你可以部署一个静态网站托管应用，将你的静态网站托管到腾讯云对象存储 COS 中，同时支持为这个静态网站配置自定义域名和免费的 SSL 证书：

```yaml
# serverless.yml

app: ecommerce # Your App
component: website # A Component in the Registry
name: my-website # The name of your Component Instance

inputs: # The configuration the Component accepts
  src:
    src: ./src
  hosts:
    - host: www.mystore.com
```

### 快速部署

Serverless Components 的部署可以在秒级别完成，通过支持实时部署的 Components，从而无需在本地环境模拟云服务的使用或调试。

```bash

$ serverless deploy

5s > my-express-app › Successfully deployed

```

### 灵活构建

Serverless Components 可以通过 YAML 中的配置灵活组合 (serverless.yml)，这些配置是通过可复用的 javascrpt 库实现的（serverless.js），实现语法简单，设计思想受到了组件化的开发框架如 React 的启发。

```javascript
// serverless.js

const { Component } = require('@serverless/core');

class MyBlog extends Component {
  async deploy(inputs) {
    console.log('Deploying a serverless blog'); // Leave a status update for users deploying your Component with --debug
    this.state.url = outputs.url; // Save state
    return outputs;
  }
}

module.exports = MyBlog;
```

### 注册中心 Registry

任何人都能构建自己的 Serverless 组件（Component） 或者 Serverless 项目模板（Template）， 并且将其发布在注册中心中，提供团队和他人使用。关于如何开发组件和项目模板请参看此文档中对应的[开发 Components](#开发-components) 和[开发模板](#开发模板-templates)章节。

```bash

$ serverless registry publish

express@0.0.4 › Published

```

### 无服务化 Serverless

Serverless Components 主要支持 Serverless 化的云服务，为了提供更好的产品体验，Serverless 化的云产品支持用户按需付费，无需付费即可享受到最好的服务。

Serverless Components 的设计是非云厂商绑定的，支持你方便的使用不同云厂商的不同服务。例如 腾讯云云函数，对象存储 COS 服务，AWS 的 Lmabda 服务，Azure Functions，Twilio，Stripe，Algolia，Cloudflare Workers 等。

<br/>

# 概述

Serverless Components 主要通过 Javascript 库封装各种服务的功能，使其变得易用和可复用。该平台专注于提供后端的场景和用例，并且更多的支持 Serverless 化的基础云服务，这样可以使用户通过更少的开销，更低的成本来构建应用。Serverless Components 更适合后端的场景，对应的 React 组件则更适合前端的场景。

Serverless Components 既可以提供基础设施服务（例如，[对象存储 COS](http://github.com/serverless-components/tencent-cos)），也可以提供更高阶的场景——这也是组件最擅长的部分。例如以下的场景：

1. 多个基础设施服务，提供特定的能力，例如数据处理管道。
2. 提供具体功能，例如用户注册，评论或者支付的模块等。
3. 提供整个应用的部署，例如博客系统，流视频播放系统，或者落地页等。

开发 Serverless Components 的语法可以直接调用和封装低维度的组件，并且部署对应的资源。这样的设计可以让你无需考虑底层基础设施的配置，快速构建更高阶的组件。

Serverless Components 可以通过**声明**的方式使用（通过 `serverless.yml` 文件），也可以通过**编程**的方式使用（通过 `serverless.js` 文件）。

如果你希望尽可能简单快速的部署一个 Serverless 应用，并且不会复用这个组件的话，那么用声明的方式来调用组件就可以满足你的需求。

如果你希望构建一个可复用的组件，那么应该用编程的方式来使用这些基础的组件，并且快速构建自己的 Serverless 应用。

Serverless Component 是免费的，同时任何人都可以将他们开发的组件发布在注册中心 Registry 中，供团队或他人使用。

<br/>

# 使用 Components

### Serverless.yml 介绍

Serverless Components 完全借助云资源进行部署，可以通过注册中心进行组件的复用和二次开发。当前注册中心的 API 已经发布并可以使用，但当前并未提供可视化的搜索能力。如果当前使用注册中心则需要运行 `serverless registry` 来获取可用的组件。

使用 Serverless Component 需要在 `serverless.yml` 中声明存在于注册中心的组件名称，语法如下所示：

```yaml
# serverless.yml

component: express # The name of the Component in the Registry
app: fullstack # Your Serverless Framework App
name: rest-api # The name of your instance of this Component

inputs: # The configuration the Component accepts according to its docs
  src: ./src
```

当使用 Serverless Components 部署时，不需要在本地安装任何组件，而是在运行 deploy 命令时，`serverless.yml` 中的配置文件和 `inputs` 中指定参数或的代码目录会被传入 Serverless Components 部署引擎中。

注意，当前的的 Serverless Component 在 `serverless.yml` 中只能指定一个组件。这样的部署结构有助于拆分一个 Serverless 应用中的不同资源和模块，比起将多个组件放入一个 yaml 文件中，这样的方式可以更灵活的管理和编排。

**注：** 当前 Serverless Components 不能用在存量的 Serverless Framework 项目中（例如，项目文件中存在 `functions`， `events`， `resources` 和 `plugins` 这些字段时）

### 输入

每个 Serverless Component 都支持通过 `inputs` 参数来传递在通过`serverless deploy`执行部署时的所需变量，在具体的 Component 文档中可以查看到 `inputs` 支持哪些参数。

有一些 `inputs` 是比较特殊的类型，比如 `src` 这个参数，指定的是你希望部署到云端的代码和文件的路径，因此 Component 会对该参数做特殊的处理：在云端运行 Component 之前，Serverless Framework 会先识别并将 `src` 中的文件传到云端。为了保证最佳的部署性能，通常我们建议 `src` 目录中的包最好小于 5MB。文件包过大的时候回导致上传时间变长，部署也会变慢。因此也建议首先在通过 hook 的方式构建你的代码，并将构建完成的 `dist` 用于上传，如下配置所示：

```yaml
inputs:
  src:
    src: ./src # Source files 源文件
    hook: npm run build # Build hook to run on every "serverless deploy"
    dist: ./dist # Location of the distribution folder to upload
```

你也可以使用支持 glob 语法的 exclude 表达式来排除特定的文件或者文件夹被上传，如下所示：

```yaml
inputs:
  src:
    src: ./src # Source files
    exclude:
      - .env # exclude .env file in ./src
      - '.git/**' # exclude .git folder and all subfolders and files inside it
      - '**/*.log' # exclude all files with .log extension in any folder under the ./src
```

提升 Component 的 Input 类型是我们当前高优先级在解决的问题。

除了部署动作支持通过 inputs 传递变量外，其他的动作（比如 remove，或者其他 Component 的自定义动作）也可以支持配置 inputs，如下所示：

```yaml
commandInputs:
  remove:
    keepResource: true
  myComponentMethod:
    message: hello
```

一旦配置了自定义动作的 inputs 参数，Component 开发者可以在相关的自定义方法中通过传入的第一个参数接收到这些输入。例如上面的配置中，当 Component 用户使用`sls myComponentMethod`执行自定义动作时，Component 中的`myComponentMethod`方法便可以接收到一个`{ message: "hello" }`这样的输入参数。

此外，所有的 inputs 参数都可以使用命令行的方式进行覆盖，例如上例中如果用户执行`sls myComponentMethod --inputs anotherMsg=world`，Component 中的`myComponentMethod`方法便会接收到一个`{ message: "hello", anotherMsg: "world" }`这样的输入参数。

### 部署

当前 Serverless Framework 框架可以通过 `serverless deploy` 命令方便的对 component 进行部署。

```bash
$ serverless deploy
```

Serverless Components 支持秒级别的部署，但在第一次部署时往往会花更久的时间（可能比二次部署慢 5 倍），因为创建云资源耗时更久，而更新已有的云资源配置则相对更快。

### 状态

Serverless Components 自动将状态存储的云端，因此你可以很方便的将你的组件发布到 Github，Gitlab，Coding 等代码托管平台。并且可以和团队中其他人一起协作，相同主账号下的子账户即可进行协作开发。(通过在 `serverless.yml` 中的 org 组织信息判断是否在同一个团队。当前 org 默认为腾讯云的 appid，)

```yaml
app: ecommerce
component: my-component
name: rest-api
```

### 版本

Serverless Components 通过如下配置指定版本信息：

```yaml
component: express@0.0.2
```

当你在配置中指定版本时，则会在项目中固定使用该版本的 Component。当不指定版本信息时，Serverless Framework 就会自动获取最新版本的组件。在正式项目中，建议指定 Component 为固定的版本号。

### 输出

当 Component 部署完毕时，会输出 `outputs` 对象。

输出通常包含了部署 Component 实例时最重要的信息，比如 API 或者网站的 URL 等。

输出可以被其它 Component 在 `inputs` 配置中引用，如下语法所示：

```yaml
# Syntax 语义
${output:[stage]:[app]:[instance].[output]}

# Examples 例子
${output:prod:ecommerce:products-api.url}
${output:prod:ecommerce:products-database.name}
```

### 账号配置

在部署时，无论是使用 `serverless.yml` 还是 `serverless.js`，Serverless Components 会在当前目录寻找 `.env` 文件。

部署过程中，如果 `.env` 文件存在，Serverless Components 会将其作为环境变量上传。如果你使用的和各云厂商提供的 `secretId` 和 `secretKey` 字段一致的环境变量名，Serverless Components 在部署期间会自动将其注入到需要该秘钥的组件中，用来创建基础设施服务。

如果你按照如下方式配置，这些秘钥可以被 `serverless.yml` 以及 `serverless.js` 中的所有 Serverless Components 使用，也包括其中引用到的基础组件。

以下是目前支持的秘钥配置：

#### 腾讯云账号配置

> 注：当前腾讯云支持通过`微信`扫描二维码一键授权登录/注册，扫码生成的临时秘钥文件为 `.env` ，但目前该秘钥最长可以支持 30 天有效期授权，过期需要重新授权。如果需要持久秘钥或者在角色中提供了其他权限控制，也可以通过下面方式填写 `.env` 文件进行持久授权。

```bash
TENCENT_SECRET_ID=123456789
TENCENT_SECRET_KEY=123456789
```

组件也可以通过 `this.context.credentials.tencent` 来获取腾讯云的秘钥配置，返回的格式如下所示：

```json
{
  "secret_id": "123456789",
  "secret_key": "123456789",
  "region": "ap-guangzhou"
}
```

### 环境

Serverless Components 提供了 Stage 的概念，支持通过 Stage 的方式区分并部署完全不同的 Component 实例，从而做到开发、测试和生产环境的隔离。

默认的环境配置为 `dev` 开发环境，如果希望修改该配置，可以直接在 `serverless.yml` 中更新，如下所示：

```yaml
app: my-app
component: express@0.0.2
name: my-component-instance
stage: prod # 更新环境信息
```

此外，也可以通过在环境变量中填写 `SERVERLESS_STAGE` 来指定 Stage 信息，该配置会覆盖 `serverless.yml` 中的 `stage` 字段，如下所示：

```bash
SERVERLESS_STAGE=prod
```

另外可以通过在部署过程中指定 Stage 参数来进行环境的指定和切换，该方式会覆盖 `serverless.yml` 和 环境变量中的配置，如下所示：

```bash
$ serverless deploy --stage prod
```

注： CLI 中配置参数的方式会覆盖 `serverless.yml` 和环境变量中的 `stage` 配置，但环境变量中的配置只会覆盖 `serverless.yml` 中的 `stage` 字段

近期 Serverless Component 已经支持通过不同的 `.env` 指定不同环境中的参数配置。其中，每个文件必须采用如下命名规范：`.env.STAGE`。例如，如果你希望运行 prod 生成环境中的配置，则环境变量文件需要命名为 `.env.prod` 才可以被加载，否则会默认读取 `.env` 文件中的配置。

该使用方式的一个最佳实践为，如果希望通过不同的云账户来区分不同的环境，则需要在 `.env` 配置文件中填写不同账户的秘钥，从而在部署时读取不同环境的配置文件。

<br/>

### 变量

你可以直接通过变量的方式在 `serverless.yml` 中引用环境变量，`serverless.yml` 中的值，或者其他 Component 中已经部署的实例中的输出信息，配置如下所示：

```yaml
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${stage}-${app}-${name} # 命名最终为 "prod-ecommerce-rest-api"
  region: ${env:REGION} # 环境变量中指定的 REGION= 信息
  vpcName: ${output:prod:my-app:vpc.name} # 获取其他组件中的输出信息
  vpcName: ${output:${stage}:${app}:vpc.name} # 上述方式也可以组合使用
```

#### 变量：Org

> 变量 Org 目前在中国并没有实际使用，系统会默认使用腾讯云的 appid 信息作为 Org 信息，并且不需要中国项目的在引用中使用 `${org}` 内容

#### 变量：Stage

当前支持通过 `${stage}` 的方式，在 `serverless.yml` 的 `inputs` 字段中引用 `stage` 的信息，如下所示：

```yml
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${stage}-api # 该例子中的 name 值为 "prod-api"
```

**注：** 如果未指定 `stage` 参数，则默认的值为 `dev` 。当前支持通过 `--stage` 参数修改 `stage` 的值：

```
$ serverless deploy --stage prod
```

#### 变量：App

当前支持通过 `${app}` 的方式，在 `serverless.yml` 的 `inputs` 字段中引用 `app` 的信息，如下所示：

```yml
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${app}-api # 该例子中的 name 值为 "ecommerce-api"
```

**注：** 如果未指定 `app` 参数，则默认的 app 值会和 `serverless.yml` 中的 name 保持一致，当前支持通过 `--app` 参数修改 `app` 的值：

```
$ serverless deploy --app my-other-app
```

#### 变量：Name

当前支持通过 `${name}` 的方式，在 `serverless.yml` 的 `inputs` 字段中引用 `name` 的信息，如下所示：

```yml
app: ecommerce
component: express
name: rest-api
stage: prod

inputs:
  name: ${name} # 该例子中的 name 值为 "rest-api"
```

#### 变量：环境变量 Environment Variables

你可以直接在 `serverless.yml` 中通过 `${env}` 的方式，直接引用环境变量配置（包含 `.env` 文件中的环境变量配置，以及手动配置在环境中的变量参数）

例如，如果你希望引用环境变量 `REGION`，可以直接这样引用 `{env:REGION}`

```yml
component: express
app: ecommerce
name: rest-api
stage: prod

inputs:
  region: ${env:REGION}
```

#### 变量：输出 Outputs

将其他 Component 部署完成后的输出作为变量进行传递是变量引用最重要的功能之一。该能力支持在不同的 Component 方便的共享配置信息，对于构建 Serverless 架构不可或缺。

如果你希望在 Component 中引用其他 Component 的输出信息，可以通过如下语法进行配置：`${output:[app]:[stage]:[instance name].[output]}`

```yml
component: express
app: ecommerce
name: rest-api
stage: prod

inputs:
  roleArn: ${output:[STAGE]:[APP]:[INSTANCE].arn} # 获取已经部署的其他 Component 中的 output 信息
```

当前支持获取不同 App，实例以及不同环境(Stage）中的输出信息。

该能力的一个应用场景是可以支持横跨不同环境(Stage）共享资源信息，当一个开发者在个人的环境中开发一个 Component 实例时，如果他希望获取公共的 “dev” 环境中的配置信息时，即可采用该方式引用。例如获取 DB 的参数配置等。用这种方式团队中的开发者无需重新为个人环境部署一套全新资源即可完成特性开发、bug 修复等工作，只需要部署一个新的 Component 实例并且复用公共配置即可。

<br/>

### 代理

问题描述: 用户环境无外网权限，必须通过代理才能访问外网，在`sls deploy` 时报网络故障
<br>
解决方法: 在`.env`文件中增加以下配置, 这需要 Node.js 的版本`>=11.7.0`:

```
HTTP_PROXY=http://127.0.0.1:12345 # 您的代理
HTTPS_PROXY=http://127.0.0.1:12345 # 您的代理
```

或者:

```
http_proxy=http://127.0.0.1:12345 # Your proxy
https_proxy=http://127.0.0.1:12345 # Your proxy
```

### 参数-**当前只中国用户可用**

用户可以通过命令行为当前 app 和 stage 的敏感信息设置参数, 可以后续直接在配置文件中使用

#### 参数设置

`serverless param set id=param age=12 [--app test] [--stage dev]`

- 用户可以一次性设置多个参数, `paramName=paramValue`
- 用户可以显式的设置`app`和`stage`, 否则命令行则会读取配置文件中的设置或者使用默认值

#### 参数展示

`serverless param list [--app test] [--stage dev]`

- 会返回展示当前`app`和`stage`的全部参数
- 用户可以显式的设置`app`和`stage`, 否则命令行则会读取配置文件中的设置或者使用默认值

#### 参数使用

可以参考[Serverless parameters 使用文档](https://www.serverless.com/framework/docs/dashboard/parameters#using-a-parameter-in-serverlessyml)

# 使用模板（Template）

模板（Template）是由其他开发者通过 Serverless 注册中心共享的项目模板，提供了比组件更傻瓜化的使用场景。因为分享模板的开发者已经提前配置好项目以及相关的`serverless.yml`，模板的使用者只需要通过 Serverless 初始化命令选择从某个模板初始化项目，即可获得一个可以立即部署的 Serverless 项目。模板甚至会包含多个已经预先配置的组件实例，例如 Fullstack 项目模板中已经预置了数据库，API 层，前端等组件实例，用户只需要加入自己的业务逻辑代码即可立即部署一个 Serverless Fullstack 应用。

### 查看可使用的模板

你可以使用以下两种方式查看可供使用的模板：

1. 访问 Serverless 注册中心页面：https://registry.serverless.com
2. 使用`sls registry`命令列出所有推荐的组件或者项目模板：

```bash
serverless ⚡ registry

...

Featured Templates:

  fullstack - Deploy a full stack application.
  fullstack-nosql - Deploy a nosql full stack application.
  ocr-app - Deploy a serverless OCR application.

Serverless › Find more here: https://registry.serverless.com
```

### 从模板初始化项目

一旦你决定了所要使用的项目模板，你就可以使用内置的`init`命令初始化你的项目。此命令将会自动从注册中心下载你所选择的模板，并为你创建好项目文件夹。例如：

```bash
sls init -t fullstack # 使用fullstack项目模板创建项目

cd  fullstack # 进入到项目文件夹

sls deploy --all # 部署整个fullstack项目
```

# 开发 Components

如果你希望开发自己的 Serverless Component，那么必须要关注一下两个文件：

- `serverless.component.yml` - 该文件包含了你的 Serverless Component 的定义

- `serverelss.js` - 该文件包含你的 Serverless Component 的代码

有一点需要特别注意，Serverless Component **只能**运行在云端，**不支持**在本地运行。也就是说，如果你要运行或者测试你的 Component，你必须先将该组件发布到云端注册中心上（通常只需要几秒钟的时间）。当前对 Component 的开发体验在持续优化中，当前的开发原理如下：

### serverless.component.yml

为了声明一个新的 Serverless Component 并且将他发布在 Serverless 注册中心上，必须要创建一个包含如下属性的 `serverless.component.yml` 文件：

```yaml
# serverless.component.yml

name: express # 必填，Component 名称
version: 0.0.4 # 必填，Component 版本
author: eahefnawy # 必填，Component 作者
org: serverlessinc # 必填，展示开发这个 Component 的组织信息
description: Deploys Serverless Express.js Apps # 选填，Component 的描述
keywords: tencent, serverless, express # 选填，Component 的关键词可以让它更容易在 registry.serverless.com 中被搜到
repo: https://github.com/owner/project # 选填，Component 的项目代码
license: MIT # 选填，Component 代码所遵循的协议
main: ./src # 选填，Component 的代码路径
```

### 在 serverless.component.yml 中定义用户可输入的类型

一些 component 在被使用时往往需要在`inputs`中定义各种在项目部署时所需的配置，这些配置项往往需要用户配置正确的输入，否则项目部署将会失败。为了更好的指导用户配置正确的输入项，特别是帮助用户检查配置中的错误，component 的开发者可以在开发 component 时就定义好各种 component 所支持的配置项以及对这些配置项的输入要求。例如，如果 component 支持让用户配置所创建的云函数名称，并且希望云函数名称仅能包含特定的字符，则可以在`serverless.component.yml`中定义如下的输入检查规则：

```yaml
# serverless.component.yml

actions:
  # deploy action
  deploy:
    definition: Deploy your Express.js application to Tencent SCF
    inputs:
      scf:
        type: object
        description: The SCF related configuration
        keys:
          functionName:
            type: string
            # 定义scf函数名称仅能配置为字母
            regex: ^[a-z]+$
```

有了这个规则定义，当此 component 的用户在使用此 component 时如若配置了如下的云函数名称：

```yaml
# serverless.yml

component: express
name: express-api
stage: dev

inputs:
  src: ./src
  scf:
    functionName: func01 # 函数名称中包含了数字
```

在用户进行部署时则会收到如下的错误提示：

```bash
3s › express-api › inputs validation error: "scf.functionName" with value "func01" fails to match the required pattern: /^[a-z]+$/
```

用户便可根据此提示修改其配置后成功完成应用部署。

`serverless.component.yml`中支持定义的输入类型有很多种，详细举例说明如下：

```yaml
# serverless.component.yml

actions:
  # 这里分别定义该component支持的各种action，例如这里定义了最常见的deploy action
  deploy:
    definition: Deploy your Express.js application to Tencent.
    inputs:
      # Type: string (字符串类型)
      param1: # inputs中的字段名称
        type: string
        # Optional，以下为可选定义
        required: true # Defaults to required: false
        default: my-app # The default value
        description: Some description about param1. # A description of this parameter
        min: 5 # Minimum number of characters
        max: 64 # Maximum number of characters
        regex: ^[a-z0-9-]*$ # A RegEx pattern to validate against.

      # Type: number (数值类型)
      memory:
        type: number
        # Optional
        default: 2048 # The default value
        min: 128 # Minimum number allowed
        max: 3008 # Maximum number allowed
        allow: # The values that are allowed for this
          - 128
          - 1024
          - 2048
          - 3008

      # Type: boolean (布尔类型)
      delete:
        type: boolean
        # Optional
        default: true # The default value

      # Type: object (对象类型)
      vpcConfig:
        type: object
        # Optional
        keys: # 定义对象中的各个字段
          securityGroupIds: # 每个字段的定义都可以使用上面完整的定义类型，也可以是一个嵌套的对象
            type: string

      # Type: array (数组类型)
      mappingTemplates:
        type: array
        # Optional
        min: 1 # Minimum array items
        max: 10 # Max array items
        items:
          # 定义数组中每个元素的类型
          - type: number
            min: 5
            max: 13
          # 数组中的元素可以有多种类型
          - type: object
            keys:
              field1:
                type: string
        default: # Default array items
          - '12345678'

      # Type: datetime (日期类型)
      # This Type is an ISO8601 string that contains a datetime.
      rangeStart:
        type: datetime

      # Type: url (URL地址类型)
      # This Type is for a URL, often describing your root API URL or website URL.
      myUrl:
        type: url
```

### serverless.js

`serverless.js` 文件包含了 Serverless Component 的代码。

如果要实现一个最基本的 Serverless Component，只需创建一个 `serverless.js` 文件，扩展 Component 类并且增加一个 `deploy` 方法即可，如下所示

```javascript
// serverless.js

const { Component } = require('@serverless/core');

class MyComponent extends Component {
  async deploy(inputs = {}) {
    return {};
  } // The default functionality to run/provision/update your Component
}

module.exports = MyComponent;
```

`deploy()` 方法是必须的，Component 的操作逻辑都会包含在其中。当客户运行 `$ serverless deploy` 命令时，就会调用 `deploy()` 方法。

你也可以在类中增加其他的方法，例如 `remove()` 方法一般是第二步要实现的逻辑，该方法支持通过 `$ serverless remove` 命令移除你的 Serverless Component 创建的项目资源。

除了 `deploy()` 和 `remove()` 之外，Serverless Component 也支持更多的自定义方法，来完成更多的自动化操作。

Serverless Components 当前还在较为初期的阶段，但已经逐步在支持 `test()` 方法，或者 `logs()` 和 `metrics()` 方法。甚至是 `seed()` 方法用于建立数据库 Component 的初始化值。总的来说，Component 将会支持更多的能力，来更好的实现 Serverless 应用的开发、部署和调试等能力。

除了 `deploy()` 方法必须实现之外，其他的都是可选的。所有的方法都会输入 `inputs` 对象，之后返回 `outputs` 对象。

下面是一个增加了 `remove` 方法的例子，以及一个自定义方法的例子：

```javascript
// serverless.js

const { Component } = require('@serverless/core');

class MyComponent extends Component {
  /*
   * The default functionality to run/provision/update your Component
   * You can run this function by running the "$ serverless deploy" command
   */
  async deploy(inputs = {}) {
    return {};
  }

  /*
   * If your Component removes infrastructure, this is recommended.
   * You can run this function by running "$ serverless remove"
   */

  async remove(inputs = {}) {
    return {};
  }

  /*
   * If you want to ship your Component w/ extra functionality, put it in a method.
   * You can run this function by running "$ serverless anything"
   */

  async anything(inputs = {}) {
    return {};
  }
}

module.exports = MyComponent;
```

在 Component 方法里，通过 this 方法指定当前的运行环境，包含了一些可用的工具。下面有一些指南可以展示出在 Component 方法中哪些语法是可用的。

```javascript
// serverless.js

const { Component } = require('@serverless/core');

class MyComponent extends Component {
  async deploy(inputs = {}) {
    // this features useful information
    console.log(this);

    // Common provider credentials are identified in the environment or .env file and added to this.context.credentials
    // when you run "serverless deploy", then the credentials in .env will be used
    // when you run "serverless deploy --stage prod", then the credentials in .env.prod will be used...etc
    // if you don't have any .env files, then global aws credentials will be used
    const dynamodb = new AWS.DynamoDB({ credentials: this.credentials.aws });

    // You can easily create a random ID to name cloud infrastructure resources with using this utility.
    const s3BucketName = `my-bucket-${this.resourceId()}`;
    // This prevents name collisions.

    // Components have built-in state storage.
    // Here is how to save state to your Component:
    this.state.name = 'myComponent';

    // If you want to show a debug statement in the CLI, use console.log.
    console.log('this is a debug statement');

    // Return your outputs
    return { url: websiteOutputs.url };
  }
}

module.exports = MyComponent;
```

### Component 中涉及源代码的场景

当开发 Component 的时候涉及到需要附源代码的场景时（例如，创建了一个需要运行在腾讯云 SCF 平台上的 Component），如果你在 inputs 中指定了 `src` 字段，则在这个目录下的所有文件会被自动打包上传，从而可以被 Component 环境所使用。

在你的 Component 中， `inputs.src` 将会指向你环境中源文件的一个 zip 包，如果希望解压这个源文件，可以通过如下方法来实现：

```javascript
async deploy(inputs = {}) {

  // Unzip the source files...
  const sourceDirectory = await this.unzip(inputs.src)

}
```

解压完毕后，可以很方便的操作这些源文件了。操作完毕后，如果希望再次打包，也可以通过如下方法来实现（例如在某些场景下，需要再次压缩源文件并且上传到云函数等计算平台上）：

```javascript
async deploy(inputs = {}) {

  // Zip up the source files...
  const zipPath = await instance.zip(sourceDirectory)

}
```

### 增加 Serverless Agent

如果你的 Component 运行代码时，你希望可以通过开发模式 (`serverless dev`) 支持实时的流日志输出，或者错误信息等信息的打印等，则需要将 Serverless SDK 增加到部署的逻辑中，可以参考如下实现方式：

```javascript
// unzip source zip file
console.log(`Unzipping ${inputs.src}...`);
const sourceDirectory = await instance.unzip(inputs.src);
console.log(`Files unzipped into ${sourceDirectory}...`);

// add sdk to the source directory, add original handler
console.log(`Installing Serverless Framework SDK...`);
instance.state.handler = await instance.addSDK(sourceDirectory, '_express/handler.handler');

// zip the source directory with the shim and the sdk
console.log(`Zipping files...`);
const zipPath = await instance.zip(sourceDirectory);
console.log(`Files zipped into ${zipPath}...`);
```

增加 SDK 之后，可能需要再次将代码打包上传到云服务中（例如云函数 SCF）

### 开发流程

Serverless Components 仅能在云端运行，而不支持在本地运行。这对 Component 的用户而言有巨大的优势。同时我们也通过下面的开发流程让开发一个 Component 变得更加容易。

当你新增或者更新 Serverless Components 的代码时，如果希望测试变化的部分，那么需要先发布该 Component 到云端。由于我们不希望发布的测试版本会影响到正式版本的 Component（可能有用户正在使用这些正式版本），因此当前支持直接发布 "dev" 版本的 Component，用于隔离正式环境和开发环境。

运行下面的命令即可发布 Serverless Component 到 "dev" 版本中。

```console
$ serverless registry publish --dev
```

在 `serverless.yml` 中，你同样可以指定 "dev" 版本进行测试，只需在 Component 名称后面增加 `@dev` 即可，如下所示：

```yaml
# serverless.yml

app: fullstack
component: express@dev # Add "dev" as the version
name: rest-api

inputs:
  src: ./src
```

运行如下命令来检测项目变化：

```shell
$ serverless deploy --debug
```

在开发 Component 时，我们推荐通过 `--debug` 来获取 `console.log()` 日志信息，这样可以更清晰的看到 Component 的部署阶段和流程，推荐在你认为需要的地方都增加 `console.log()` 来记录部署状态，从而更好地开发和排查问题。

```javascript
class MyComponent extends Component {
  async deploy(inputs) {
    console.log(`Starting MyComponent.`);
    console.log(`Creating resources.`);
    console.log(`Waiting for resources to be provisioned.`);
    console.log(`Finished MyComponent.`);
    return {};
  }
}
```

当你准备好发布一个正式版本的 Component 时，更新 `serverless.component.yml` 中的版本号，之后直接运行 publish 命令，不需要加 `--dev` 参数。

```yaml
# serverless.component.yml

name: express@0.0.1
```

```bash
$ serverless publish

Serverless: Successfully publish express@0.0.1
```

### 开发建议

#### 结果导向/自上而下

在开发自己的 Serverless Component 时，我们建议你从结果入手，关注点更多在于你希望提供的结果是怎样的，并且创建这个 Component 的首要目的是解决你的问题。在完成最初的目标之后，再去做结构优化，将其分解成为不同层级的 Components。

#### 结果是你的优势

对基础设施的服务进行配置其实非常复杂，因此市面上也有非常多的配置工具会支持所有的配置和组合方式（例如 AWS 的 Cloudformation 等），但 Serverless Components 和他们相比，最有力的优势就是它知道自己需要提供什么样的具体场景。

关于软件部署工具，我们学到一个非常重要的方面就是，一旦你知道自己希望得到场景，你就可以据此创造出一个更好的工具。

Components 了解用户场景，基于场景，你可以实现如下几点：
1）更加可靠的配置基础设施，因为你对于自己希望的效果和配置方案十分清晰，所以可以采用最简洁优雅的方案配置。
2）更快的配置基础设施
3）通过给 Components 增加自定义的方法，针对特定的用例实现自动化的配置。

#### 将大部分状态存在云服务商中

Serverless Components 节省了很多状态信息。事实上，很多功能强大的 Components 在其状态对象中也只有不到 10 个属性。

Components 依赖云服务作为状态的来源，并用其存储状态信息。这样可以防止服务出现状态转移，从而影响基础设施配置工具。这样做也可以支持 Components 使用已有的云资源，也就是那些一开始不是由 Components 创建的资源，用于迁移等场景。

#### 操作成功后立即存储状态信息

如果你确实需要存储状态，那么试着在一次成功的部署后立即存储状态信息。用这种方式，如果后续的部署和操作中有发生失败的情况，终端客户需要再次部署的时候，你的 Serverless Components 可以从中断的地方开始继续部署。这样也减少了冗余资源的创建。

#### 易用性优化

我们相信 serverless 的基础设施和架构可以让更多人拥有更强大的能力来开发软件。

正因如此，我们将我们所有的项目设计的尽可能的易于理解和学习。请尝试使用简单的，原始的 Javascript 语法。此外，为了减少安全风险和依赖的复杂度，请您尽可能少的使用 NPM 依赖。

# 开发模板 Templates

### 什么是项目模板

项目模板（Template）就是一个正常的基于 Serverless Component 进行部署的项目，你可以使用 Serverless 注册中心发布命令`sls publish`将你的项目发布到 Serverless 注册中心。一旦你发布了你的项目到注册中心，这个项目便成为了一个项目模板，可以被其他开发者所使用，所以项目模板其实是一种分享你的 Serverless 项目的方式。例如作为一个开发者你可能开发了一个很棒的基于 Serverless Component 进行部署的博客项目，你可以将该博客项目作为项目模板发布到注册中心，这样其他开发者只需要选择使用你的博客模板初始化项目，稍作改动变可以很快的部署一个自己的基于 Serverless 的博客。腾讯云的开发团队已经预先做好了一些很棒的项目模板，比如 fullstack 模板，其中包含了 Serverless 数据库，Serverless 后端 API，SSR 前端页面以及相关的网络配置，你只需要选择使用 fullstack 模板初始化项目，加入自己的业务逻辑，便可以立即部署一个完全基于 Serverless 的整个 Web 应用程序架构。

### 如何分享（发布）项目模板

要将你的基于 Serverless Component 部署的项目作为模板发布非常简单，你不需要对项目进行任何改造，只需要添加一个`serverless.template.yml`文件（或者修改已有的`serverless.template.yml`文件），在其中添加一些需要告诉注册中心的模板元信息即可。详细说明如下：

```yaml
name: fullstack # 项目模板的名字
author: Tencent Cloud, Inc. # 作者的名字
org: Tencent Cloud, Inc. # 组织名称，可选
description: Deploy a full stack application. # 描述你的项目模板
keywords: tencent, serverless, express, website, fullstack # 关键字
repo: https://github.com/serverless-components/tencent-fullstack # 源代码
readme: https://github.com/serverless-components/tencent-fullstack/tree/master/README.md # 详细的说明文件
license: MIT # 版权声明
src: # 描述项目中的哪些文件需要作为模板发布
  src: ./ # 指定具体的相对目录，此目录下的文件将作为模板发布
  exclude: #描述在指定的目录内哪些文件应该被排除
    # 通常你希望排除
    # 1. 包含secrets的文件
    # 2. .git git源代码管理的相关文件
    # 3. node_modules等第三方依赖文件
    - .env
    - '**/node_modules'
    - '**/package-lock.json'
```

一旦你准备好了描述项目模板元信息的`serverless.template.yml`文件，便可以使用发布命令`sls publish`将此项目作为模板发布到注册中心。

# CLI 命令列表

#### `serverless registry`

查看可用的 组件（Components）以及模板（Template） 列表

#### `serverless registry publish`

发布组件（Components）或者模板（Template） 到 Serverless 注册中心

`--dev` - 支持 dev 参数用于发布 `@dev` 版本的 Component，用于开发或测试，此参数仅对组件有效，对模板无效，模板没有版本的概念。

#### `serverless init`

选择一个模板初始化项目。使用`-t`参数指定所要使用的模板。

#### `serverless deploy`

部署一个 Component 实例到云端

`--debug` - 列出组件部署过程中 `console.log()` 输出的部署操作和状态等日志信息。

#### `serverless remove`

从云端移除一个 Component 实例

`--debug` - 列出组件移除过程中 `console.log()` 输出的移除操作和状态等日志信息。

#### `serverless info`

获取并展示一个 Component 实例的相关信息

`--debug` - 列出更多 `state`.

#### `serverless dev`

启动 DEV MODE 开发者模式，通过检测 Component 的状态变化，自动部署变更信息。同时支持在命令行中实时输出运行日志，调用信息和错误等。此外，支持对 Node.js 应用进行云端调试。

#### `serverless login`

支持通过 login 命令，通过微信扫描二维码的方式，登录腾讯云账号并授权对关联资源进行操作。

#### `serverless <command> --inputs key=value foo=bar`

在运行命令时覆盖 `serverless.yml` 中的 inputs

例子:

```
# 简单的例子
serverless test --inputs domain=serverless.com
# 传递对象: 使用 JSON 格式
serverless invoke --inputs env='{"LANG": "en"}'
# 传递 Array: 用逗号分隔
serverless backup --inputs userIds=foo,bar
```
