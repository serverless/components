const { getCli, readState, writeState, forEach } = require('../../src/utils')

class Component {
  constructor(id = this.constructor.name, inputs) {
    this.id = id
    this.inputs = inputs
    this.cli = getCli(id)
    this.state = readState(id)

    // defines the default function that would be returned below
    // and adds the instance context to it
    const that = this
    const defaultFunction = function() {
      return that.serverless.call(that)
    }

    // add Component class methods
    // we can remove this section if we don't want to expose
    // Component class methods like save() to parents
    const classMethods = Object.getOwnPropertyNames(Component.prototype)
    forEach((classMethod) => {
      defaultFunction[classMethod] = (classMethodInputs) =>
        this[classMethod].call(that, classMethodInputs) // apply instance context
    }, classMethods)

    // add instance methods
    // those are the methods of the class that extends Component
    // if user added his own save() method for example,
    // this would overwrite the Component class save() method
    const instanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    forEach((instanceMethod) => {
      defaultFunction[instanceMethod] = (instanceMethodInputs) =>
        this[instanceMethod].call(that, instanceMethodInputs) // apply instance context
    }, instanceMethods)

    return defaultFunction
  }

  save() {
    return writeState(this.id, this.state)
  }

  serverless() {
    // todo the main "sync" method
  }
}

module.exports = Component
