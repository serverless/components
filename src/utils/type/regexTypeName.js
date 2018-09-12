const def = '[a-zA-Zd](?:[a-zA-Zd]|(_)(?=[a-zA-Zd])){0,38}'
const regex = new RegExp(`^${def}$`)

export { def, regex }
