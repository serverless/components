const BarClass = (SuperClass) =>
  class extends SuperClass {
    constructor(inputs, context) {
      super({ ...inputs, rad: true }, context)
    }
    barfn() {
      return this
    }
  }

export default BarClass
