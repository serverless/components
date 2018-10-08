import { find } from '@serverless/utils'

const findPluginForCommand = (command, context) => find(
  (plugin) => plugin.command === command,
  context.plugins
)

export default findPluginForCommand
