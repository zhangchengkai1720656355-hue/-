const { createTransport, getConfig, isEmailConfigured } = require('../_lib/config')
const { handleOptions, sendJson } = require('../_lib/http')
const { generateCode, issueSignedToken, normalizeEmail } = require('../_lib/security')

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) {
    return
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, message: '请求方法不支持。' })
    return
  }

  const config = getConfig()
  const email = normalizeEmail(req.body && req.body.email)

  if (!email) {
    sendJson(res, 400, { ok: false, message: '邮箱格式不正确。' })
    return
  }

  if (!isEmailConfigured(config)) {
    sendJson(res, 500, {
      ok: false,
      message: 'Vercel 环境变量未配置完整，请补充 SMTP 参数和 AUTH_TOKEN_SECRET。'
    })
    return
  }

  try {
    const transporter = createTransport(config)
    const code = generateCode(config.codeLength)
    const verificationToken = issueSignedToken(
      {
        type: 'email_code',
        email,
        code
      },
      config.authTokenSecret,
      config.codeTtlSeconds
    )

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to: email,
      subject: '蒙医云境登录验证码',
      text: `您的登录验证码为 ${code}，${Math.floor(config.codeTtlSeconds / 60)} 分钟内有效。`,
      html: `
        <div style="font-family:Segoe UI,Microsoft YaHei,sans-serif;color:#2f241d;line-height:1.8">
          <h2 style="margin-bottom:12px">蒙医云境邮箱验证码</h2>
          <p>您好，您的登录验证码为：</p>
          <div style="display:inline-block;padding:10px 16px;border-radius:12px;background:#f1dfc7;color:#9b3f29;font-size:28px;font-weight:700;letter-spacing:6px">${code}</div>
          <p style="margin-top:16px">验证码 ${Math.floor(config.codeTtlSeconds / 60)} 分钟内有效，请勿泄露给他人。</p>
        </div>
      `
    })

    sendJson(res, 200, {
      ok: true,
      message: '验证码已发送到你的邮箱，请注意查收。',
      expiresIn: config.codeTtlSeconds,
      cooldown: 60,
      verificationToken
    })
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: error && error.message ? error.message : '邮箱验证码发送失败，请检查 SMTP 配置。'
    })
  }
}
