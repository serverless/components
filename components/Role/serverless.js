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

const outputProps = ['name', 'service', 'policy', 'arn']

class Role extends Component {
  async default() {
    this.defaults = {
      name: 'serverless',
      service: 'lambda.amazonaws.com',
      policy: {
        arn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }
    }

    const config = mergeDeep(this.defaults, this.inputs)
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

    this.cli.success(`Role Deployed`)

    this.cli.log('')
    this.cli.output('Name', `   ${config.name}`)
    this.cli.output('Service', `${config.service}`)
    this.cli.output('ARN', `    ${config.arn}`)

    this.outputs = pick(outputProps, config)

    return this.outputs
  }
}

module.exports = Role
