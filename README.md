[![Serverless Components](https://s3.amazonaws.com/assets.github.serverless/components/serverless-components-readme.gif)](http://serverless.com)

&nbsp;

**Serverless Components** is framework for easily provisioning and sharing application components on ~~cloud~~ serverless services.

It does not seek to be another general infrastructure provisioning tool (e.g. Cloudformation, Terraform), but a solution that enables developers to build their own reusable abstractions on top of infrastructure, that resemble the use-case they are seeking to build (e.g. a Blog, Payment Processor, Realtime Application). These components are just packages published to npm.

You could use components either programmatically via a `serverless.js` file (which would also create a component in the process), or via a `serverless.yml` file. These Components are use-case focused, and you can deploy them alongside infrastructure, in the same file.

```yaml
# serverless.yml

name: my-blog

# higher-level abstraction
Comments:
  component: @serverless/comments
  inputs:
    region: us-east-1

# infrastructure
listPosts:
  component: @serverless/aws-lambda
  inputs:
    memorySize: 1024
```

## Get Started

Install components.

```console
$ npm i -g @serverless/components
```

Create a directory for your new component.

```console
$ mkdir my-component
$ cd my-component
```

Run `components` and choose what you'd like to create. Choose `My Own Component` for a quick tour that helps you create your own component, which could programmatically use existing components from npm.

```console
$ components
```

Now every time you run `components`, you'll be running your new component. Check out the generated files for more information.

## Using existing components

Instead of creating your own component, you could also choose to generate a `serverless.yml` template for an existing component (e.g. `Chat Application`), which would copy one of the available [templates](./templates) into the current working directory.

**Note:** If you don't have your aws access keys set globally, dont' forget to add them to a `.env` file in the current directory.

Run `$ components` to run your template.

```console
$ chat-app: components

  chat-app › outputs:
  url:  'http://chatapp-5m53dym.s3-website-us-east-1.amazonaws.com'

  60s › dev › my-chat-app › done
```

Here are the available components you could instantly deploy, or programmatically use as child components. Check out each component repo for complete docs on how to use them.

&nbsp;

- [AwsDynamoDb](https://github.com/serverless-components/AwsDynamoDb)
- [AwsApiGateway](https://github.com/serverless-components/AwsApiGateway)
- [AwsIamRole](https://github.com/serverless-components/AwsIamRole)
- [AwsLambda](https://github.com/serverless-components/AwsLambda)
- [AwsLambdaLayer](https://github.com/serverless-components/AwsLambdaLayer)
- [AwsS3](https://github.com/serverless-components/AwsS3)
- [AwsWebSockets](https://github.com/serverless-components/AwsWebSockets)
- [ChatApp](https://github.com/serverless-components/ChatApp)
- [RealtimeApp](https://github.com/serverless-components/RealtimeApp)
- [Socket](https://github.com/serverless-components/Socket)
- [Website](https://github.com/serverless-components/Website)

&nbsp;

They also serve as complete examples on how to write a real-world serverless component.

Good luck.

**Created By**

- Eslam Hefnawy - [@eahefnawy](https://github.com/eahefnawy)
- Philipp Muens - [@pmuens](https://github.com/pmuens)
- Austen Collins - [@aac360](https://github.com/ac360)
