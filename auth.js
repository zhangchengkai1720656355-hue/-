(function () {
  var USERS_KEY = 'zhyl_demo_users'
  var SESSION_KEY = 'zhyl_demo_session'
  var FAVORITES_KEY = 'zhyl_demo_favorites'
  var HISTORY_KEY = 'zhyl_demo_history'

  var seedUsers = [
    {
      id: 'demo-email-user',
      nickname: '草原访客',
      email: 'demo@zhyl.local',
      password: '123456',
      provider: 'email',
      joinedAt: '2026-04-18'
    }
  ]

  function ensureSeedUsers() {
    var users = readJson(USERS_KEY, [])
    if (users.length) {
      return users
    }
    writeJson(USERS_KEY, seedUsers)
    return seedUsers
  }

  function getUsers() {
    return ensureSeedUsers()
  }

  function saveUsers(users) {
    writeJson(USERS_KEY, users)
  }

  function getSession() {
    return readJson(SESSION_KEY, null)
  }

  function setSession(user) {
    writeJson(SESSION_KEY, user)
    syncLoginLinks(user)
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY)
    syncLoginLinks(null)
  }

  function resetDemoData() {
    localStorage.removeItem(USERS_KEY)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(FAVORITES_KEY)
    localStorage.removeItem(HISTORY_KEY)
    ensureSeedUsers()
    syncLoginLinks(null)
  }

  function getFavoritesMap() {
    return readJson(FAVORITES_KEY, {})
  }

  function saveFavoritesMap(map) {
    writeJson(FAVORITES_KEY, map)
  }

  function getFavoriteIds(userId) {
    if (typeof userId === 'undefined') {
      var session = getSession()
      userId = session ? session.id : ''
    }

    if (!userId) {
      return []
    }

    var map = getFavoritesMap()
    return Object.prototype.toString.call(map[userId]) === '[object Array]' ? map[userId] : []
  }

  function isFavorited(entryId, userId) {
    return getFavoriteIds(userId).indexOf(entryId) !== -1
  }

  function toggleFavorite(entryId, userId) {
    if (typeof userId === 'undefined') {
      var session = getSession()
      userId = session ? session.id : ''
    }

    if (!userId) {
      return { ok: false, message: '请先登录后再收藏图谱。' }
    }

    var map = getFavoritesMap()
    var current = Object.prototype.toString.call(map[userId]) === '[object Array]' ? map[userId] : []
    var exists = current.indexOf(entryId) !== -1
    var next = []
    var i = 0

    if (exists) {
      for (i = 0; i < current.length; i += 1) {
        if (current[i] !== entryId) {
          next.push(current[i])
        }
      }
    } else {
      next.push(entryId)
      for (i = 0; i < current.length; i += 1) {
        next.push(current[i])
      }
    }

    map[userId] = next
    saveFavoritesMap(map)

    return {
      ok: true,
      favorited: !exists,
      favorites: next
    }
  }

  function getHistoryMap() {
    return readJson(HISTORY_KEY, {})
  }

  function saveHistoryMap(map) {
    writeJson(HISTORY_KEY, map)
  }

  function getHistoryOwnerId(userId) {
    if (typeof userId === 'undefined') {
      var session = getSession()
      userId = session ? session.id : ''
    }
    return userId || 'guest'
  }

  function getHistory(userId) {
    var ownerId = getHistoryOwnerId(userId)
    var map = getHistoryMap()
    return Object.prototype.toString.call(map[ownerId]) === '[object Array]' ? map[ownerId] : []
  }

  function pushHistory(entry, userId) {
    var ownerId = getHistoryOwnerId(userId)
    var map = getHistoryMap()
    var current = Object.prototype.toString.call(map[ownerId]) === '[object Array]' ? map[ownerId] : []
    var next = [entry]
    var i = 0

    for (i = 0; i < current.length; i += 1) {
      if (current[i].id !== entry.id) {
        next.push(current[i])
      }
    }

    map[ownerId] = next.slice(0, 8)
    saveHistoryMap(map)
    return map[ownerId]
  }

  function findUserByEmail(email) {
    var users = getUsers()
    var normalized = normalizeEmail(email)
    var i = 0

    for (i = 0; i < users.length; i += 1) {
      if (normalizeEmail(users[i].email) === normalized) {
        return users[i]
      }
    }

    return null
  }

  function findUserByProviderId(provider, providerUserId) {
    var users = getUsers()
    var normalizedProvider = String(provider || '').toLowerCase()
    var normalizedProviderUserId = String(providerUserId || '').trim()
    var i = 0

    for (i = 0; i < users.length; i += 1) {
      if (
        String(users[i].provider || '').toLowerCase() === normalizedProvider &&
        (
          String(users[i].providerUserId || '') === normalizedProviderUserId ||
          String(users[i].qqOpenId || '') === normalizedProviderUserId
        )
      ) {
        return users[i]
      }
    }

    return null
  }

  function hasUserByEmail(email) {
    return !!findUserByEmail(email)
  }

  function registerUser(payload, options) {
    var users = getUsers()
    var normalizedEmail = normalizeEmail(payload.email)
    var existingUser = findUserByEmail(normalizedEmail)

    options = options || {}

    if (existingUser && !options.upsert) {
      return { ok: false, message: '该邮箱已注册，请直接登录。' }
    }

    if (existingUser && options.upsert) {
      existingUser.nickname = String(payload.nickname || '').trim() || existingUser.nickname
      existingUser.password = String(payload.password || '').trim() || existingUser.password
      existingUser.provider = payload.provider || existingUser.provider || 'email'
      existingUser.phone = payload.phone || existingUser.phone || ''
      existingUser.syncedAt = new Date().toISOString()

      saveUsers(users)
      setSession(existingUser)
      return { ok: true, user: existingUser, updated: true }
    }

    var user = {
      id: 'user-' + Date.now(),
      nickname: String(payload.nickname || '').trim() || buildNicknameFromEmail(normalizedEmail),
      email: normalizedEmail,
      phone: payload.phone || '',
      password: String(payload.password || '').trim(),
      provider: payload.provider || 'email',
      joinedAt: new Date().toISOString().slice(0, 10),
      syncedAt: new Date().toISOString()
    }

    users.unshift(user)
    saveUsers(users)
    setSession(user)
    return { ok: true, user: user }
  }

  function loginByEmail(email, options) {
    var normalizedEmail = normalizeEmail(email)
    var user = findUserByEmail(normalizedEmail)

    options = options || {}

    if (!user && options.autoCreate) {
      user = createSyncedEmailUser(normalizedEmail, options)
    }

    if (!user) {
      return { ok: false, message: '该邮箱尚未同步到当前设备，请先使用邮箱验证码登录一次。' }
    }

    user.syncedAt = new Date().toISOString()
    saveCurrentUser(user)
    setSession(user)
    return { ok: true, user: user, created: !!options.autoCreate && !options.preExisting }
  }

  function loginByPassword(email, password) {
    var user = findUserByEmail(email)
    var normalizedPassword = String(password || '').trim()

    if (!user) {
      return {
        ok: false,
        message: '当前设备还没有这个账号的信息，请先用邮箱验证码登录一次，再使用密码登录。'
      }
    }

    if (!user.password) {
      return { ok: false, message: '该账号当前设备未保存密码，请先使用验证码登录或重新设置密码。' }
    }

    if (String(user.password) !== normalizedPassword) {
      return { ok: false, message: '密码错误，请重新输入。' }
    }

    user.syncedAt = new Date().toISOString()
    saveCurrentUser(user)
    setSession(user)
    return { ok: true, user: user }
  }

  function loginByQQProfile(profile) {
    var users = getUsers()
    var openid = String((profile && profile.openid) || '').trim()
    var nickname = String((profile && profile.nickname) || '').trim() || 'QQ用户'
    var avatar = String((profile && profile.avatar) || '').trim()
    var user = null

    if (!openid) {
      return { ok: false, message: 'QQ 登录缺少 OpenID，无法完成登录。' }
    }

    user = findUserByProviderId('qq', openid)

    if (!user) {
      user = {
        id: 'qq-' + Date.now(),
        nickname: nickname,
        email: '',
        phone: '',
        password: '',
        provider: 'qq',
        providerUserId: openid,
        qqOpenId: openid,
        avatar: avatar,
        joinedAt: new Date().toISOString().slice(0, 10),
        syncedAt: new Date().toISOString()
      }

      users.unshift(user)
    } else {
      user.nickname = nickname || user.nickname || 'QQ用户'
      user.provider = 'qq'
      user.providerUserId = openid
      user.qqOpenId = openid
      user.avatar = avatar || user.avatar || ''
      user.syncedAt = new Date().toISOString()
    }

    saveUsers(users)
    setSession(user)
    return { ok: true, user: user }
  }

  function loginByProvider(provider) {
    var users = getUsers()
    var providerId = String(provider || '').toLowerCase()
    var user = null
    var i = 0

    for (i = 0; i < users.length; i += 1) {
      if (users[i].provider === providerId) {
        user = users[i]
        break
      }
    }

    if (!user) {
      user = {
        id: providerId + '-' + Date.now(),
        nickname: provider === 'QQ' ? 'QQ访客' : '微信访客',
        email: '',
        phone: '',
        password: '',
        provider: providerId,
        joinedAt: new Date().toISOString().slice(0, 10),
        syncedAt: new Date().toISOString()
      }
      users.unshift(user)
      saveUsers(users)
    } else {
      user.syncedAt = new Date().toISOString()
      saveCurrentUser(user)
    }

    setSession(user)
    return { ok: true, user: user }
  }

  function createSyncedEmailUser(email, options) {
    var users = getUsers()
    var nickname = String(options.nickname || '').trim() || buildNicknameFromEmail(email)
    var user = {
      id: 'user-' + Date.now(),
      nickname: nickname,
      email: email,
      phone: '',
      password: String(options.password || '').trim(),
      provider: 'email',
      joinedAt: new Date().toISOString().slice(0, 10),
      syncedAt: new Date().toISOString(),
      syncedFromEmailCode: true
    }

    users.unshift(user)
    saveUsers(users)
    return user
  }

  function saveCurrentUser(user) {
    var users = getUsers()
    var i = 0
    var replaced = false

    for (i = 0; i < users.length; i += 1) {
      if (users[i].id === user.id) {
        users[i] = user
        replaced = true
        break
      }
    }

    if (!replaced) {
      users.unshift(user)
    }

    saveUsers(users)
  }

  function buildNicknameFromEmail(email) {
    var normalized = normalizeEmail(email)
    var prefix = normalized.split('@')[0] || '云境用户'
    return prefix.slice(0, 18)
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase()
  }

  function syncLoginLinks(session) {
    if (typeof session === 'undefined') {
      session = getSession()
    }

    var links = document.querySelectorAll('[data-auth-link]')
    var i = 0

    for (i = 0; i < links.length; i += 1) {
      if (session) {
        links[i].textContent = session.nickname || '个人中心'
        links[i].setAttribute('href', './profile.html')
      } else {
        links[i].textContent = '登录'
        links[i].setAttribute('href', './login.html')
      }
    }
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    } catch (error) {
      return fallback
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  window.ZHYL_AUTH = {
    getUsers: getUsers,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    resetDemoData: resetDemoData,
    getFavoriteIds: getFavoriteIds,
    isFavorited: isFavorited,
    toggleFavorite: toggleFavorite,
    getHistory: getHistory,
    pushHistory: pushHistory,
    hasUserByEmail: hasUserByEmail,
    registerUser: registerUser,
    loginByEmail: loginByEmail,
    loginByPassword: loginByPassword,
    loginByQQProfile: loginByQQProfile,
    loginByProvider: loginByProvider,
    syncLoginLinks: syncLoginLinks
  }

  ensureSeedUsers()
  syncLoginLinks()
})()
