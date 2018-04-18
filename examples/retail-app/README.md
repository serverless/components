![serverless retail application logo](https://s3.amazonaws.com/assets.github.serverless/serverless-retail-readme-2.png)

An example retail application composed of a few serverless components. The application has a frontend that displays a catalog of products. The backend relies on a REST API that in turn fetches data from a DynamoDB table. The application is deployable to AWS.

**[Live Preview Here](https://s3.amazonaws.com/retail-cb2s100ejz.example.com/index.html)**

## Getting Started

**Note:** Make sure you have Node.js 8+ and npm installed on your machine

1. `npm install --global serverless-components`
1. Setup the environment variables
   * `export AWS_ACCESS_KEY_ID=my_access_key_id`
   * `export AWS_SECRET_ACCESS_KEY=my_secret_access_key`

## Operations

### Deploy

To deploy the application and create all dependent resources automatically, simply do:

```
$ components deploy
```
On `deploy`, the system executes each child component in parallel based on the dependencies:

```
Creating Bucket: 'retail-vwlchq8e57.example.com'
Creating Bucket: 'www.retail-vwlchq8e57.example.com'
Creating Role: func-vwlchq8e57-czpijqla-execution-role
Creating Role: func-vwlchq8e57-llfmq73p-execution-role
Creating Role: func-vwlchq8e57-8p74j047-execution-role
Created table: 'products-vwlchq8e57'
Seeding 3 items into table products-vwlchq8e57.
Creating Lambda: func-vwlchq8e57-8p74j047
Creating Lambda: func-vwlchq8e57-llfmq73p
Creating Lambda: func-vwlchq8e57-czpijqla
Item inserted to table: 'products-vwlchq8e57'
...
Setting policy for bucket: 'retail-vwlchq8e57.example.com'
Setting website configuration for Bucket: 'retail-vwlchq8e57.example.com'
Creating Role: api-vwlchq8e57-3q10ks11-iam-role-vwlchq8e57-3q10ks11
Setting redirection for Bucket: 'www.retail-vwlchq8e57.example.com'
Set policy and CORS for bucket 'retail-vwlchq8e57.example.com'
Creating API Gateway: "api-vwlchq8e57-3q10ks11"
Creating Site: 'retail-frontend'
Syncing files ...
REST API resources:
  POST - https://4ebcwp4pv2.execute-api.us-east-1.amazonaws.com/dev/products
  GET - https://4ebcwp4pv2.execute-api.us-east-1.amazonaws.com/dev/products/{id}
  GET - https://4ebcwp4pv2.execute-api.us-east-1.amazonaws.com/dev/catalog/{...categories}
Static Website resources:
  http://retail-vwlchq8e57.example.com.s3-website-us-east-1.amazonaws.com
```

The `retail-app` website can be accessed at the url: `http://retail-vwlchq8e57.example.com.s3-website-us-east-1.amazonaws.com`

![image](https://user-images.githubusercontent.com/8188/38950844-cc5c7138-4314-11e8-9134-ceb0b381fd5f.png)

### Remove

To remove the application and delete all dependent resources automatically, simply do:

```
$ components remove
```

## The Application Structure

The `retail-app` application has the following structure:

* `serverless.yml`: the configuration file for the application
* `index.js`: the code file for the application
* `code/`: code folder for the `aws-lambda` child component
* `data/products.json`: seed data for products
* `frontend/`: code folder for the `static-website` child component. 

### Configuration

The `serverless.yml` is the config file that describes the application and its dependencies. This file is **required**.

The application is composed of the following attributes:

* `type`: a unique identifier that is used to reference the application
* `components`: a set of component dependencies that makes up the application. In turn, each component has the following attributes:
    * `xxxxxx`: a unique name for the instance of the component being used
    * `type`: a unique identifier that is used to reference the component
    * `inputs`: a pre-defined set of input parameters defined by the component. These inputs allow customisation of the component behavior.

### Implementation

The `index.js` file contains any specifc code for the application, above and beyond what the child components provide. This file is **optional**.

The `retail-app` seeds the application's DynamoDB table, with some product data using the `insertItem` command exposed by its child component `aws-dynamodb`. The seed data is in the `product.json` file under the `data` folder.

### Components

The `retail-app` application is composed of the following components:

* **Web Frontend**: It creates a S3-based static website with the content provided to it. It also uses a Mustache template to display data from the backend. It creates the necessary resources like S3 buckets, policies, CloudFront and Route53 mappings. It returns a url for the website. The `static-website` component encapsulates all that functionality.
* **Lambda functions**: It creates three Lambda functions with the handler code provided to it. It creates default roles and attaches it to the individual Lambda functions. The `aws-lambda` component encapsulates all that functionality.
* **REST API**: It creates a REST API for the AWS API Gateway. It takes a structure for the routes, and maps Lambda functions provided to it. The `rest-api` component encapsulates all that functionality.
* **DynamoDB table**: It creates a DynamoDB table with input parameters like name, keys, indexes, and a model schema. The `aws-dynamodb` component encapsulates all that functionality. See [docs](../../registry/aws-dynamodb/README.md) for details.

