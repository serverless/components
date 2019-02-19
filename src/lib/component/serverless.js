const path = require('path')
const cli = require('../cli')
const {
  readState,
  writeState
} = require('../../utils')

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
    let name = config.name || this.constructor.name
    let stage = config.context.stage || 'dev'
    this.id = config.id || `${stage}.${name}`

    // Set context
    this.context = config.context

    // Set state
    this.state = readState(this.id)

    // Add CLI utilities
    this.cli = {}
    this.cli.log = (log) => {cli.renderLog(log, this.context.verbose ? this.id : name)}
    this.cli.status = (status) => {cli.renderStatus(this.context.verbose, status, this.context.verbose ? this.id : name)}
    this.cli.warn = (warning) => {cli.renderWarning(warning, this.context.verbose ? this.id : name)}
    this.cli.outputs = (outputs, entity) => {cli.renderOutputs(outputs, entity || (this.context.verbose ? this.id : name))}

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

  load(componentName, componentAlias) {
    try {
      let componentPath = path.resolve(__dirname, '../../../components', componentName, 'serverless')
      let childComponent = require(componentPath)
      childComponent = new childComponent({
        id: `${this.id}.${componentAlias || childComponent.name}`,
        context: this.context,
      })

      // If not verbose, replace outputs w/ empty function to silence child Components
      if (!this.context.verbose) {
        childComponent.cli.log = () => {return}
        childComponent.cli.status = () => {return}
        childComponent.cli.warn = () => {return}
        childComponent.cli.outputs = () => {return}
      }

      // TODO: If terminal is very narrow, only show status as "Running"

      return childComponent
    } catch (e) {
      console.log(e)
      throw Error(`Component "${componentName}" does not exist`)
    }
  }
}

module.exports = Component
