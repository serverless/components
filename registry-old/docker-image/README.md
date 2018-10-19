<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Docker Image

Create and publish Docker images
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (TOC) -->
- [Input Types](#input-types)
- [Output Types](#output-types)
- [Example](#example)
<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_INPUT_TYPES) -->
## Input Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **username**| `string` | The username used when logging in to the Docker registry
| **password**| `string` | The password used when logging in to the Docker registry
| **dockerfilePath**| `string`<br/>*required* | The Dockerfile which should be used to assemble the image
| **contextPath**| `string`<br/>*required* | The build context path which is used when building the Docker image
| **tag**| `string`<br/>*required* | The tag which should be used to tag the Docker image
| **registryUrl**| `string`<br/>*required* | The Docker registry URL which should be used to push the image

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **tag**| `string` | The Docker image tag used when performing the given operation

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myDockerImage:
    type: docker-image
    inputs:
      username: jdoe
      password: s0m3p455w0rd
      dockerfilePath: ./Dockerfile
      contextPath: .
      tag: 'jdoe/my-image:latest'
      registryUrl: 'https://my-registry.com:8080'

```
<!-- AUTO-GENERATED-CONTENT:END -->
