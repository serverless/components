const { sleep } = require('../../src/utils')
const Component = require('../Component/serverless')

class Child extends Component {
  async serverless() {
    this.cli.status('Deploying Child')

    await sleep(2000)

    this.cli.fail('Child Deployment Failed. Retrying...')

    await sleep(2000)

    this.state.arn = 'child:arn'

    this.cli.success(`Child Deployment Succeeded with memory ${this.inputs.memory}`)

    // this section will ignored by the CLI
    // because this component is used as child
    // if it is used as the top level component
    // it won't be ignored
    this.cli.log('')
    this.cli.output('Child Arn', this.state.arn)

    this.save()
  }

  async connect(inputs) {
    this.cli.success(`Connected to ${inputs.url}`)
  }
}

module.exports = Child
