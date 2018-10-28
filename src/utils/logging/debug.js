const debug = (context, ...args) => {
  if (!process.env.CI && context.options.debug) {
    // eslint-disable-next-line no-console
    console.debug(...args)
  }
}

export default debug
