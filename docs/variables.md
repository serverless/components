# Variables


## When variables are resolved

Variables are resolved using a `resolve` method in code AND are resolved for a component before the main method of a command runs (`deploy`, `remove`)


**Example: variable value in deploy**

```yaml
# MyComponent/serverless.yml
name: MyComponent
type: Component

components:
  myBucket:
    type: AwsS3Bucket
    inputs:
      bucketName: "foo"
```


```yaml
name: AwsS3Bucket
type: Component

bucketName: ${inputs.bucketName}

inputTypes:
  bucketName:
    type: string
```

```js
// AwsS3Buckdet/index.js
construct(inputs) {
  inputs.bucketName // is variable object that will resolve to "foo"
  resolve(inputs.bucketName) // is "foo"
}

async define() {
  this.bucketName // is variable object that will resolve to "foo"
  resolve(inputs.bucketName) // is "foo"
}

async deploy() {
  this.bucketName // is "foo"
}
```



# Assumptions
- any input can be a variable
- only a component knows when it NEEDS the resolved value of a variable.
  - Could be anywhere along the lifecycle
- only a component knows when its own property is "ready" to be resolved in a variable
- some property values may change over time and may never be "ready" (incremental counters, hash values of code files, array of middlewares, etc)



# Needed features

## Properties assigned using inputs
Components need to be able to assign their properties using inputs. Sometimes, these inputs are variables. When this happens, a component no longer knows if the property is "ready" because they do not know where the input variable came from.


```yaml
# MyComponent/serverless.yml
name: MyComponent
type: Component

components:
  myBucket:
    type: AwsS3Bucket
    inputs:
      bucketName: ${this.components.myOtherComponent.someProp}
  myOtherComponent:
    type: myOtherComponent
    inputs: ...
```


```yaml
name: AwsS3Bucket
type: Component

bucketName: ${inputs.bucketName}

inputTypes:
  bucketName:
    type: string
```

```js
// AwsS3Buckdet/index.js
construct(inputs) {
  inputs.bucketName // is this value ready to be resolved?
}

async define() {
  this.bucketName // is this value ready to be resolved?
}

async deploy() {
  // based on the variable referencing, core ensured any components that this component's properties reference with variables have completed their deployments before calling deploy on this component. Core forcibly resolves the property variables and "hopes for the best". No guarantees though that those variables are meaningful.
  this.bucketName //
}
```


## Inputs assigned using variables that point to properties that are variables

```yaml
# MyComponent/serverless.yml
name: ImageThumbnailGenerator
type: Component

inputTypes:
  appName:
    type: string

appName: ${inputs.appName} # could be a value... could be a variable....

components:
  imageBucket:
    type: AwsS3Bucket
    inputs:
      bucketName: ${this.appName}-thumbnails
  lambdaFunction:
    type: AwsLambdaFunction
    inputs:
      functionName: ${this.appName}-thumbnail-generator
```


```yaml
name: AwsS3Bucket
type: Component

bucketName: ${inputs.bucketName}

inputTypes:
  bucketName:
    type: string
```

```js
// AwsS3Buckdet/index.js
construct(inputs) {
  inputs.bucketName // is this value ready to be resolved?
}

async define() {
  this.bucketName // is this value ready to be resolved?
}

async deploy() {
  // based on the variable referencing, core ensured any components that this component's properties reference with variables have completed their deployments before calling deploy on this component. Core forcibly resolves the property variables and "hopes for the best". No guarantees though that those variables are meaningful.
  this.bucketName //
}
```


## Assignment of props to variables in code for programmatic passing of variables

```yaml
name: AwsS3Bucket
type: Component

inputTypes:
  bucketName:
    type: string
```

```js
// AwsS3Buckdet/index.js
construct(inputs) {
  this.bucketName = inputs.bucketName // could be a variable...
}
```


Now I want to use the bucketName to pass into something that uses the bucket

ImageFaceIdentifier grabs images from the given bucket  
```yaml
# ImageFaceIdentifier/serverless.yml
name: ImageFaceIdentifier
type: Component

inputTypes:
  bucketName:
    type: string

bucketName: ${inputs.bucketName} # could be a value... could be a variable....
```


My component uses ImageFaceIdentifier on my own bucket. In this example, bucketName is already set, so no problem...
```yaml
# ImageFaceIdentifier/serverless.yml
name: MyService
type: Service

components:
  imageBucket:
    type: AwsS3Bucket
    inputs:
      bucketName: hardcoded-bucket-name
  faceIdentifier:
    type: ImageFaceIdentifier
    inputs:
      bucketName: ${this.imageBucket.bucketName}    
```


# Problems
- dealing with variables in construct and define methods is problematic, since any input can be a variable, you often forget to resolve them.
  - you cannot forcibly resolve all variables at construct/define time because often what you want is the value "later" after it's been deployed
  - sometimes you want what a variable's value is NOW because you're using it to define the infrastructure that will be created.  

# Potential solutions
- within code, make variables resolve automatically when they are used in anything other than assignment
  - requires operator overloading which is still early in ES spec.
  - doing a simpler version of that now with the utils which automatically resolve variables for you
- support some method of indicating when a variable is "ready"
- indicate to the user when they are trying to use a value that is not resolved and will NEVER be resolved by the time they need it (helps them avoid impossible resolutions)
