const FooClass = (SuperClass) =>
  class extends SuperClass {
    constructor(inputs, context) {
      super(inputs, context)
    }

    foofn() {
      return this
    }
  }

export default FooClass
