<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_HEADER) -->
# Kubernetes Deployment

Create a Kubernetes Deployment
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
| **namespace**| `string`<br/>*required* | namespace
| **progressDeadlineSeconds**| `integer` | progressDeadlineSeconds
| **name**| `string`<br/>*required* | name
| **template**| `object`<br/>*required* | template
| **minReadySeconds**| `integer` | minReadySeconds
| **paused**| `boolean` | paused
| **metadata**| `object` | metadata
| **replicas**| `integer` | replicas
| **revisionHistoryLimit**| `integer` | revisionHistoryLimit
| **selector**| `object` | selector
| **strategy**| `object` | strategy

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_OUTPUT_TYPES) -->
## Output Types
| Name | Type | Description |
|:------ |:-----|:-----------------|
| **availableReplicas**| `integer` | availableReplicas
| **collisionCount**| `integer` | collisionCount
| **conditions**| `array` | conditions
| **observedGeneration**| `integer` | observedGeneration
| **readyReplicas**| `integer` | readyReplicas
| **replicas**| `integer` | replicas
| **unavailableReplicas**| `integer` | unavailableReplicas
| **updatedReplicas**| `integer` | updatedReplicas

<!-- AUTO-GENERATED-CONTENT:END -->

<!-- AUTO-GENERATED-CONTENT:START (COMPONENT_EXAMPLES) -->
## Example
```yml
type: my-application
components:
  myKubernetesDeployment:
    type: kubernetes-deployment
    inputs:
      namespace: default
      name: mykubedeployment
      template:
        metadata:
          labels:
            app: nginx
        spec:
          containers:
            - name: nginx
              image: 'nginx:1.7.9'
              ports:
                - containerPort: 80
      replicas: 1
      selector:
        matchLabels:
          app: nginx

```
<!-- AUTO-GENERATED-CONTENT:END -->
