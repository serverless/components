const { getCli, readState, writeState } = require('../../src/utils/')

class Component {
  constructor(id = this.constructor.name, parent = false) {
    this.id = id
    this.cli = getCli(this.constructor.name, parent)
    this.state = readState(id)

    // defines the default function that would be returned below
    // and adds the instance context to it
    // todo validate that component author has defined a default() method
    const that = this
    const defaultFunction = function(inputs) {
      return that.default.call(that, inputs)
    }

    // add Component class properties like cli and state
    Object.keys(this).forEach((prop) => {
      defaultFunction[prop] = this[prop]
    })

    // add Component class methods like the save() method
    const classMethods = Object.getOwnPropertyNames(Component.prototype)

    classMethods.forEach((classMethod) => {
      defaultFunction[classMethod] = (classMethodInputs) =>
        this[classMethod].call(that, classMethodInputs) // apply instance context
    })

    // add instance methods
    // those are the methods of the class that extends Component
    // if user added his own save() method for example,
    // this would overwrite the Component class save() method
    const instanceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    instanceMethods.forEach((instanceMethod) => {
      defaultFunction[instanceMethod] = (instanceMethodInputs) =>
        this[instanceMethod].call(that, instanceMethodInputs) // apply instance context
    })

    return defaultFunction
  }

  save() {
    return writeState(this.id, this.state)
  }
}

module.exports = Component
