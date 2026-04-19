const { getConfig, isEmailConfigured } = require('../_lib/config')
const { handleOptions, sendJson } = require('../_lib/http')
const { normalizeEmail, verifySignedToken } = require('../_lib/security')

module.exports = function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, message: '请求方法不支持。' })
    return
  }

  const config = getConfig()
  const email = normalizeEmail(req.body && req.body.email)
  const code = String((req.body && req.body.code) || '').trim()
  const verificationToken = String((req.body && req.body.verificationToken) || '').trim()

  if (!email) {
    sendJson(res, 400, { ok: false, message: '邮箱格式不正确。' })
    return
  }

  if (!code) {
    sendJson(res, 400, { ok: false, message: '请输入验证码。' })
    return
  }

  if (!isEmailConfigured(config)) {
    sendJson(res, 500, {
      ok: false,
      message: 'Vercel 环境变量未配置完整，请补充 SMTP 参数和 AUTH_TOKEN_SECRET。'
    })
    return
  }

  if (!verificationToken) {
    sendJson(res, 400, { ok: false, message: '验证码凭证缺失，请重新获取验证码。' })
    return
  }

  try {
    const payload = verifySignedToken(verificationToken, config.authTokenSecret)

    if (payload.type !== 'email_code' || payload.email !== email) {
      sendJson(res, 400, { ok: false, message: '验证码邮箱不匹配，请重新获取验证码。' })
      return
    }

    if (String(payload.code) !== code) {
      sendJson(res, 400, { ok: false, message: '验证码错误，请重新输入。' })
      return
    }

    sendJson(res, 200, { ok: true, message: '验证码校验成功。' })
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      message: error && error.message ? error.message : '验证码校验失败，请重新获取。'
    })
  }
}
