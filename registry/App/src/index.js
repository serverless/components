const App = (SuperClass) =>
  class extends SuperClass {
    async define() {
      return {
        ...this.services,
        ...this.components
      }
    }
  }

export default App
