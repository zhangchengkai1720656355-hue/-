import sendCodeHandler from '../../../../api/auth/send-code.js'
import { runNodeHandler } from '../../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, sendCodeHandler)
}
