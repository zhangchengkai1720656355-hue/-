const { getConfig, isQqConfigured } = require('../../_lib/config')
const {
  appendRedirectParams,
  encodePayload,
  fetchQqAccessToken,
  fetchQqOpenId,
  fetchQqProfile,
  getDefaultClientRedirect,
  parseQqStateToken
} = require('../../_lib/qq')

module.exports = async function handler(req, res) {
  const config = getConfig()
  const code = String((req.query && req.query.code) || '').trim()
  const state = String((req.query && req.query.state) || '').trim()
  const errorMessage = String((req.query && (req.query.error_description || req.query.error)) || '').trim()

  let clientRedirect = getDefaultClientRedirect(config, req)

  if (state) {
    try {
      const statePayload = parseQqStateToken(state, config)
      clientRedirect = statePayload.redirect
    } catch (error) {
      res.redirect(
        appendRedirectParams(clientRedirect, {
          qq_error: error.message || 'QQ 登录状态已失效，请重新发起授权。'
        })
      )
      return
    }
  }

  if (!isQqConfigured(config)) {
    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_error: 'QQ 登录未配置，请先填写 QQ_APP_ID、QQ_APP_KEY、QQ_REDIRECT_URI 和 AUTH_TOKEN_SECRET。'
      })
    )
    return
  }

  if (errorMessage) {
    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_error: errorMessage
      })
    )
    return
  }

  if (!code) {
    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_error: 'QQ 登录回调缺少授权 code。'
      })
    )
    return
  }

  try {
    const accessToken = await fetchQqAccessToken(code, config)
    const openid = await fetchQqOpenId(accessToken)
    const profile = await fetchQqProfile(accessToken, openid, config)
    const qqLogin = encodePayload({
      provider: 'qq',
      openid,
      nickname: profile.nickname || 'QQ用户',
      avatar: profile.figureurl_qq_2 || profile.figureurl_qq_1 || profile.figureurl_2 || profile.figureurl_1 || '',
      gender: profile.gender || '',
      province: profile.province || '',
      city: profile.city || '',
      year: profile.year || ''
    })

    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_login: qqLogin
      })
    )
  } catch (error) {
    res.redirect(
      appendRedirectParams(clientRedirect, {
        qq_error: error && error.message ? error.message : 'QQ 登录失败，请稍后重试。'
      })
    )
  }
}
