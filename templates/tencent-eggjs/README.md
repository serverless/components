<!--
title: Deploy Serverless Egg.js Application
description: "Deploy Serverless Egg.js application with Tencent Egg component"
date: 2019-12-26
thumbnail: 'http://url-to-thumbnail.jpg'
categories:
  - toturial
authors:
  - yugasun
authorslink:
  - https://github.com/yugasun
translators:
  - None
translatorslink:
  - None
-->

# 快速构建 Egg.js 应用

中文 | [English](./README_EN.md)

此模板使用 [腾讯云 Egg.js 组件](https://github.com/serverless-tencent/tencent-egg)，方便的在腾讯云创建，配置和管理一个 Egg.js 应用。

## 快速开始

1. [安装](#1-安装)
2. [配置](#2-配置)
3. [部署](#3-部署)
4. [测试](#4-测试)
5. [移除](#5-移除)
6. [账号配置](#6-账号配置（可选）)

### 1. 安装

**安装 Serverless Framework**

```shell
$ npm install -g serverless
```

### 2. 配置

通过如下命令直接下载该例子，目录结构如下：

```shell
$ serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-eggjs
```

### 3. 部署

通过 `serverless` 命令进行部署，并可以添加`--debug`参数查看部署过程中的信息

> 如您的账号未 [登录](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登录和注册。

```shell
$ serverless --debug

  DEBUG ─ Resolving the template's static variables.
  DEBUG ─ Collecting components from the template.
  DEBUG ─ Downloading any NPM components found in the template.
  DEBUG ─ Analyzing the template's components dependencies.
  DEBUG ─ Creating the template's components graph.
  DEBUG ─ Syncing template state.
  DEBUG ─ Executing the template's components graph.
  DEBUG ─ Compressing function egg-function file to /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-eggjs/.serverless/egg-function.zip.
  DEBUG ─ Compressed function egg-function file successful
  DEBUG ─ Uploading service package to cos[sls-cloudfunction-ap-guangzhou-code]. sls-cloudfunction-default-egg-function-1577345979.zip
  DEBUG ─ Uploaded package successful /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-eggjs/.serverless/egg-function.zip
  DEBUG ─ Creating function egg-function
  DEBUG ─ Created function egg-function successful
  DEBUG ─ Setting tags for function egg-function
  DEBUG ─ Creating trigger for function egg-function
  DEBUG ─ Deployed function egg-function successful
  DEBUG ─ Starting API-Gateway deployment with name MyEgg.TencentApiGateway in the ap-guangzhou region
  DEBUG ─ Service with ID service-p0mbr9ho created.
  DEBUG ─ API with id api-odcjvufi created.
  DEBUG ─ Deploying service with id service-p0mbr9ho.
  DEBUG ─ Deployment successful for the api named MyEgg.TencentApiGateway in the ap-guangzhou region.

  MyEgg:
    region:              ap-guangzhou
    functionName:        egg-function
    apiGatewayServiceId: service-p0mbr9ho
    url:                 https://service-p0mbr9ho-1251556596.gz.apigw.tencentcs.com/release/

  12s › MyEgg › done
```

### 4. 测试

通过如下命令测试 REST API 的返回情况：

> 注：如 windows 系统中未安装`curl`，也可以直接通过浏览器打开对应链接查看返回情况

```shell
$ curl -X GET https://service-p0mbr9ho-1251556596.gz.apigw.tencentcs.com/release/users

[{"id":1,"name":"yugasun","site":"yugasun.com"}]
```

```shell
$ curl -X GET https://service-p0mbr9ho-1251556596.gz.apigw.tencentcs.com/release/users/25

{"id":"25","name":"yugasun","site":"yugasun.com"}
```

```shell
$ curl -X POST -H 'Content-Type:application/json' -d '{"name":"yugasun","site":"yugasun.com"}' https://service-p0mbr9ho-1251556596.gz.apigw.tencentcs.com/release/users

{"id":1,"name":"yugasun","site":"yugasun.com"}
```

> 注意： 请将请求 api 换成你部署成功的 url。

### 5. 移除

可以通过以下命令移除 Egg.js 应用

```shell
$ serverless remove --debug

  DEBUG ─ Flushing template state and removing all components.
  DEBUG ─ Removing function
  DEBUG ─ Request id
  DEBUG ─ Removed function egg-function successful
  DEBUG ─ Removing any previously deployed API. api-rnyrbs3q
  DEBUG ─ Removing any previously deployed service. service-i9096eg8

  5s › MyEgg › done
```

### 6. 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```shell
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 `SecretId` 和 `SecretKey` 信息并保存

如果没有腾讯云账号，可以在此 [注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```
