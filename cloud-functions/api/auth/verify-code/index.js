import verifyCodeHandler from '../../../../api/auth/verify-code.js'
import { runNodeHandler } from '../../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, verifyCodeHandler)
}
