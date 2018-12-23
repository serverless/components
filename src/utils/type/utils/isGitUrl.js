import { regex } from './regexGitUrl'

const isGitUrl = (value) => regex.test(value)

export default isGitUrl
