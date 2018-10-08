import { all, map } from '@serverless/utils'
import loadPlugin from './loadPlugin'

const loadPlugins = async (plugins, context) =>
  all(map((pluginPath) => loadPlugin(pluginPath, context), plugins))

export default loadPlugins
