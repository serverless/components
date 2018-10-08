import start from './start'

const newCli = (context) => ({
  start: (argv) => start(argv, context)
})

export default newCli
