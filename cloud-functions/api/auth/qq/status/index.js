import qqStatusHandler from '../../../../../api/auth/qq/status.js'
import { runNodeHandler } from '../../../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, qqStatusHandler)
}
