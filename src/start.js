import dotenv from 'dotenv'
import minimist from 'minimist'
import run from './run'

const start = async () => {
  dotenv.config()
  const command = process.argv[2]
  const options = minimist(process.argv.slice(2))

  try {
    await run(command, options)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

export default start
