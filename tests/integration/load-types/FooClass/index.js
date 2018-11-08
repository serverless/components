const FooClass = (SuperClass) =>
  class extends SuperClass {
    foofn() {
      return this
    }
  }

export default FooClass
