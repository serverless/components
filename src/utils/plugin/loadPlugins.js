import { map } from '@serverless/utils'
import loadPlugin from './loadPlugin'

const loadPlugins = async (plugins, context) =>
  map(async (pluginPath) => loadPlugin(pluginPath, context), plugins)

export default loadPlugins
