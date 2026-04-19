import qqCallbackHandler from '../../../../../api/auth/qq/callback.js'
import { runNodeHandler } from '../../../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, qqCallbackHandler)
}
