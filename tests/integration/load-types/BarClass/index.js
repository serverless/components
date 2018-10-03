const BarClass = (SuperClass) =>
  class extends SuperClass {
    constructor(inputs, context) {
      super(
        {
          ...inputs,
          foo: 'constructor override'
        },
        context
      )
    }
    barfn() {
      return this
    }
  }

export default BarClass
