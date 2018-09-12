# v1 & v2 integration

The purpose of this document is to outline an approach for integration between Serverless Framework v1 and the next generation v2. It lays out a method for maintaining backward compatibility while offering a path forward for new features and concepts we wish to accomplish in the future.


## Overview

The short and sweet of the integration strategy is to simply wrap Serverless Framework v1 in a component and expose the CLI level features in a pass through when using a v1 service directly. By wrapping v1 in a component we enable users to continue to use all of the features of v1 as well as allow v1 services to be directly used in the v2 context. Further, we should provide a v2 implementation of services to give users a migration path off of the v1 architecture.

*Example: v1 and v2 services in a component tree*
```
                  ┌───────────────┐
                  │               │
                  │   component   │
                  │               │
                  └───────────────┘
                          │
                ┌─────────┴──────────┐
                ▼                    ▼
        ┌──────────────┐     ┌───────────────┐
        │              │     │               │
        │  service v2  │     │   component   │
        │              │     │               │
        └──────────────┘     └───────────────┘
                │                    │
        ┌───────┴─────────┐          └───────┐
        ▼                 ▼                  ▼
┌───────────────┐ ┌───────────────┐  ┌──────────────┐
│               │ │               │  │              │
│   component   │ │   component   │  │  service v1  │
│               │ │               │  │              │
└───────────────┘ └───────────────┘  └──────────────┘
```

We will not aim to make all the features of v1 available within the v2 context.

For example: plugins used in a v1 service will only affect that service. They will not affect any other components in the component tree. Plugins will also not be available for use by v2 services.

```yaml
type: service    # v2 service
name: my-service
plugins:      # this does NOT work
```

Similarly, as a strategy toward encouraging people to move off of v1, we will not make all functionality of v2 available within the v1 context. For instance, we should not allow users to use components within a v1 service.

```yaml
service: my-v1-service
components: # this does NOT work
```

Instead, we should encourage users to either use their service as a component in a greater component application or to migrate to a v2 service. The purpose of this is to encourage users to generate new files instead of adding to the old v1 files (which encourages keeping the old stuff around).

*using components in a v2 service*
```yaml
type: service    # v2 service
name: my-service
components:      # this WORKS
```

*using a v1 service as a component*
```yaml
type: component
name: my-component
components:
  myService:
    type: ./my-v1-service
```

However, we should offer enough features of v2 within the v1 context in order to ease the transition to v2. For instance, we should allow inputTypes and outputTypes to be declared within a v1 service so that we can easily integrate them into component applications.

*A v1 service that declares inputTypes and outputTypes*
```yaml
service: my-v1-service

inputTypes:
  timeout:
    type: number

outputTypes:
  arn:
    type: string
    description: The Lambda functions arn
    value: ${functions.myFunction.arn}

functions:
  myFunction:
    handler: index.handler  
    timeout: ${inputs.timeout}  
```

*A component that uses the above v1 service*
```yaml
type: component
name: my-component
components:
  myService:
    type: ./my-v1-service
    inputs:
      timeout: 10  
```


## Challenges

The challenge of wrapping v1 in a component consists of...
- maintaining the v1 experience with no required changes by the user when using v2 directly on a v1 service.
- using a v1 service as a component in a component tree
- extending a v1 service with minimal v2 features (enough to ease the transition to v2).
- providing a v2 implementation of a service

### Maintaining the v1 experience

Everything from CLI commands to plugins should continue to work as expected when using a v1 service directly. By "using a v1 service directly" it is meant that the user has cd'd into the directory where a v1 service exists and is running `sls` commands within that folder.

In other words, we would like users to be able to use v2 of the
framework and have it offer all of the v1 functionality when used on a v1
service. To accomplish this, we will need to provide the following
functionality.

1. Allow for a v1 service to behave as a v1 service and continue to make use of
all existing functionality like plugins within that context.
2. When using a v1 service directly, we should make available all existing
commands in the v1 framework.  
3. The user should be able to use the v2 version of the framework and not have
to switch versions

### Using v1 as a component in a component tree

To allow users to make use of their old v1 services and to not require them to
migrate to v2 immediately, we should enable the use of v1 services as components
in the component tree.

To do this we will need to...
1. Make v1 services useable as components
2. Support both v1 and v2 style variables throughout all of the system

### Extending a v1 service with v2 features

In order to ease the integration of v1 services and begin to migrate users from
v1 to v2, we should expose some of the v2 features within a v1 context. Thus,
encouraging them to make use of v2 features and contribute to the v2 ecosystem.

To accomplish this, we should implement the following
1. Add support for inputTypes to v1 services
2. Add support for outputTypes to v1 services

### Providing a v2 implementation of a service

Finally, in order to allow users to complete the migration path off of v1 (and
off of CloudFormation) we should provide a v2 implementation of a service.
This implementation should be familiar and maintain many of the existing
concepts while ridding itself of the older baggage like CloudFormation and
plugins.

1. Provide a v2 service implementation


# Implementation

This section outlines some basic implementation ideas on how the above
challenges can be solved.

## Outline of tasks

1. Implement a type system
  A basic type system will enable us to implement the v2 service concept as well as implement a v1 service that can use v2 features.

2. Implement v2 service type which extends component
  This is the final implementation of the v2 service that we would like to migrate users to.

3. Add programmatic support to framework
  We need basic programmatic support in the framework in order to implement the CLI pass through as well as fully resolve variables during deployment

4. Move variables to util library
  By moving the variables system out of framework and into a shared utility library we can support all of the v1 variable types as well as the v2 variable types in both v1 services as well as components

5. Implement v1 service type
  Add a basic v1 service type that extends component and uses the programmatic support of the framework to deploy a v1 service programmatically.

6. Implement the v2 command pass through to v1   
  When a command is executed within the context of a v1 service folder, the pass through will pass all commands programmatically to v1 of the framework.

7. Add support for inputTypes and outputTypes to the v1 service





## Implement a type system

Much of the above can be solved by introducing a basic type system.

By introducing a base type system we enable any type of declaration with any
number of custom properties. We can think of the core of this system as a class
system from object oriented programming. By allowing the use of any property
we can implement a type that

#### Reworking the type property

Type names should be declared using the `name` property instead of the `type`
property (consistent with the RAML specification).

A type is simply declared using the `name` property.

```yaml
name: my-type
```

We should further introduce the concept of type extension to allow for types
to inherit the properties and functionality of other types.

To extend another type, we simply use the `type` property
```yaml
type: component
name: my-component
```


#### Add a constructor

Similar to classes, types can have constructors. A constructor gives us a way
of manipulating the context object during creation of an instance. Types by
themselves are not instances, they are more like classes. When an instance is
created, if the constructor exists, it is called to generate the context object.

```js
// props propery are
const constructor = (props) => {

}
```

#### Type properties

All properties in the yaml file are merged
```
```


#### Add type interpretation phase

The type interpretation phase enable us to do some hacky interpretations. This
is how we identify a v1 serverless.yml file.

```yaml
service: my-service
```
is interpreted as

```yaml
type: service@1.x
name: my-service
```



## Add programmatic support to framework

#### Offer programmatic method for running commands

The framework allows for command line parameters to be passed programmatically
to the CLI class. We can use this to assemble a simple run method that feeds
these parameters programmatically. We simply need to move the code contained
within the `serverless` bin file into

```js
const run = (params) => {

}
```


## Wrap v1 in type that extends component

This is how we get support for inputTypes and outputTypes

### Add support for outputType `value` property
This property allows for output types to specify a value that they resolve to
without needing to provide a JS implementation.



## Add CLI pass through for v1 commands
-

  - enable cwd component to provide commands at the top level
- move variables out into SDK library
- resolve variables in components layer
- pass fully resolved serverless.yml in memory to v1
]

- add deftype for defining types

- add support for outputs in the v1 component
  - gather referenced variables
- how to support outputting any value from the


-



## Nice to haves

#### Add support for main property

This is a simple nice to have feature. It simply allows us to point to the main
js file that contains the types code.
```yaml
name: my-type
main: ./my-index.js
```

#### Add dependencies property support

The `dependencies` property enables the definition of specific type names
within the context of the current `serverless.yml` file. This makes it easier
to define versions or types that are located at urls or file paths.

```yaml
# my-type/serverless.yml
name: my-type
```

```yaml
name: my-parent-type

dependencies:
  my-type: './my-type'

components:
  myType:
    type: my-type # able to use name here instead of path since it's defined in dependencies
```

## Migration

### Our efforts
Over time we should slowly replace the v1 pass through with our own implementation
of the v1 commands and eventually completely replace them with new and better versions.


### Users efforts
- Move from v1 to v2 services
  - Requires removing their use of plugins
  - Minimal updates to serverless.yml
    - add `type` and `name` properties


# Plan of Attack

## v2 Alpha

- include work items that should land in the alpha

## v2 Beta

## v2 GA
- Complete integration between v1/v2
