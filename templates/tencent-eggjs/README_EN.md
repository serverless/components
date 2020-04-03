<!--
title: Deploy Serverless Egg.js Application
description: "Deploy Serverless Egg.js application with Tencent Egg component"
date: 2019-12-26
thumbnail: 'https://img.serverlesscloud.cn/20191226/1577361751088-egg_width.png'
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

[![Serverless Egg Tencent Cloud](https://img.serverlesscloud.cn/20191226/1577361751088-egg_width.png)](http://serverless.com)

# Build a Egg.js application

[中文](./README.md) | English

This template is using the [Tencent Egg Component](https://github.com/serverless-tencent/tencent-egg) to quickly create an Egg.js application on the Tencent Cloud.

## Quick Start

1. [Install](#1-install)
2. [Configure](#2-configure)
3. [Deploy](#3-deploy)
4. [Test](#4-test)
5. [Remove](#5-remove)
6. [Account (optional)](#6-account-optional)

### 1. Install

**Install Serverless Framework**

```shell
$ npm install -g serverless
```

### 2. Configure

Create the template in a new folder with the following command

```shell
$ serverless create --template-url https://github.com/serverless/components/tree/v1/templates/tencent-eggjs
```

### 3. Deploy

Use the `serverless` command to deploy your project. You can also add the `--debug` flag to see more detailed deployment process information.

If you have a `WeChat` account you don't need to configure the `.env` file, just scan the QR code in terminal and use your Tencent Cloud account.

If you don't have a WeChat account you can jump to the [account](#6-account-optional) step and configure the account info manually.

```text
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

### 4. Test

Use the following command to test the REST API and check the response:

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

> Notice: Please change the api url to your deployed one.

### 5. Remove

Use the following command to remove the project

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

### 6. Account (optional)

Just create an `.env` file

```shell
$ touch .env # your Tencent API Keys
```

Add the access keys of a [Tencent CAM Role](https://shell.cloud.tencent.com/cam/capi) with `AdministratorAccess` in the `.env` file, using this format:

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

- If you don't have a Tencent Cloud account, you need to [sign up](https://intl.cloud.tencent.com/register) first.
