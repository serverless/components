const { equals, pick, mergeDeep } = require('../../src/utils')
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

const Component = require('../Component/serverless')

const outputs = ['name', 'service', 'policy', 'arn']

const defaults = {
  name: 'serverless',
  service: 'lambda.amazonaws.com',
  policy: {
    arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
  }
}

class Role extends Component {
  async default(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    const iam = new aws.IAM()

    const prevRole = await getRole({ iam, ...config })

    if (!prevRole) {
      this.cli.status(`Creating Role`)
      config.arn = await createRole({ iam, ...config })
    } else {
      config.arn = prevRole.arn

      if (configChanged(prevRole, config)) {
        this.cli.status(`Updating Role`)
        if (prevRole.service !== config.service) {
          await updateAssumeRolePolicy({ iam, ...config })
        }
        if (!equals(prevRole.policy, config.policy)) {
          await removeRolePolicy({ iam, ...config })
          await addRolePolicy({ iam, ...config })
        }
      }
    }

    this.state.arn = config.arn
    this.state.name = config.name
    this.save()

    this.cli.success(`Role Deployed`)

    this.cli.log('')
    this.cli.output('Name', `   ${config.name}`)
    this.cli.output('Service', `${config.service}`)
    this.cli.output('ARN', `    ${config.arn}`)

    return pick(outputs, config)
  }

  async remove(inputs = {}) {
    const config = mergeDeep(defaults, inputs)
    config.name = inputs.name || this.state.name || defaults.name

    const iam = new aws.IAM()
    this.cli.status(`Removing Role`)
    await deleteRole({ iam, ...config })

    this.state = {}
    this.save()

    this.cli.success(`Role Removed`)
    this.cli.output('Name', `   ${config.name}`)

    return pick(outputs, config)
  }
}

module.exports = Role
