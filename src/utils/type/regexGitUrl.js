const def = '((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?'
const regex = new RegExp(def)

export {
  def,
  regex
}
