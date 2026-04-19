const { issueSignedToken, verifySignedToken } = require('./security')

function normalizeClientRedirect(input, config, req) {
  const value = String(input || '').trim()

  if (!value) {
    return getDefaultClientRedirect(config, req)
  }

  try {
    const target = new URL(value)

    if (target.protocol === 'file:') {
      return getDefaultClientRedirect(config, req)
    }

    if (/^https?:$/.test(target.protocol)) {
      return target.toString()
    }
  } catch (error) {
    return getDefaultClientRedirect(config, req)
  }

  return getDefaultClientRedirect(config, req)
}

function getDefaultClientRedirect(config, req) {
  if (config.publicSiteUrl) {
    return new URL('/login.html', config.publicSiteUrl).toString()
  }

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000'
  return `${proto}://${host}/login.html`
}

function createQqStateToken(redirect, config) {
  return issueSignedToken(
    {
      type: 'qq_state',
      redirect
    },
    config.authTokenSecret,
    config.qqStateTtlSeconds
  )
}

function parseQqStateToken(state, config) {
  const payload = verifySignedToken(state, config.authTokenSecret)

  if (payload.type !== 'qq_state' || !payload.redirect) {
    throw new Error('QQ 登录状态无效，请重新发起授权。')
  }

  return payload
}

function appendRedirectParams(baseUrl, params) {
  const target = new URL(baseUrl)
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (typeof value === 'string' && value) {
      target.searchParams.set(key, value)
    }
  })
  return target.toString()
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

async function fetchQqAccessToken(code, config) {
  const tokenUrl = new URL('https://graph.qq.com/oauth2.0/token')
  tokenUrl.search = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.qqAppId,
    client_secret: config.qqAppKey,
    code,
    redirect_uri: config.qqRedirectUri,
    fmt: 'json'
  }).toString()

  const response = await fetch(tokenUrl)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error_description || 'QQ 登录换取 access token 失败。')
  }

  if (!data.access_token) {
    throw new Error(data.error_description || 'QQ 登录未返回 access token。')
  }

  return String(data.access_token)
}

async function fetchQqOpenId(accessToken) {
  const openidUrl = new URL('https://graph.qq.com/oauth2.0/me')
  openidUrl.search = new URLSearchParams({
    access_token: accessToken,
    fmt: 'json'
  }).toString()

  const response = await fetch(openidUrl)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error_description || 'QQ 登录获取 OpenID 失败。')
  }

  if (!data.openid) {
    throw new Error(data.error_description || 'QQ 登录未返回 OpenID。')
  }

  return String(data.openid)
}

async function fetchQqProfile(accessToken, openid, config) {
  const profileUrl = new URL('https://graph.qq.com/user/get_user_info')
  profileUrl.search = new URLSearchParams({
    access_token: accessToken,
    oauth_consumer_key: config.qqAppId,
    openid
  }).toString()

  const response = await fetch(profileUrl)
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.msg || 'QQ 登录获取用户资料失败。')
  }

  if (Number(data.ret) !== 0) {
    throw new Error(data.msg || 'QQ 登录返回的用户资料无效。')
  }

  return data
}

module.exports = {
  appendRedirectParams,
  createQqStateToken,
  encodePayload,
  fetchQqAccessToken,
  fetchQqOpenId,
  fetchQqProfile,
  getDefaultClientRedirect,
  normalizeClientRedirect,
  parseQqStateToken
}
