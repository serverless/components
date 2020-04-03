<!--
title: Deploy Serverless Laravel Application
description: "Deploy Serverless Laravel application with Tencent Laravel component"
date: 2019-12-26
thumbnail: 'https://img.serverlesscloud.cn/20191226/1577347087676-website_%E9%95%BF.png'
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

[![Serverless PHP Laravel Tencent Cloud](https://img.serverlesscloud.cn/20191226/1577347087676-website_%E9%95%BF.png)](http://serverless.com)

# 快速构建 Laravel 应用

中文 | [English](./README_EN.md)

此模板使用 [腾讯云 Laravel 组件](https://github.com/serverless-components/tencent-laravel)，方便的在腾讯云创建，配置和管理一个 Laravel 应用。

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

通过如下命令初始化项目模板：

```shell
$ serverless create --template-url https://github.com/serverless/components/tree/v1/templates/tencent-laravel
```

安装 PHP 依赖：

```shell
$ composer install
```

> 注意：Laravel 使用 Coposer 管理依赖的，所以你需要先自行安装 Composer，请参考 [官方安装文档](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos)

### 3. 部署

通过 `serverless` 命令进行部署，并可以添加 `--debug` 参数查看部署过程中的信息。

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
  DEBUG ─ Compressing function laravel-function file to /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-laravel/.serverless/laravel-function.zip.
  DEBUG ─ Compressed function laravel-function file successful
  DEBUG ─ Uploading service package to cos[sls-cloudfunction-ap-guangzhou-code]. sls-cloudfunction-default-laravel-function-1577347504.zip
  DEBUG ─ Uploaded package successful /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-laravel/.serverless/laravel-function.zip
  DEBUG ─ Creating function laravel-function
  DEBUG ─ Created function laravel-function successful
  DEBUG ─ Setting tags for function laravel-function
  DEBUG ─ Creating trigger for function laravel-function
  DEBUG ─ Deployed function laravel-function successful
  DEBUG ─ Starting API-Gateway deployment with name MyLaravel.TencentApiGateway in the ap-guangzhou region
  DEBUG ─ Service with ID service-js0qnn8k created.
  DEBUG ─ API with id api-5msr0wp0 created.
  DEBUG ─ Deploying service with id service-js0qnn8k.
  DEBUG ─ Deployment successful for the api named MyLaravel.TencentApiGateway in the ap-guangzhou region.

  MyLaravel:
    region:              ap-guangzhou
    functionName:        laravel-function
    apiGatewayServiceId: service-js0qnn8k
    url:                 https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/
```

### 4. 测试

直接访问：https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/ ，将直接呈现欢迎页。

通过如下命令测试 API 的返回情况：

> 注：如 windows 系统中未安装 `curl`，也可以直接通过浏览器打开对应链接查看返回情况

```shell
$ curl -X GET https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/api/user
{"data":[{"name":"yugasun","email":"yuga.sun.bj@gmail.com"}]}
```

```shell
$ curl -X GET https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/api/user/1
{"data":{"name":"yugasun","email":"yuga.sun.bj@gmail.com"}}
```

> 注意： 请将请求 api 换成你部署成功的 url。

### 5. 移除

可以通过以下命令移除 Laravel 应用

```shell
$ serverless remove --debug

  DEBUG ─ Flushing template state and removing all components.
  DEBUG ─ Removing function
  DEBUG ─ Request id
  DEBUG ─ Removed function laravel-function successful
  DEBUG ─ Removing any previously deployed API. api-5msr0wp0
  DEBUG ─ Removing any previously deployed service. service-js0qnn8k

  7s › MyLaravel › done
```

### 6. 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```shell
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 `SecretId` 和 `SecretKey` 信息并保存

如果没有腾讯云账号，可以在此 [注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```
