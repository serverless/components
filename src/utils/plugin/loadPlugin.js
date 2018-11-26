const loadPlugin = async (pluginPath, context) => {
  const PluginType = await context.import(pluginPath)
  return context.construct(PluginType, {})
}

export default loadPlugin
