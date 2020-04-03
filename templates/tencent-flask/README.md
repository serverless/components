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

# 快速构建 Flask 应用

中文 | [English](./README_EN.md)

此模板使用 [腾讯云 Flask 组件](https://github.com/serverless-components/tencent-flask)，方便的在腾讯云创建，配置和管理一个 Flask 应用。

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
$ serverless create --template-url https://github.com/serverless/components/tree/v1/templates/tencent-flask
```

查看 app.py 代码，可以看到接口的传参和返回逻辑：

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

> 注意：本项目模板使用的 `@serverless/tencent-flask` 在部署时会自动根据项目目录下的 `requirements.txt` 文件安装依赖。

### 3. 部署

通过 `serverless` 命令进行部署，并可以添加 `--debug` 参数查看部署过程中的信息

> 如您的账号未 [登录](https://cloud.tencent.com/login) 或 [注册](https://cloud.tencent.com/register) 腾讯云，您可以直接通过 `微信` 扫描命令行中的二维码进行授权登陆和注册。

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

### 4. 测试

通过如下命令测试 API 的返回情况：

> 注：如 `Windows` 系统中未安装 `curl`，也可以直接通过浏览器打开对应链接查看返回情况

```shell
$ curl -X GET https://service-mm30nd1i-1251556596.gz.apigw.tencentcs.com/release/user

{"data":[{"name":"test1"},{"name":"test2"}]}
```

```shell
$ curl -X POST -H 'Content-Type":"application/json' -d '{"name":"yugasun","email":"yuga_sun@163.com"}' https://service-mm30nd1i-1251556596.gz.apigw.tencentcs.com/release/user

{"data":{"email":"yuga_sun@163.com","name":"yugasun"}}
```

> 注意： 请将请求 api 换成你部署成功的 url。

### 5. 移除

可以通过以下命令移除 Flask 应用

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

### 6. 账号配置（可选）

当前默认支持 CLI 扫描二维码登录，如您希望配置持久的环境变量/秘钥信息，也可以本地创建 `.env` 文件

```shell
$ touch .env # 腾讯云的配置信息
```

在 `.env` 文件中配置腾讯云的 `SecretId` 和 `SecretKey` 信息并保存

如果没有腾讯云账号，可以在此 [注册新账号](https://cloud.tencent.com/register)。

如果已有腾讯云账号，可以在 [API 密钥管理](https://shell.cloud.tencent.com/cam/capi) 中获取 `SecretId` 和`SecretKey`.

```
# .env
TENCENT_SECRET_ID=123
TENCENT_SECRET_KEY=123
```
