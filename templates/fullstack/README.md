# Serverless Fullstack Application

The goal of this project is to offer a Fullstack Serverless Application with a composable, reusable architecture, via the power of Serverless Components.

This example will included, but is not limited to:

* Front-end: (Website, Mobile)
* API: (REST API, Graph, Websockets)
* Async: (Message Queue, PubSub, Event-Driven)
* Infrastructure Resources (DynamoDB, S3, etc.)
* Pre-written logic for common use-cases.

## Structure

```yaml

name: fullstack

# Client-Website
client-website:
  component: "@serverless/website"
  inputs:
    code: ./client-website

# Functions    
createUser:
  component: "@serverless/aws-lambda"
  inputs:
    name: ${name}-create-user
    code: ./code
    handler: index.createUser
getUsers:
  component: "@serverless/aws-lambda"
  inputs:
    name: ${name}-get-users
    code: ./code
    handler: index.getUsers

# REST API
restApi:
  component: "@serverless/aws-api-gateway"
  inputs:
    name: ${name}
    description: Serverless REST API
    endpoints:
      - path: /users
        method: POST
        function: ${comp:createUser.arn}
      - path: /users
        method: GET
        function: ${comp:getUsers.arn}

```
