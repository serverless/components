# Template - Website

&nbsp;

**[A video guide on this can be found here](https://www.youtube.com/watch?v=ts26BVuX3j0)**

This is a template for deploying a [React](https://reactjs.org) application onto a serverless website via the [Website Component](https://www.github.com/serverless-components/website).

The Website Component sets up everything you need within seconds.  It uses AWS S3 for hosting, AWS Cloudfront for a blazing fast CDN, AWS Route 53 to configure your custom domain and an AWS ACM Certificate to secure your with with SSL.

Overall, this infrastructure stack is perhaps the cheapest possible way to deploy a front-end application, that is massively scalable, and performant.

[Learn more about this Component in its repository.](https://www.github.com/serverless-components/website)

&nbsp;

1. [Install](#1-install)
2. [Deploy](#2-deploy)
3. [Notes](#3-notes)

&nbsp;


### 1. Install

Install the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

Add the access keys of an AWS IAM Role with `AdministratorAccess` in a `.env` file, using this format:

```bash
AWS_ACCESS_KEY_ID=1234
AWS_SECRET_ACCESS_KEY=1234
```

Or, you can set these as environment variables manually before deploying.

Install the NPM dependencies:

```console
$ npm i
```

Run the website locally with Parcel, using:

```console
$ npm run start
```

Please note that while the Website Component sets up almost everything for you with a single command, if you want to set up a custom domain, you MUST purchase it in your AWS account manually via Route 53.  We have not yet automated domain registration.  After registering it, you may have to wait a few minutes for registration to complete before you can use it.

### 2. Deploy

Deploy via the `serverless` command:

```console
$ serverless
```

Use the `--debug` flag if you'd like to learn what's happening behind the scenes:

```console
$ serverless --debug
```

### 3. Notes

If you aren't using a custom domain, AWS Cloudfront and `HTTPS://` will not be set up.  Instead, you will receive an `HTTP://` domain from AWS S3.

When you add a custom domain, AWS Cloudfront and `HTTPS://` will be set up automatically with it.

Remember, once you deploy with a custom domain for the first time, it may take up to an hour for DNS servers to propagate that change.

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
