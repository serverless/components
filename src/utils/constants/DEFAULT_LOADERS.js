import * as name from '../type/loaders/name'
import * as path from '../type/loaders/path'
import * as registry from '../type/loaders/registry'
import * as url from '../type/loaders/url'

// TODO BRN: Loaders should potentially be supplied by plugins instead of here. This will enable plugins to extend the types of loaders that are supported.
const DEFAULT_LOADERS = {
  name,
  path,
  registry,
  url
}

export default DEFAULT_LOADERS
