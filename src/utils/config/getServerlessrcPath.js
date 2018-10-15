import { homedir } from 'os'
import { join } from 'path'

const getServerlessrcPath = () => join(homedir(), '.serverlessrc')

export default getServerlessrcPath
