# Inline scripting (aka. Serverless variables)

Within serverless.yml you can embed simple scripts.

These scripts enable you to access properties of a component instance, refer to the inputs of a component, reference other component instances, access values from context, call basic functions and evaluate simple expressions.

These scripts are wrapped in `${}` like this `${this.foo}`

The script syntax can be escaped using a forward slash `\${value}` which will be interpreted as a string literal `${value}`

You can also embed scripts within partial strings

```yaml
hello: "hello ${this.world}" # resolves to "hello world"

world: "world"
```

## When scripts are evaluated

Scripts are evaluated using a `resolve` method in code AND are resolved for a component before the main method of a command runs (`deploy`, `remove`)
