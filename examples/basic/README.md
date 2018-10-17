# Example: Basic Application

An example of a basic application using a serverless component. The application creates a AWS Lambda function and maps it to the handler code provided to it. It also declares an AwsProvider that is uses for to hold the credentials to use to deploy the function. The application is deployable to AWS.

## Components

The sample application is composed of the following components:

* **Lambda function**: It creates one Lambda function with the handler code provided to it. The `AwsLambdaFunction` component encapsulates all that functionality.
* **AWS Provider**: It holds the credentials and region that will be used to deploy the function


## Setup

Replace the `accessKeyId` and `secretAccessKey` with your AWS credentials.

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
