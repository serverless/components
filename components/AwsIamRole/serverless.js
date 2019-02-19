const { equals, pick, mergeDeepRight } = require('../../src/utils')
const aws = require('aws-sdk')
const {
  createRole,
  deleteRole,
  getRole,
  addRolePolicy,
  removeRolePolicy,
  updateAssumeRolePolicy,
  configChanged
} = require('./utils')
const Component = require('../../src/lib/Component/serverless') // TODO: Change to { Component } = require('serverless')

let outputs = ['name', 'service', 'policy', 'arn']

const defaults = {
  name: 'serverless',
  service: 'lambda.amazonaws.com',
  policy: {
    arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  },
  region: 'us-east-1'
}

class AwsIamRole extends Component {
  async default(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    const iam = new aws.IAM({ region: config.region, credentials: this.context.credentials.aws })

    this.cli.status(`Deploying`)

    const prevRole = await getRole({ iam, ...config })

    if (!prevRole) {
      this.cli.status(`Creating`)
      config.arn = await createRole({ iam, ...config })
    } else {
      config.arn = prevRole.arn

      if (configChanged(prevRole, config)) {
        this.cli.status(`Updating`)
        if (prevRole.service !== config.service) {
          await updateAssumeRolePolicy({ iam, ...config })
        }
        if (!equals(prevRole.policy, config.policy)) {
          await removeRolePolicy({ iam, ...config })
          await addRolePolicy({ iam, ...config })
        }
      }
    }

    if (this.state.name && this.state.name !== config.name) {
      this.cli.status(`Replacing`)
      await deleteRole({ iam, name: this.state.name, policy: config.policy })
    }

    this.state.arn = config.arn
    this.state.name = config.name
    await this.save()

    outputs = pick(outputs, config)
    this.cli.outputs(outputs)
    return outputs
  }

  async remove(inputs = {}) {
    const config = mergeDeepRight(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name

    const iam = new aws.IAM({ region: config.region, credentials: this.context.credentials.aws })
    this.cli.status(`Removing`)
    await deleteRole({ iam, ...config })

    this.state = {}
    await this.save()

    return {}
  }
}

module.exports = AwsIamRole
