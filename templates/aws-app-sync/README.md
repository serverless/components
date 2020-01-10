# Template: AWS AppSync

## Quick-Start

* Follow the guide in the main README of this repo to install the Components version of Serverless Framework and set up the two Serverless Components within this project (don't forget to add your `.env` files!)
* Add your `org` and `app` names to the `serverless.yml` files.  Don't forget to change the output reference in the `api` `serverless.yml`
* First, deploy the `function` with `sls deploy`.
* Second, deploy the `api` with `sls deploy`
* In the `function` component, run `serverless dev` to initiate the watcher for auto-deploy and also to enable real-time logging into your CLI.
