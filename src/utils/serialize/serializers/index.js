import * as array from './array'
import * as boolean from './boolean'
import * as custom from './custom'
import * as date from './date'
import * as infinity from './infinity'
import * as nan from './nan'
import * as _null from './null'
import * as number from './number'
import * as object from './object'
import * as string from './string'
import * as _undefined from './undefined'

// TODO BRN: Serializers should be supplied by types so that types can introduce new low level primitives that are serializable
export {
  array,
  boolean,
  custom,
  date,
  infinity,
  nan,
  _null as null,
  number,
  object,
  string,
  _undefined as undefined
}
