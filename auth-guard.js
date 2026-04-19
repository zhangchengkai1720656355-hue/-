(function () {
  var auth = window.ZHYL_AUTH
  var session = auth && auth.getSession ? auth.getSession() : null
  var isLoginPage = /\/login\.html$/i.test(window.location.pathname) || /\\login\.html$/i.test(window.location.pathname)

  if (isLoginPage) {
    return
  }

  if (session) {
    return
  }

  var target = getCurrentTarget()
  var loginUrl = './login.html'

  if (target) {
    loginUrl += '?redirect=' + encodeURIComponent(target)
  }

  window.location.replace(loginUrl)

  function getCurrentTarget() {
    var path = window.location.pathname || '/index.html'
    var search = window.location.search || ''
    var hash = window.location.hash || ''
    var filename = path.split('/').pop() || 'index.html'

    return './' + filename + search + hash
  }
})()
