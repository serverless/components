const EnvironmentBasedConfiguration = (SuperClass) =>
  class extends SuperClass {
    async construct(inputs, context) {
      await super.construct(inputs, context)

      const variableNames = inputs.variables
      const variableValues = {}

      variableNames.forEach((name) => {
        variableValues[name] = process.env[name]
      })

      this.values = variableValues
    }
  }

export default EnvironmentBasedConfiguration
