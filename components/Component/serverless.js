const path = require('path')
const { getCli, getCredentials, readState, writeState } = require('../../src/utils/')

class Component {
  constructor(config) {
    if (!config || typeof config === 'string') {
      this.stage = 'dev'
      this.id = config || `${this.stage}.${this.constructor.name}`
      this.credentials = getCredentials(this.stage)
      this.cli = getCli(this.stage, this.constructor.name, true)
    } else {
      this.stage = config.stage || 'dev'
      this.id = config.id || `${this.stage}.${this.constructor.name}`
      this.credentials = config.credentials || getCredentials(this.stage)
      this.cli = getCli(this.stage, this.constructor.name, config.silent)
    }
    this.state = readState(this.id)

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

  load(componentName, componentAlias, silent = true) {
    try {
      const childComponent = require(path.join('..', componentName, 'serverless'))

      return new childComponent({
        id: `${this.id}.${componentAlias || childComponent.name}`,
        stage: this.stage,
        credentials: this.credentials,
        silent
      })
    } catch (e) {
      throw Error(`Component "${componentName}" does not exist`)
    }
  }
}

module.exports = Component
