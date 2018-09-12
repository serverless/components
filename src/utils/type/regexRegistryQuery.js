import { def as defSemVer } from './regexSemVer'
import { def as defTypeName } from './regexTypeName'

const def = `^${defTypeName}@${defSemVer}$`
const regex = new RegExp(def)

export {
  def,
  regex
}
