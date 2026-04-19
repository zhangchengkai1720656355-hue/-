const { getConfig, isQqConfigured } = require('../../_lib/config')
const { handleOptions, sendJson } = require('../../_lib/http')

module.exports = function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  const config = getConfig()
  sendJson(res, 200, {
    ok: true,
    configured: isQqConfigured(config),
    redirectUri: config.qqRedirectUri || '',
    appId: maskValue(config.qqAppId)
  })
}

function maskValue(value) {
  const text = String(value || '').trim()
  if (text.length <= 4) {
    return text
  }
  return `${text.slice(0, 2)}***${text.slice(-2)}`
}
