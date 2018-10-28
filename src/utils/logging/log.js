const log = (context, ...args) => {
  if (!process.env.CI) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}

export default log
