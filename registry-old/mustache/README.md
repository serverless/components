# Mustache Template Component

The `mustache` component applies the [Mustache](https://mustache.github.io/) template engine to a file tree, creating rendered versions of each `.mustache` file, and copying all other files unchanged. A source file name `myFile.xyz.mustache` will result in a corresponding file `myFile.xyz` in the rendered result. The rendered files are located in a temporary directory at the location specified by the `renderedFilePath` output property.

For use of the Mustache template language, see [the manual](https://mustache.github.io/mustache.5.html).

### Input

```yml
myRenderedFiles:
  type: mustache
  inputs:
    sourcePath: /absolute/path/to/my/content
    values:
      aVariableUsedInMustache: Value to insert.
```

### Output

```yml
myOtherComponent:
  type: example
  inputs:
    fileLocation: ${myRenderedFiles.renderedFilePath}/exampleFile.xyz
```
