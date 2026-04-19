const { getConfig, isEmailConfigured, isQqConfigured } = require('./_lib/config')
const { handleOptions, sendJson } = require('./_lib/http')

module.exports = function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  const config = getConfig()
  sendJson(res, 200, {
    ok: true,
    provider: 'email-smtp',
    configured: isEmailConfigured(config),
    qqConfigured: isQqConfigured(config)
  })
}
