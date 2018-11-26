# Type system

The type system can be thought of as equivalent to a class system in object oriented programming. The type system provides a language agnostic method of declaring "classes" utilizing a data interchange language like yaml or json and then adding methods to that class utilizing the native language API.


## Table of contents

1. [Concepts](#concepts)
    1. [Type Concept](#type-concept)
    2. [Interface Concept](#interface-concept)
2. [Basic type operations](#basic-type-operations)
    1. [Declaring a type](#declaring-a-type)
    2. [Loading a type](#loading-a-type)
    3. [Declaring the type's main file](#declaring-the-types-main-file)
    4. [Instantiating types](#instantiating-types)
    5. [Extending a type](#extending-api)
3. [Types](#types)
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

A type's properties are the properties of the yaml file. In this example, the type has three properties name, foo and bar.

*Example serverless.yml declaring a simple type with props*
```yaml
name: MyType

foo: "foo prop value"  
bar: 123
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

To load a type, use the `context.import` method . Types are loadable by...

- Name/version from registry
```js
const MyType = await context.import('MyType@1.0.0')
```
- File path
```js
const MyType = await context.import('./MyType')
```
- Url
```js
const MyType = await context.import('https://examples.com/some/path/my-type.zip')
```
- Github org/repo#branch
```js
const MyType = await context.import('github:serverless/my-type#branch')
```

When a type is loaded, an object is created that holds the meta data for the type and a JS class is created and available on the type object. The methods declared in the main are applied to the class's prototype.

The type object contains the following properties.

`constructor` - This is the constructor that is used to create isntances of this type.
`class` - This is the class that holds the methods for this type.
`main` - This is a reference to what was loaded from the type's main js file
`props` - This is a reference to the data that was loaded from the type's serverless.yml file
`parent` - If this type extends another, this is a reference to the type that is extended.
`root` - This is a path to the root folder where the serverless.yml file lives for this type.

*Example of declaring a type, loading it and outputting the type object*

*Example serverless.yml with main entry*
```yaml
name: MyType
main: ./myType.js

foo: 'bar'
```

*Example main file ./myType.js*
```js
const MyType = {
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

export default MyType
```

*Example: code that loads a type and constructs an instance of that type*
```js
const myFunction = async (instance, context) => {
  const MyType = await context.import('MyType')
  console.log(MyType)
  // => {
  //  constructor: Function,
  //  class: class,
  //  main: Object<Function>,
  //  props: Object<*>,
  //  parent: ObjectType,
  //  root: '/absolute/path/to/type/folder'
  //}

  const myInstance = await context.construct(MyType, {})
  console.log(myInstance)
  //=> {
  //  name: 'MyType',
  //  main: './myType.js',
  //  foo: 'bar',
  //  bim: Function,
  //  bop: Function
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

### Declaring the type's main file

The main file declares the methods for a type. There are three different ways of declaring the methods.


#### Defining a type's main using an object

You can declare an object that has the types methods.

```yaml
# ./serverless.yml
name: MyType
main: ./index.js
```

```js
// ./index.js
const MyType = {
  foo(arg1, arg2) {
    ...
  }
}

export default MyType
```

```js
const MyType = await context.import('./MyType')
const instance = await context.construct(MyType, inputs)

console.log(instance)
// {
//   name: MyType,
//   main: './index.js',
//   extends: 'Object',
//   foo: Function,
//   
//   // inherited from Object
//   construct: Function,
//   getType: Function
// }
```


#### Defining a type's main using a function that returns an object

You can use a function that returns an object similar to the above object approach. This is useful if you want to use context to load types or encapsulate other values in closure. The method also exposes the SuperClass if you want to use it to make prototype super calls.


```yaml
#serverless.yml
name: MyParentType
# extends: Object
main: ./index.js
```

```js
const MyParentType = {
  foo(arg1, arg2, context) {
    ...
  }
}
```

```yaml
#serverless.yml
name: MyChildType
extends: MyParentType
main: ./index.js
```

```js
// index.js
const MyChildType = (SuperClass, context) => {
  const AWSLambdaFunction = await context.import('AWSLambdaFunction')
  ...

  return {
    construct(inputs, context) {
      // Must call super class's construct method!
      SuperClass.prototype.construct.call(this, inputs, context)
      ...
    },
    foo(arg1, arg2, context) {
      // prototype super call
      SuperClass.prototype.foo.call(this, arg1, arg2, context)
      const instance = await context.construct(AWSLambdaFunction, {})
    },
    bar(arg2, arg3, context) {
      const instance = await context.construct(AWSLambdaFunction, {})
    }
  }
}

export default MyChildType
```



#### Defining a type's methods using a class

You can also return a class from the function instead of an object. This makes super calls a bit cleaner.

```yaml
#serverless.yml
name: MyChildType
extends: MyParentType
main: ./index.js
```

```js
// index.js
const MyChildType = (SuperClass, context) => {
  const AWSLambdaFunction = await context.import('AWSLambdaFunction')

  return class extends SuperClass {
    construct(inputs, context) {
      super.construct(inputs, context)
      ...
    },
    foo(arg1, arg2, context) {
      // super call
      super.foo(arg1, arg2, context)
      const instance = await context.construct(AWSLambdaFunction, {})
    }

    bar(arg2, arg3, context) {
      const instance = await context.construct(AWSLambdaFunction, {})
    }
  }
}

export default MyChildType
```

### Instantiating types

To convert a type to a component instance, simply use the `context.construct` method and supply the method with the type and inputs.

NOTE: Construction is an async process since we have to load type during the construction.

```js
const MyType = await context.import('./MyType')
const instance = await context.construct(MyType, inputs)
```

Variables are replace with dynamic getters that resolve the variable when the value is accessed. They resolve the value every time the property is accessed so you can get different values at different times depending upon when the value was accessed.


### Extending a type

Types can be extended which allows for types to inherit the functionality of other types.

To extend another type, we simply use the `extends` property.

```yaml
name: MyComponent
extends: Component
```
The default extended type if none is provided is `Object`


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



## Context

TODO BRN: Outline the Context API




## Types

### Object type

TODO: Add a description of the Object type and example uses of it

### Component type

TODO: Add a description of the Component type and example uses of it

### Service type

TODO: Add a description of the Service type and example uses of it

### Function type

TODO: Add a description of the Function type and example uses of it

### Provider type

TODO: Add a description of the Provider type and example uses of it


### App type

TODO: Add a description of the App type and example uses of it


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
