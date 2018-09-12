import { validRange } from 'semver'

const isSemverRange = (value) => validRange(value)

export default isSemverRange
