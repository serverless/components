<!--
title: Deploy Serverless Laravel Application
description: "Deploy Serverless Laravel application with Tencent Laravel component"
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

# Build a Laravel application

[中文](./README.md) | English

Use the [Tencent Laravel Component](https://github.com/serverless-components/tencent-laravel) to quickly create a Laravel application on the Tencent Cloud.

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
$ serverless create --template-url https://github.com/serverless/components/tree/master/templates/tencent-laravel
```

Install the PHP dependencies:

```shell
$ composer install
```

> Notice：Laravel uses Composer to manage dependencies so you should install Composer first. Please refer to the [official installation guide](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos) for an in-depth guide.

### 3. Deploy

Use the `serveless` command to deploy your project. You could also add the `--debug` flag to see detailed information about th deployment process.

If you have a `WeChat` account you don't need to configure the `.env` file, just scan the QR code in terminal and use your Tencent Cloud account.

If you don't have a WeChat account, you can jump to [account](#6-account-optional) step and configure the account info manually.

```text
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

### 4. Test

Open up the following URL in your favorite browser: https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/. You should see the welcome page.

Use the following command to test the API and check the response:

```shell
$ curl -X GET https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/api/user
{"data":[{"name":"yugasun","email":"yuga.sun.bj@gmail.com"}]}
```

```shell
$ curl -X GET https://service-js0qnn8k-1251556596.gz.apigw.tencentcs.com/release/api/user/1
{"data":{"name":"yugasun","email":"yuga.sun.bj@gmail.com"}}
```

> Notice: Please change the api url to your deployed one.

### 5. Remove

Use the following command to remove the project

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

### 6. Account (optional)

Just create a `.env` file

```shell
$ touch .env # your Tencent API Keys
```

Add the access keys of a [Tencent CAM Role](https://shell.cloud.tencent.com/cam/capi) with `AdministratorAccess` in the `.env` file, using this format:

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```

- If you don't have a Tencent Cloud account you need to [sign up](https://intl.cloud.tencent.com/register) first.
