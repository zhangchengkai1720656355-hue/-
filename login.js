(function () {
  var auth = window.ZHYL_AUTH
  var isHttpPage = /^https?:$/i.test(window.location.protocol)
  var API_BASE = window.ZHYL_EMAIL_API_BASE || (isHttpPage ? window.location.origin : 'http://127.0.0.1:8790')
  var tabs = document.querySelectorAll('.auth-tab')
  var panels = document.querySelectorAll('.auth-section')
  var feedback = document.getElementById('auth-feedback')
  var loginForm = document.getElementById('login-form')
  var registerForm = document.getElementById('register-form')
  var resetDemoButton = document.getElementById('reset-demo-btn')
  var oauthButtons = document.querySelectorAll('.oauth-card')
  var codeButtons = document.querySelectorAll('.auth-code-btn')
  var session = auth.getSession()
  var redirectTarget = getRedirectTarget()
  var verificationTokenStore = readVerificationTokenStore()
  var i = 0

  handleQqCallbackResult()

  if (session) {
    feedback.textContent = '当前已登录为 ' + session.nickname + '，也可以直接进入个人中心。'
  }

  for (i = 0; i < tabs.length; i += 1) {
    bindTab(tabs[i])
  }

  for (i = 0; i < oauthButtons.length; i += 1) {
    bindOauth(oauthButtons[i])
  }

  if (resetDemoButton) {
    resetDemoButton.addEventListener('click', function () {
      auth.resetDemoData()
      loginForm.reset()
      registerForm.reset()
      verificationTokenStore = {}
      writeVerificationTokenStore(verificationTokenStore)

      for (var j = 0; j < codeButtons.length; j += 1) {
        clearCooldown(codeButtons[j])
        setButtonLoading(codeButtons[j], false)
      }

      feedback.textContent = '当前设备上的演示账号、收藏、浏览记录和登录状态已重置，现在可以重新测试注册和登录流程。'
    })
  }

  for (i = 0; i < codeButtons.length; i += 1) {
    bindCodeButton(codeButtons[i])
  }

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault()

    var formData = new FormData(loginForm)
    var email = String(formData.get('email') || '').trim().toLowerCase()
    var password = String(formData.get('password') || '').trim()
    var code = String(formData.get('code') || '').trim()

    if (!isEmail(email)) {
      feedback.textContent = '请输入正确的邮箱地址。'
      return
    }

    if (!password && code.length < 4) {
      feedback.textContent = '请输入密码，或输入至少 4 位邮箱验证码。'
      return
    }

    if (password) {
      feedback.textContent = '正在校验账号密码。'

      var passwordResult = auth.loginByPassword(email, password)
      if (!passwordResult.ok) {
        feedback.textContent = passwordResult.message
        return
      }

      feedback.textContent = '密码登录成功，正在进入网站。'
      goAfterLogin()
      return
    }

    feedback.textContent = '正在校验邮箱验证码。'

    postJson('/api/auth/verify-code', {
      email: email,
      code: code,
      verificationToken: getVerificationToken(email)
    }, function (error) {
      var result

      if (error) {
        feedback.textContent = error.message
        return
      }

      result = auth.loginByEmail(email, {
        autoCreate: true
      })

      if (!result.ok) {
        feedback.textContent = result.message
        return
      }

      feedback.textContent = result.created
        ? '邮箱验证成功，当前设备已自动同步该账号，正在进入网站。'
        : '邮箱登录成功，正在进入网站。'

      clearVerificationToken(email)
      goAfterLogin()
    })
  })

  registerForm.addEventListener('submit', function (event) {
    event.preventDefault()

    var formData = new FormData(registerForm)
    var nickname = String(formData.get('nickname') || '').trim()
    var email = String(formData.get('registerEmail') || '').trim().toLowerCase()
    var code = String(formData.get('registerCode') || '').trim()
    var password = String(formData.get('password') || '').trim()

    if (nickname.length < 2) {
      feedback.textContent = '昵称至少输入 2 个字符。'
      return
    }

    if (!isEmail(email)) {
      feedback.textContent = '请输入正确的邮箱地址。'
      return
    }

    if (code.length < 4) {
      feedback.textContent = '请输入至少 4 位邮箱验证码。'
      return
    }

    if (password.length < 6) {
      feedback.textContent = '密码长度至少 6 位。'
      return
    }

    feedback.textContent = '正在校验邮箱验证码。'

    postJson('/api/auth/verify-code', {
      email: email,
      code: code,
      verificationToken: getVerificationToken(email)
    }, function (error) {
      var result

      if (error) {
        feedback.textContent = error.message
        return
      }

      result = auth.registerUser({
        nickname: nickname,
        email: email,
        password: password,
        provider: 'email'
      }, {
        upsert: true
      })

      if (!result.ok) {
        feedback.textContent = result.message
        return
      }

      feedback.textContent = result.updated
        ? '该邮箱原有账号信息已更新，正在自动登录并进入网站。'
        : '注册成功，正在自动登录并进入网站。'

      clearVerificationToken(email)
      goAfterLogin()
    })
  })

  window.ZHYL_LOGIN_READY = true

  function bindTab(tab) {
    tab.addEventListener('click', function () {
      var mode = tab.getAttribute('data-mode')
      var i = 0

      for (i = 0; i < tabs.length; i += 1) {
        tabs[i].classList.toggle('is-active', tabs[i] === tab)
      }

      for (i = 0; i < panels.length; i += 1) {
        panels[i].classList.toggle('is-active', panels[i].getAttribute('data-auth-panel') === mode)
      }

      feedback.textContent = mode === 'login'
        ? '当前支持邮箱密码登录、邮箱验证码登录和 QQ 登录。跨设备首次登录请优先使用邮箱验证码。'
        : '当前为邮箱注册流程，验证码校验通过后会自动创建账号并登录。'
    })
  }

  function bindOauth(button) {
    button.addEventListener('click', function () {
      var provider = button.getAttribute('data-provider')

      if (provider === 'QQ') {
        feedback.textContent = '正在跳转到 QQ 授权页面。'
        window.location.href = API_BASE + '/api/auth/qq/start?redirect=' + encodeURIComponent(getLoginPageUrl())
        return
      }

      var result = auth.loginByProvider(provider)
      feedback.textContent = provider + ' 登录成功，正在进入网站。'
      if (result.ok) {
        goAfterLogin()
      }
    })
  }

  function bindCodeButton(button) {
    button.addEventListener('click', function () {
      var email = getEmailFromButton(button)

      if (!isEmail(email)) {
        feedback.textContent = '请先输入正确的邮箱地址，再获取验证码。'
        return
      }

      setButtonLoading(button, true, '发送中...')
      feedback.textContent = '正在请求邮箱服务，请稍候。'

      postJson('/api/auth/send-code', { email: email }, function (error, result) {
        if (error) {
          feedback.textContent = error.message
          if (Number(error.cooldown) > 0) {
            startCooldown(button, Number(error.cooldown))
          } else {
            setButtonLoading(button, false)
          }
          return
        }

        if (result && result.verificationToken) {
          verificationTokenStore[email] = result.verificationToken
          writeVerificationTokenStore(verificationTokenStore)
        }

        feedback.textContent = result.message || '验证码已发送到邮箱，请注意查收。'
        startCooldown(button, Number(result.cooldown) || 60)
      })
    })
  }

  function getEmailFromButton(button) {
    var form = button.closest('form')
    if (!form) {
      return ''
    }

    if (form === registerForm) {
      return String(registerForm.elements.registerEmail.value || '').trim().toLowerCase()
    }

    return String(loginForm.elements.email.value || '').trim().toLowerCase()
  }

  function postJson(path, payload, callback) {
    var xhr = new XMLHttpRequest()

    xhr.open('POST', API_BASE + path, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onreadystatechange = function () {
      var data = {}

      if (xhr.readyState !== 4) {
        return
      }

      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch (error) {
        data = {}
      }

      if (xhr.status < 200 || xhr.status >= 300 || data.ok === false) {
        var requestError = new Error(data.message || '接口请求失败。')
        requestError.cooldown = data.cooldown
        callback(requestError)
        return
      }

      callback(null, data)
    }

    xhr.onerror = function () {
      callback(new Error('无法连接邮箱验证码服务，请确认部署已完成且 API 可访问。'))
    }

    xhr.send(JSON.stringify(payload))
  }

  function handleQqCallbackResult() {
    var search = new URLSearchParams(window.location.search)
    var qqError = String(search.get('qq_error') || '').trim()
    var qqLogin = String(search.get('qq_login') || '').trim()

    if (qqError) {
      feedback.textContent = qqError
      clearCallbackParams()
      return
    }

    if (!qqLogin) {
      return
    }

    try {
      var profile = JSON.parse(decodeBase64Url(qqLogin))
      var result = auth.loginByQQProfile(profile)

      if (!result.ok) {
        feedback.textContent = result.message
        clearCallbackParams()
        return
      }

      feedback.textContent = 'QQ 登录成功，正在进入网站。'
      clearCallbackParams()
      goAfterLogin()
    } catch (error) {
      feedback.textContent = 'QQ 登录结果解析失败，请重新发起授权。'
      clearCallbackParams()
    }
  }

  function clearCallbackParams() {
    if (!window.history || !window.history.replaceState) {
      return
    }

    var target = window.location.pathname || '/login.html'
    window.history.replaceState({}, document.title, target)
  }

  function decodeBase64Url(input) {
    var value = String(input || '').replace(/-/g, '+').replace(/_/g, '/')

    while (value.length % 4) {
      value += '='
    }

    return decodeURIComponent(Array.prototype.map.call(window.atob(value), function (char) {
      return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  }

  function getLoginPageUrl() {
    if (isHttpPage) {
      return window.location.origin + '/login.html' + buildRedirectQuery()
    }

    return API_BASE + '/login.html' + buildRedirectQuery()
  }

  function buildRedirectQuery() {
    return redirectTarget ? '?redirect=' + encodeURIComponent(redirectTarget) : ''
  }

  function getRedirectTarget() {
    var search = new URLSearchParams(window.location.search)
    var redirect = String(search.get('redirect') || '').trim()

    if (!redirect) {
      return './index.html'
    }

    if (!/^\.\/[A-Za-z0-9._/-]+(?:\?.*)?(?:#.*)?$/.test(redirect)) {
      return './index.html'
    }

    if (/\.\/login\.html(?:[?#]|$)/i.test(redirect)) {
      return './index.html'
    }

    return redirect
  }

  function goAfterLogin() {
    window.setTimeout(function () {
      window.location.href = redirectTarget
    }, 500)
  }

  function setButtonLoading(button, loading, text) {
    if (!button.getAttribute('data-default-text')) {
      button.setAttribute('data-default-text', button.textContent)
    }

    button.disabled = loading
    button.textContent = loading ? text : button.getAttribute('data-default-text')
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
  }

  function startCooldown(button, seconds) {
    clearCooldown(button)

    if (!button.getAttribute('data-default-text')) {
      button.setAttribute('data-default-text', button.textContent)
    }

    var remaining = Number(seconds) || 60
    button.disabled = true
    button.textContent = remaining + 's 后重试'

    button._zhylTimer = window.setInterval(function () {
      remaining -= 1
      if (remaining <= 0) {
        clearCooldown(button)
        setButtonLoading(button, false)
        return
      }
      button.textContent = remaining + 's 后重试'
    }, 1000)
  }

  function clearCooldown(button) {
    if (button._zhylTimer) {
      window.clearInterval(button._zhylTimer)
      button._zhylTimer = null
    }
  }

  function getVerificationToken(email) {
    return verificationTokenStore[String(email || '').toLowerCase()] || ''
  }

  function clearVerificationToken(email) {
    delete verificationTokenStore[String(email || '').toLowerCase()]
    writeVerificationTokenStore(verificationTokenStore)
  }

  function readVerificationTokenStore() {
    try {
      return JSON.parse(sessionStorage.getItem('zhyl_email_code_tokens') || '{}')
    } catch (error) {
      return {}
    }
  }

  function writeVerificationTokenStore(store) {
    sessionStorage.setItem('zhyl_email_code_tokens', JSON.stringify(store))
  }
})()
