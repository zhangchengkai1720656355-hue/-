const crypto = require('crypto')

function issueSignedToken(payload, secret, ttlSeconds) {
  const envelope = {
    ...payload,
    exp: Date.now() + Number(ttlSeconds || 0) * 1000
  }
  const body = base64UrlEncode(JSON.stringify(envelope))
  const signature = sign(body, secret)
  return `${body}.${signature}`
}

function verifySignedToken(token, secret) {
  const text = String(token || '').trim()
  const parts = text.split('.')

  if (parts.length !== 2) {
    throw new Error('认证令牌格式无效。')
  }

  const [body, signature] = parts
  const expectedSignature = sign(body, secret)

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error('认证令牌签名无效。')
  }

  const payload = JSON.parse(base64UrlDecode(body))

  if (!payload.exp || Date.now() > Number(payload.exp)) {
    throw new Error('认证令牌已过期。')
  }

  return payload
}

function generateCode(length) {
  const size = Math.max(4, Number(length || 6))
  const max = 10 ** size
  return String(Math.floor(Math.random() * max)).padStart(size, '0')
}

function normalizeEmail(input) {
  const email = String(input || '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : ''
}

function sign(value, secret) {
  return crypto.createHmac('sha256', String(secret || '')).update(value).digest('base64url')
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''))
  const right = Buffer.from(String(b || ''))

  if (left.length !== right.length) {
    return false
  }

  return crypto.timingSafeEqual(left, right)
}

function base64UrlEncode(value) {
  return Buffer.from(String(value || ''), 'utf8').toString('base64url')
}

function base64UrlDecode(value) {
  return Buffer.from(String(value || ''), 'base64url').toString('utf8')
}

module.exports = {
  generateCode,
  issueSignedToken,
  normalizeEmail,
  verifySignedToken
}
