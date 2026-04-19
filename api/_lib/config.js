const nodemailer = require('nodemailer')

function getConfig() {
  return {
    host: envString('EMAIL_HOST'),
    smtpPort: envNumber('EMAIL_PORT', 465),
    secure: envBoolean('EMAIL_SECURE', true),
    user: envString('EMAIL_USER'),
    pass: envString('EMAIL_PASS'),
    fromName: envString('EMAIL_FROM_NAME', '蒙医云境'),
    fromAddress: envString('EMAIL_FROM_ADDRESS'),
    codeLength: envNumber('EMAIL_CODE_LENGTH', 6),
    codeTtlSeconds: envNumber('EMAIL_CODE_TTL_SECONDS', 300),
    authTokenSecret: envString('AUTH_TOKEN_SECRET') || envString('EMAIL_PASS'),
    qqAppId: envString('QQ_APP_ID'),
    qqAppKey: envString('QQ_APP_KEY'),
    qqRedirectUri: envString('QQ_REDIRECT_URI'),
    qqScope: envString('QQ_SCOPE', 'get_user_info'),
    qqStateTtlSeconds: envNumber('QQ_STATE_TTL_SECONDS', 600),
    publicSiteUrl: envString('PUBLIC_SITE_URL')
  }
}

function createTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.smtpPort,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  })
}

function isEmailConfigured(config) {
  return Boolean(
    isRealValue(config.host) &&
    isRealValue(config.user) &&
    isRealValue(config.pass) &&
    isRealValue(config.fromAddress) &&
    isRealValue(config.authTokenSecret)
  )
}

function isQqConfigured(config) {
  return Boolean(
    isRealValue(config.qqAppId) &&
    isRealValue(config.qqAppKey) &&
    isRealValue(config.qqRedirectUri) &&
    isRealValue(config.authTokenSecret)
  )
}

function envString(name, fallback) {
  const value = process.env[name]
  if (typeof value === 'undefined' || value === null) {
    return typeof fallback === 'undefined' ? '' : String(fallback)
  }

  const trimmed = String(value).trim()
  if (!trimmed && typeof fallback !== 'undefined') {
    return String(fallback)
  }

  return trimmed
}

function envNumber(name, fallback) {
  const value = Number(envString(name, fallback))
  return Number.isFinite(value) ? value : fallback
}

function envBoolean(name, fallback) {
  const normalized = envString(name, fallback ? 'true' : 'false').toLowerCase()
  if (normalized === 'true') {
    return true
  }
  if (normalized === 'false') {
    return false
  }
  return Boolean(fallback)
}

function isRealValue(value) {
  const text = String(value || '').trim()
  return Boolean(text) && !text.startsWith('your_')
}

module.exports = {
  createTransport,
  getConfig,
  isEmailConfigured,
  isQqConfigured
}
