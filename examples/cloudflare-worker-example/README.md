# Example: Cloudflare Worker Component

This component allows you to deploy your Serverless Javascript code to a Cloudflare Edge Worker

## Components

TODO -- Below this is unchanged from the basic Example readme. @pinkerton, your documentation skills are needed. Change what you need to

The sample application is composed of the following components:

- **Lambda function**: It creates one Lambda function with the handler code provided to it. The `aws-lambda` component encapsulates all that functionality.
- **Role**: It creates a new role with a `AssumeRole` policy for the Lambda service. An existing `policy` can also be provided, in which case the `role` just uses that `policy`. The `aws-iam-role` component encapsulates all that functionality.

## Operations

### Deploy

To deploy the application and create all dependent resources automatically, simply do:

```
$ components deploy
```

### Remove

To remove the application and delete all dependent resources automatically, simply do:

```
$ components remove
```
