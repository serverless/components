![serverless retail application logo](https://s3.amazonaws.com/assets.github.serverless/serverless-retail-readme-2.png)

An example retail application composed of a few serverless components. The  application has a frontend that displays a catalog of products. The backend relies on a REST API that in turn fetches data from a DynamoDB table. The application is deployable to AWS.

## Components

The sample application is composed of the following components:

* **Web Frontend**: It creates a S3-based static website with the content provided to it. It also uses a Mustache template to display data from the backend. It creates the necessary resources like S3 buckets, policies, CloudFront and Route53 mappings. It returns a url for the website. The `static-website` component encapsulates all that functionality.
* **Lambda functions**: It creates three Lambda functions with the handler code provided to it. It creates default roles and attaches it to the individual Lambda functions. The `aws-lambda` component encapsulates all that functionality.
* **REST API**: It creates a REST API for the AWS API Gateway. It takes a structure for the routes, and maps Lambda functions provided to it. The `rest-api` component encapsulates all that functionality.
* **DynamoDB table**: It creates a DynamoDB table with input parameters like name, keys, indexes, and a model schema. The `aws-dynamodb` component encapsulates all that functionality. See [docs](../../registry/aws-dynamodb/README.md) for details.

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

### Rollback

If the `deploy` or `remove` commands fail for some reason, the system will automatically `rollback` to the previous _good state_ of the application.
