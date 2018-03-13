# Static Website Component

A serverless component that creates a static website using S3, configures CloudFront (CDN) and maps a custom domain via Route53 (DNS).

## Composition & Dependencies

The Static Website component is composed of some smaller, reusable components, that help build up the functionality.

![image](https://user-images.githubusercontent.com/8188/37266903-ac3dd69c-2593-11e8-8f19-23133b68c971.png)
Figure 1: Shows inter-dependencies between sub-components

**Note**: All sub-components will run in parallel unless they are dependent on one or more components. The system automatically determines the dependency graph based on  inputs for components that are outputs of other components.

## State Management

All components manage their own state and stores it in the `state.json` file.

## Input Parameters

The component requires a few input parameters to build the static website:

* `name`: [logical name of the site]
* `contentPath`: [relative path of a folder for the contents of the site like './site']
* `contentIndex`: [the index page for the site like 'index.html']
* `contentError`: [the error page for the site like 'error.html']
* `hostingRegion`: [the AWS region where the site will be hosted like 'us-east-1']
* `hostingDomain`: [the domain name for the site like 'rgfamily.com']
* `aliasDomain`: [the alias domain for the site like 'www.rgfamily.com']

## Operations

The component exposes operations via two commands - `deploy` and `remove`.

### Deploy

```bash
$ components deploy

Creating Bucket: 'rgfamily.com'
Creating site: 'rgfamilysite'
Created site with url: 'http://rgfamily.com.s3-website-us-east-1.amazonaws.com'
Creating Bucket: 'www.rgfamily.com'
Setting policy for bucket: 'rgfamily.com'
Syncing files from './site' to bucket: 'rgfamily.com'
Setting Bucket: 'rgfamily.com' with website configuration.
Creating CloudFront distribution: 'rgfamilysite'
Setting Bucket: 'www.rgfamily.com' for redirection.
Uploading file: 'site/stylesheets/main.css' ...
Uploading file: 'site/error.html' ...
Uploading file: 'site/index.html' ...
Uploading file: 'site/images/serverless_products.png' ...
Set policy and CORS for bucket 'rgfamily.com'.
Uploading file: 'site/images/serverless-bloody.gif' ...
Objects Found: 0 , Files Found: 5 , Files Deleted: 0
CloudFront distribution 'rgfamilysite' creation initiated.
Creating Route53 to CloudFront mapping: 'www.rgfamily.com => d2t3f8tv29lrbg.cloudfront.net'
Route53 Hosted Zone 'rgfamilysite-1520928601' creation initiated.
Route53 Record Set 'www.rgfamily.com => d2t3f8tv29lrbg.cloudfront.net' creation initiated.
```

### Remove

```bash
$ components remove

Removing Bucket: 'rgfamily.com'
Removing site: 'rgfamilysite'
Removing Bucket: 'www.rgfamily.com'
Removing Route53 to CloudFront mapping: 'www.rgfamily.com' with id: '/hostedzone/Z3GXWD8T8H34PA'
Route53 Record Set 'www.rgfamily.com => d111111abcdef8.cloudfront.net' deletion initiated.
Route53 Hosted Zone '/hostedzone/Z3GXWD8T8H34PA' deletion initiated.
Removing files from Bucket: './site'
Removing CloudFront distribution: 'rgfamilysite' with id: 'E2QSDRLSMYH8WL'
Error in deleting CloudFront distribution 'E2QSDRLSMYH8WL'. The distribution you are trying to delete has not been disabled.
```
**Note**: The component first disables the CloudFront distribution which takes sometime, and hence the subsequent operation of deleting a distribution fails.

But, calling `remove` after a little while successfully deletes the CloudFront configuration.

```bash
$ components remove

Removing CloudFront distribution: 'rgfamilysite' with id: 'E2QSDRLSMYH8WL'
CloudFront distribution 'E2QSDRLSMYH8WL' deletion initiated.
```
