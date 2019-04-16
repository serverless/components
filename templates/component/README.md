# myComponent

&nbsp;

myComponent makes magic using [Serverless Components](https://github.com/serverless/components).

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;


### 1. Install

```console
$ npm install -g @serverless/components
```

### 2. Create

```console
$ touch serverless.yml .env .env.prod
```

The directory should look something like this:


```
|- serverless.yml
|- .env         # your development AWS api keys
|- .env.prod    # your production AWS api keys
```

the `.env` files are not required if you have the aws keys set globally and you want to use a single stage, but they should look like this.

```
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### 3. Configure

```yml
# serverless.yml

name: my-component
stage: dev

myComponent:
  component: "@serverless/my-component"
  inputs:
    firstInput: firstExampleValue
    secondInput: secondExampleValue

```

### 4. Deploy

```console
myComponent (master)$ components

  myComponent › outputs:
  firstOutput:  'first-example-output'
  secondOutput:  'second-example-output'

  15 › dev › my-component › done

myComponent (master)$
```

&nbsp;

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
