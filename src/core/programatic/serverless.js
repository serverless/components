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
    this.state = readState(this.context.root, this.id)

    const entity = this.context.verbose ? this.id : name

    // Add CLI utilities
    // we need to keep the entire instance in memory to pass it to child components
    this.ui = {
      instance: config.ui,
      outputs: {}
    }

    this.ui.log = (log) => {
      this.ui.instance.log(log, entity)
    }
    this.ui.status = (status) => {
      this.ui.instance.status(this.context.verbose, status, entity)
    }
    this.ui.warn = (warning) => {
      this.ui.instance.warn(warning, entity)
    }
    this.ui.error = (error) => {
      this.ui.instance.error(error, entity)
    }

    this.ui.output = (key, value) => {
      this.ui.outputs[key] = value
      this.ui.instance.output(key, value)
    }

    // Define default function
    // Adds the instance context to it
    const that = this

    // make sure author defined at least a default function
    if (typeof that.default !== 'function') {
      throw Error(`default function is missing for component "${name}"`)
    }

    const defaultFunction = function(inputs) {
      return that.default.call(that, inputs)
    }

    // Add Component class properties like ui and state
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
    return writeState(this.context.root, this.id, this.state)
  }

  async load(componentNameOrPath, componentAlias) {
    const childComponent = await loadComponent(componentNameOrPath)
    const childComponentInstance = new childComponent({
      id: `${this.id}.${componentAlias || childComponent.name}`,
      context: this.context,
      ui: this.ui.instance
    })

    // If not verbose, replace outputs w/ empty function to silence child Components
    if (!this.context.verbose) {
      childComponentInstance.ui.log = () => {
        return
      }
      childComponentInstance.ui.status = () => {
        return
      }
      childComponentInstance.ui.warn = () => {
        return
      }
      childComponentInstance.ui.output = (key, value) => {
        childComponentInstance.ui.outputs[key] = value
        // console.log(childComponentInstance.ui.outputs)
        return
      }
    }

    return childComponentInstance
  }
}

module.exports = Component
