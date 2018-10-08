import { find } from '@serverless/utils'

const findPluginForCommand = (command, context) =>
  context.plugins[find((plugin) => plugin.command === command, context.plugins)]

export default findPluginForCommand
