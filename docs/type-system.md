# Type system

The type system can be thought of as equivalent to a class system in object oriented programming. The type system provides a language agnostic method of declaring "classes" utilizing a data interchange language like yaml or json and then adding methods to that class utilizing the native language API.


## Table of contents

1. [Concepts](#concepts)
    1. [Type Concept](#type-concept)
    2. [Interface Concept](#interface-concept)
2. [Basic type operations](#basic-type-operations)
    1. Declaring a type (severless.yml/programmatically) and the code (index.js, etc)  
    2. Loading a type
    3. [Instantiating types](#instantiating-types)
    4. Extending a type
3. [Types]()
    1. [Object type](#object-type)
    2. Component type
    3. Service type
    4. Function type
    5. Subscription type
    6. Compute type
    7. Provider type
    8. [App type](#app-type)
4. Interfaces
    1. IFunction interface
    2. ICompute interface
5. Example project


## Concepts

The type system is built on two basic concepts, types and interfaces.

### Type Concept
Types are used to declare what can be thought of as classes in object oriented programming.

Types are built on a collection of name/value pairs. Each name represents the name of a property for that type and the values represent default values that will be resolved during instantiation of that type.

In javascript, a type is realized as a class. The type's properties are applied during instantiation by the constructor and the type's methods are added as methods on the class's prototype chain.

Types can be extended using a single inheritance model. All super type methods are available using the es6 `super` method.

### Interface Concept

Interfaces provide a mechanism for performing declaring a collection of named of methods that provide an "abstraction" for a given set of functionality.

Interfaces in this case are runtime concepts that can be used to perform checks on types during runtime assembly to ensure that they implement the required method to adhere to the type. Further, a set of utility methods allow runtime checks to determine in code whether a given instance reference has implemented a specific type. This can be used to branch the logic based upon whether an interface has been implemented or not.


## Basic type operations

Many basic operations are available in the type system. These operations are used to manage the two basic concepts of the type system (types and interfaces).

You can declare new types, extend existing types, declare new interfaces and extend existing interfaces.


### Declaring a type

Type can be declared using a `serverless.yml` config file. They can also be declared programmatically.

A type is simply declared using the name property.

*Example serverless.yml declaring a simple type*
```yaml
name: MyType
```

To declare the methods for a type, we setup a main file. The main entry is optional and will default to index.js if none is provided. Having a main file is also not required.

*Example serverless.yml with main entry*
```yaml
name: MyType
main: ./myType.js
```

*Example main file ./myType.js*
```js
// both foo and bar will be available in instances of MyType
module.exports = {
  foo() {

  },
  bar() {

  }
}
```

### Loading a type

Types by themselves are not instances, they are more like a reference to a class that has not been instantiated.

To load a type, use the `context.loadType` method . Types are loadable by...

- Name/version from registry
```js
const MyType = await context.loadType('MyType@1.0.0')
```
- File path
```js
const MyType = await context.loadType('./MyType')
```
- Url
```js
const MyType = await context.loadType('https://examples.com/some/path/my-type.zip')
```
- Github org/repo#branch
```js
const MyType = await context.loadType('github:serverless/my-type#branch')
```

When a type is loaded, an object is created that holds the meta data for the type and a JS class is created and available on the type object. The methods declared in the main are applied to the class's prototype.

The type object contains the following properties.



*Example of declaring a type, loading it and outputting the type object*

*Example serverless.yml with main entry*
```yaml
name: MyType
main: ./myType.js

foo: 'bar'
```

*Example main file ./myType.js*
```js
module.exports = {
  bim(...args) {  
    console.log(this)
    //=> {
    //  name: MyType,
    //  main: './myType.js',
    //  foo: 'bar',
    //  bim: function,
    //  bop: function
    //}
  },
  bop(...args) {

  }
}
```

```js
const myFunction = async (instance, context) => {
  const MyType = await loadType('MyType')
  console.log(MyType)
  // => {
  //  constructor: Function,
  //  class: class,
  //  main: Object<Function>,
  //  props: Object<*>
  //}

  const myInstance = await context.construct(MyType, {})
  console.log(myInstance)
  //=> {
  //  name: MyType,
  //  main: './myType.js',
  //  foo: 'bar',
  //  bim: function,
  //  bop: function
  //}
}
```


*Example class assembled for MyType*
```js
class MyType {

  constructor() {
    this = {
      ...this,
      ...resolve(serverless.yml)
    }
    this.construct(this)
  }

  construct(instance) {
    //  assign props to instance here
  }
  ...myType.js
}
```


### Instantiating types

To convert a type to a component instance, simply use the `context.construct` method and supply the method with the type and inputs.

```js
const MyType = await context.loadType('./MyType')
const instance = context.construct(MyType, inputs)
```

Input variables are resolved a the


### Extending a type

Types can be extended which allows for types to inherit the functionality of other types.

To extend another type, we simply use the type property.

```yaml
name: MyComponent
extends: Component
```
The default type if none is provided is `Object`



## Context

index.js file
```js
module.exports = {
  deploy(instance) {
    context.inputs
  }
}
```


### Defining an Interface

Defining interfaces gives us a mechanism for ensuring types implement specific functions

```yaml
interface: ICompute

packFunction: function
deployFunction: function
```

### Implementing an interface

```yaml
name: AwsLambdaCompute
implements:
  - ICompute
```











## Types

### Object type

*example serverless.yml*
```yaml
name: Object
version: 1.0.0
main: ./index.js
```

*example index.js*
```js
const type = {
  constructor(instance, inputs) {
    // build inputTypes
    // build outputTypes
    // apply to instance
    return instance
  }
}

module.exports = type
```


### Component type
*serverless.yml*
```yaml
type: Object
name: Component
version: 1.0.0

components: ${input.components}

inputTypes:
  components:
    type: Object<string, Component>
    default: {}
```

index.js file

```js
const constructor = (instance, inputs) => {
  return super(instance, inputs)
}

const buildGraph = () => {


}
```


### Service type

*Implementation of base Service in serverless.yml*
```yaml
type: Component
name: Service
version: 1.0.0

inputTypes:
  app:
    type: string
  tenant:
    type: string
  providers:
    type: Object<string, Provider>
    default: ${context.providers}

app: ${input.app} || ${context.app}
tenant: ${input.tenant} || ${context.tenant}

providers: ${input.providers}

functions:

```

```js
const Service = {
  constructor(instance, inputs) {
    ...
  }

  deploy(instance, context) {
    instance.functions
  }
}
```



*example serverless.yml extending Service*
```yaml
type: Service
name: myService

app:

providers:
  aws: ${inputs.provider}
```


### Function type

serverless.yml
```yaml
type: Object
name: Function
version: 1.0.0

memory: ${input.memory || 1028}
timeout: ${input.timeout || 10}
runtime:
code: string (path to folder for code)
handler: string (property path for function)
provider: string (name of provider to use for this) | Provider (a provider type that knows the function)
compute: Compute?
environment: Object<string, string>
tags: Object<string, string> (explore the feasibility of this)

inputTypes:
  providers:
    type: Object<string, Provider>
    default: ${context.providers}
  memory: integer
  timeout: integer
  runtime: string (common format across providers that is converted by provider code)
  code: string (path to folder for code)
  handler: string (property path for function)
  provider: string (name of provider to use for this) | Provider (a provider type that knows the function)
  compute: Compute?
  environment: Object<string, string>
  tags: Object<string, string> (explore the feasibility of this)
```

### Example Instantiation
```js
new Function({
  memory: 1028,
  timeout: 10,
  ...
})
```  

### Example serveless.yml
```yaml
type: Function
name: My1028Function

memory: 1028

code: ./myFunction
handler: handler
```

myFunction/index.js
```js
const handler = (event) => {
  ...
}
module.exports = { handler }
```             

### Provider type


Provider serverless.yml


### loadType method
```js
const loadType = (typeQuery) => {
  // typeQuery can be a string name@version
  // typeQuery can be a file path ./
  // typeQuery can be a url
}
```


### App type

*Implementation of base App in serverless.yml*
```yaml
type: component
name: App
version: 1.0.0

tenant: ${input.tenant}

inputTypes:
  tenant:
    type: string
    default: ${context.tenant}
```

```js
module.exports = {
  deploy(instance, context) {
    context.set('tenant', instance.tenant)
  }
}
```



*example extension of App in serverless.yml*
```yaml
type: App
name: myApp

tenant: myTenant

services:
  myServiceId:
    type: ./myService (myService)

components: // do we want app to extend component?
```



## Notes

1. Top level properties in the yaml/json file are equivalent to class properties
2. Inputs are equivalent to constructor arguments
3. Context is similar to variable scopes in javascript
```js
// Example:
// foo does not exist
// bar does not exist
function myFunction() {
  var foo = 'abc'
  var baz = 'ghi'
  // foo is 'abc'
  // bar does not exist
  // baz is 'ghi'
  function mySubFunction() {
    var foo = 123
    // context.set('foo', {
    //   ...context.get('foo'),
    //   prop2: 123
    // })
    var bar = 'def'
    // foo is 123
    // bar is 'def'
    // baz is 'ghi'
  }
  // foo is 'abc'
  // bar does not exist
}
```
4.



```js
const MyType = defType({
  name: 'MyType',
  version: '1.0.0',
  foo() {

  }
})
```



```yaml
name: MyType

inputTypes:
  foo:
    type: string
```

```js
module.exports = {
  constructor(instance, inputs) {
    instance.foo = inputs.foo
    return instance
  }

  deploy(instance, context) {
    context.inputs
  }
}
```


```js
class MyType {
  constructor(foo, bar, etc) {
    this.foo = foo
  }

  deploy() {
    this.foo
  }
}
```



*Example: Using context to pass values to grand children*
```yaml
name: Parent
type: component

components:
  child:
    type: ./Child

inputTypes:
  provider:
    type: Provider (aws)
```

```js
module.exports = {
  constructor(instance, inputs) {
    instance.foo = inputs.foo
    return instance
  }

  deploy(instance, context) {
    context.set('provider', instance.provider)
  }
}
```


```yaml
name: Child
type: component

component:
  grandChild:
    type: ./GrandChild
```


```yaml
name: GrandChild
type: component

inputTypes:
  provider:
    type: Provider
    required: false

component:
  function:
    type: lambda
    inputs:
      provider: ${input.provider} || ${context.provider}
```
