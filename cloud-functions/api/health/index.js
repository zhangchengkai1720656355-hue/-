import healthHandler from '../../../api/health.js'
import { runNodeHandler } from '../../_shared/adapter.js'

export default async function onRequest(context) {
  return runNodeHandler(context, healthHandler)
}
