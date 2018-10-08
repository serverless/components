import { createCli } from './utils'
import createContext from './createContext'

const start = async () => {
  const context = await createContext()
  const cli = await createCli(context)
  try {
    await cli.start(process.argv)
  } catch (error) {
    context.log('An unexpected error occurred.')
    context.log(error)
    process.exit(1)
  }
}

export default start
