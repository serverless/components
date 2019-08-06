# Component Boilerplate

&nbsp;

This is a boilerplate Serverless Component meant to serve as a great starting point for creating your own Serverless Components.

Serverless Components can be used declaratively (via `serverless.yml`) as well as programmatically (via `serverless.js`).

If you want to build a Serverless Component that you would like to re-use, write it programmatically, using `serverless.js`, which is featured in this boilerplate.

If you want to compose existing Serverless Components to build an application for yourself, you could use `serverless.js`, but you can also use `serverless.yml` to do this more easily.  Look at the other templates for `serverless.yml` examples.

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;


### 1. Install

Install the [Serverless Framework](https://www.github.com/serverless/serverless):

```console
$ npm i -g serverless
```

Install the npm dependencies in this folder:

```console
$ npm i
```

### 2. Run

Run this boilerplate Component (and any Serverless Component) via the `serverless` command:

```console
$ serverless
```

This boilerplate gives you helpful tips when you run it.  Also try running it with the `--debug` flag:

```console
$ serverless --debug
```

### 3. Consume

If you want to test your new Serverless Component within a `serverless.yml`, create another folder which contains a `serverless.yml`, and simply reference your Component locally, like this:

```yml
# serverless.yml

name: component-test

myComponent:
  component: ../my-component
  inputs:
    firstInput: firstExampleValue
    secondInput: secondExampleValue

```

Run the `serverless` command to see it in action.  Don't forget to put `this.context.debug()` statements in your Component, which you can see when you run `serverless --debug` when running the YAML file:

```console
$ serverless --debug

  DEBUG - Provisioning serverless infra...

  myComponent › outputs:
  firstOutput:  'first-example-output'
  secondOutput:  'second-example-output'

  15 › dev › my-component › done

```

## New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
