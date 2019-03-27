const { readState, writeState, loadComponent } = require('../../utils')

/**
 * Component core class
 * @param {Object} config - Configuration
 * @param {Object} config.context - The Component context.
 * @param {String} config.root - The root path of the parent Component.
 * @param {String} config.stage - The stage you wish to set in the context.
 * @param {Object} config.credentials - The credentials you wish to set in the context.
 * @param {String} config.verbose - If you wish to see all outputs of child components.
 * @param {String} config.debug - If you wish to turn on debug mode.
 */

class Component {
  constructor(config) {
    // Set id
    const name = config.name || this.constructor.name
    const stage = config.context.stage || 'dev'
    this.stage = stage
    this.id = config.id || `${stage}.${name}`

    // Set context
    this.context = config.context

    // Set state
    this.state = readState(this.id)

    // Add CLI utilities
    // we need to keep the entire instance in memory to pass it to child components
    this.cli = {
      _: config.cli
    }
    this.cli.log = (log) => {
      this.cli._.renderLog(log, this.context.verbose ? this.id : name)
    }
    this.cli.status = (status) => {
      this.cli._.renderStatus(this.context.verbose, status, this.context.verbose ? this.id : name)
    }
    this.cli.warn = (warning) => {
      this.cli._.renderWarning(warning, this.context.verbose ? this.id : name)
    }
    this.cli.outputs = (outputs, entity) => {
      this.cli._.renderOutputs(outputs, entity || (this.context.verbose ? this.id : name))
    }

    // Define default function
    // Adds the instance context to it
    // TODO: validate that component author has defined a default() method
    const that = this
    const defaultFunction = function(inputs) {
      return that.default.call(that, inputs)
    }

    // Add Component class properties like cli and state
    Object.keys(this).forEach((prop) => {
      defaultFunction[prop] = this[prop]
    })

    // Add Component class methods like the save() method
    const classMethods = Object.getOwnPropertyNames(Component.prototype)
    classMethods.forEach((classMethod) => {
      defaultFunction[classMethod] = (classMethodInputs) =>
        this[classMethod].call(that, classMethodInputs) // apply instance context
    })

    // Add instance methods
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

  async load(componentNameOrPath, componentAlias) {
    const childComponent = await loadComponent(componentNameOrPath)
    const childComponentInstance = new childComponent({
      id: `${this.id}.${componentAlias || childComponent.name}`,
      context: this.context,
      cli: this.cli._
    })

    // If not verbose, replace outputs w/ empty function to silence child Components
    if (!this.context.verbose) {
      childComponentInstance.cli.log = () => {
        return
      }
      childComponentInstance.cli.status = () => {
        return
      }
      childComponentInstance.cli.warn = () => {
        return
      }
      childComponentInstance.cli.outputs = () => {
        return
      }
    }

    return childComponentInstance
  }
}

module.exports = Component
