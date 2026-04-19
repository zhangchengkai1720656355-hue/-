import qqStartHandler from '../../../../../api/auth/qq/start.js'
import { runNodeHandler } from '../../../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, qqStartHandler)
}
