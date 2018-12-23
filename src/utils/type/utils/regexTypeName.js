const def = '[a-zA-Z](?:[a-zA-Z0-9]|(_)(?=[a-zA-Z0-9])){0,38}'
const regex = new RegExp(`^${def}$`)

export { def, regex }
