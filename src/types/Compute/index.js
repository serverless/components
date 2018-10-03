const Compute = {
  defineFunction() {
    throw new Error(`${this.name} must implement the defineFunction method`)
  }
}

export default Compute
