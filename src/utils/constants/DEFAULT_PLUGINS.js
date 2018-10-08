import { join } from 'path'
import PLUGINS_DIR from './PLUGINS_DIR'

const DEFAULT_PLUGINS = {
  Deploy: join(PLUGINS_DIR, 'Deploy'),
  Info: join(PLUGINS_DIR, 'Info'),
  Package: join(PLUGINS_DIR, 'Package'),
  Remove: join(PLUGINS_DIR, 'Remove')
}

export default DEFAULT_PLUGINS
