const { sleep } = require('../../src/utils')
const Component = require('../Component/serverless')
const Child = require('../Child/serverless')

class Parent extends Component {
  async serverless() {
    this.cli.status('Deploying Parent')
    await sleep(2000)

    // construct a child component by passing a unique id, and some inputs.
    // to ensure id is unique within your app tree, prefix with "this.id"
    const childComponent = new Child(`${this.id}.myChild`, { memory: 512 })
    await childComponent() // this would call the main serverless() method of the child

    await sleep(2000)

    // call a custom method on the child component
    await childComponent.connect({ url: 'https://serverless.com' })

    await sleep(2000)

    this.state.arn = 'parent:arn' // set state in memory

    this.cli.success('Parent Deployment Succeeded')
    this.cli.log('')
    this.cli.output('Arn', this.state.arn)

    this.save() // persist state in disk!
  }
}

module.exports = Parent
