<!--
title: Deploy Serverless Python Flask Application
description: "Deploy Serverless python Flask application with Tencent Flask component"
date: 2019-12-26
thumbnail: 'https://img.serverlesscloud.cn/20191226/1577347052683-flask_%E9%95%BF.png'
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

[![Serverless Python Flask Tencent Cloud](https://img.serverlesscloud.cn/20191226/1577347052683-flask_%E9%95%BF.png)](http://serverless.com)

# Build a Flask Application

[中文](./README.md) | English

Build a serverless Flask application with the [Tencent Flask Component](https://github.com/serverless-components/tencent-flask).

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

Create a template in a new folder with the following command

```shell
$ serverless create --template-url https://github.com/serverless/components/tree/v1/templates/tencent-flask
```

You can find the API definitions in `app.py`:

```python
# -*- coding: utf8 -*-

import json
from flask import Flask, jsonify, request
app = Flask(__name__)


@app.route("/")
def index():
    return "Hello Flash"

@app.route('/user', methods = ['POST'])
def addUser():
    # we must get request body from clound function event;
    event = request.environ['event']
    user = json.loads(event['body'])
    return jsonify(data=user)


@app.route("/user", methods = ['GET'])
def listUser():
    users = [{'name': 'test1'}, {'name': 'test2'}]
    return jsonify(data=users)


@app.route("/user/<id>", methods = ['GET'])
def getUser(id):
    return jsonify(data={'name': 'test1'})
```

> Notice: This project uses the `@serverless/tencent-flask` component. When deploying it will automatically install dependencies defined in the `requirements.txt` file.

### 3. Deploy

Use the `serverless` command to deploy your project, you could also add the `--debug` flag to see detailed information about the deployment process.

> If you have a `WeChat` account, you don't need to configure the `.env` file, just scan the QR code in terminal and use your Tencent Cloud. If you don't have a WeChat account, you could jump to the [account](#6-account-optional) step and configure the account information manually.

```shell
$ serverless --debug

  DEBUG ─ Resolving the template's static variables.
  DEBUG ─ Collecting components from the template.
  DEBUG ─ Downloading any NPM components found in the template.
  DEBUG ─ Analyzing the template's components dependencies.
  DEBUG ─ Creating the template's components graph.
  DEBUG ─ Syncing template state.
  DEBUG ─ Executing the template's components graph.
  DEBUG ─ Generated requirements from /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-python-flask/requirements.txt in /Users/yugasun/Desktop/Develop/@yugasun/c
omponents/templates/tencent-python-flask/.serverless/requirements.txt...
  DEBUG ─ Using static cache of requirements found at /Users/yugasun/Library/Caches/serverless-python-requirements/e8d881b75e3cc2f83c4b0524573964b029d1fb2996b341e39014a1f55bf8dd7e_slspyc ...
  DEBUG ─ Compressing function flask-function file to /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-python-flask/.serverless/flask-function.zip.
  DEBUG ─ Compressed function flask-function file successful
  DEBUG ─ Uploading service package to cos[sls-cloudfunction-ap-guangzhou-code]. sls-cloudfunction-default-flask-function-1577343417.zip
  DEBUG ─ Uploaded package successful /Users/yugasun/Desktop/Develop/@yugasun/components/templates/tencent-python-flask/.serverless/flask-function.zip
  DEBUG ─ Creating function flask-function
  DEBUG ─ Updating code...
  DEBUG ─ Updating configure...
  DEBUG ─ Created function flask-function successful
  DEBUG ─ Setting tags for function flask-function
  DEBUG ─ Creating trigger for function flask-function
  DEBUG ─ Deployed function flask-function successful
  DEBUG ─ Starting API-Gateway deployment with name MyFlask.TencentApiGateway in the ap-guangzhou region
  DEBUG ─ Using last time deploy service id service-mm30nd1i
  DEBUG ─ Updating service with serviceId service-mm30nd1i.
  DEBUG ─ Endpoint ANY / already exists with id api-qbnxt76u.
  DEBUG ─ Updating api with api id api-qbnxt76u.
  DEBUG ─ Service with id api-qbnxt76u updated.
  DEBUG ─ Deploying service with id service-mm30nd1i.
  DEBUG ─ Deployment successful for the api named MyFlask.TencentApiGateway in the ap-guangzhou region.

  MyFlask:
    region:              ap-guangzhou
    functionName:        flask-function
    apiGatewayServiceId: service-mm30nd1i
    url:                 https://service-mm30nd1i-1251556596.gz.apigw.tencentcs.com/release/
```

### 4. Test

Use the following command to test the API and check the response:

```shell
$ curl -X GET https://service-mm30nd1i-1251556596.gz.apigw.tencentcs.com/release/user

{"data":[{"name":"test1"},{"name":"test2"}]}
```

```shell
$ curl -X POST -H 'Content-Type":"application/json' -d '{"name":"yugasun","email":"yuga_sun@163.com"}' https://service-mm30nd1i-1251556596.gz.apigw.tencentcs.com/release/user

{"data":{"email":"yuga_sun@163.com","name":"yugasun"}}
```

> Notice: Please change the API url to the deployed one.

### 5. Remove

Use the following command to remove the project

```shell
$ serverless remove --debug

  DEBUG ─ Flushing template state and removing all components.
  DEBUG ─ Removing function
  DEBUG ─ Request id
  DEBUG ─ Removed function flask-function successful
  DEBUG ─ Removing any previously deployed API. api-qbnxt76u
  DEBUG ─ Removing any previously deployed service. service-mm30nd1i

  7s › MyFlask › done
```

### 5. Account (optional)

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

- If you don't have a Tencent Cloud account, you should [sign up](https://intl.cloud.tencent.com/register) first.
