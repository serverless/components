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

name: fullstack-app

# Frontend
frontend:
  component: "@serverless/website"
  inputs:
    code: ./frontend

# Functions
createUser:
  component: "@serverless/function"
  inputs:
    name: ${name}-create-user
    code: ./backend
    handler: index.createUser
getUsers:
  component: "@serverless/function"
  inputs:
    name: ${name}-get-users
    code: ./backend
    handler: index.getUsers

# REST API
restApi:
  component: "@serverless/api"
  inputs:
    name: ${name}-api
    description: Serverless REST API
    endpoints:
      - path: /users
        method: POST
        function: ${comp:createUser.arn}
      - path: /users
        method: GET
        function: ${comp:getUsers.arn}

```
