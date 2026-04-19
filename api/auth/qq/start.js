const { getConfig, isQqConfigured } = require('../../_lib/config')
const { handleOptions } = require('../../_lib/http')
const {
  appendRedirectParams,
  createQqStateToken,
  normalizeClientRedirect
} = require('../../_lib/qq')

module.exports = function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  const config = getConfig()
  const clientRedirect = normalizeClientRedirect(req.query && req.query.redirect, config, req)

  if (!isQqConfigured(config)) {
    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_error: 'QQ 登录未配置，请先填写 QQ_APP_ID、QQ_APP_KEY、QQ_REDIRECT_URI 和 AUTH_TOKEN_SECRET。'
      })
    )
    return
  }

  const state = createQqStateToken(clientRedirect, config)
  const authorizeUrl = new URL('https://graph.qq.com/oauth2.0/authorize')
  authorizeUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.qqAppId,
    redirect_uri: config.qqRedirectUri,
    scope: config.qqScope,
    state
  }).toString()

  res.redirect(authorizeUrl.toString())
}
