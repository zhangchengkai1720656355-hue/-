(() => {
  const auth = window.ZHYL_AUTH
  const summary = document.getElementById('profile-summary')
  const meta = document.getElementById('profile-meta')
  const tip = document.getElementById('profile-account-tip')
  const favoritesRef = document.getElementById('profile-favorites')
  const historyRef = document.getElementById('profile-history')
  const logoutButton = document.getElementById('logout-btn')
  const session = auth.getSession()
  const data = window.ZHYL_DATA

  if (!session) {
    window.location.href = './login.html'
  }

  renderProfile(session)
  renderFavorites(session)
  renderHistory(session)

  logoutButton.addEventListener('click', () => {
    auth.clearSession()
    window.location.href = './login.html'
  })

  function renderProfile(user) {
    const providerMap = {
      email: '邮箱验证码登录',
      phone: '手机号登录',
      qq: 'QQ 登录',
      wechat: '微信登录'
    }

    summary.style.backgroundImage = 'linear-gradient(180deg, rgba(28, 19, 14, 0.08) 0%, rgba(28, 19, 14, 0.48) 100%), url("./assets/medicinal/hero-herbs.png")'
    summary.style.backgroundSize = 'cover'
    summary.style.backgroundPosition = 'center'

    summary.innerHTML = `
      <span class="eyebrow">USER CENTER</span>
      <h1>${user.nickname || '未命名用户'}</h1>
      <p>欢迎进入蒙医云境个人中心。当前账号已登录，你现在可以基于这个本地会话继续演示收藏、浏览和内容同步能力。</p>
      <div class="profile-badges">
        <span class="tag">${providerMap[user.provider] || '本地账号'}</span>
        <span class="tag">${user.email || user.phone || '未绑定账号'}</span>
        <span class="tag">加入时间 ${user.joinedAt}</span>
      </div>
    `

    tip.textContent = `${user.nickname} 已登录，当前登录方式为 ${providerMap[user.provider] || '本地账号'}。`

    meta.innerHTML = [
      ['用户 ID', user.id],
      ['昵称', user.nickname || '未填写'],
      ['邮箱', user.email || '未绑定'],
      ['手机号', user.phone || '未绑定'],
      ['登录方式', providerMap[user.provider] || '本地账号'],
      ['注册时间', user.joinedAt]
    ].map(([label, value]) => `
      <div class="note-item">
        <strong>${label}</strong>
        <p>${value}</p>
      </div>
    `).join('')
  }

  function renderFavorites(user) {
    const favoriteIds = auth.getFavoriteIds(user.id)
    const favorites = favoriteIds
      .map((id) => data.atlasEntries.find((item) => item.id === id))
      .filter(Boolean)

    if (!favorites.length) {
      favoritesRef.innerHTML = '<div class="empty-state">当前账号还没有收藏图谱，去图谱页或详情页点“收藏”后会显示在这里。</div>'
      return
    }

    favoritesRef.innerHTML = favorites.map((item) => `
      <a class="mini-card mini-link favorite-card" href="./detail.html?id=${item.id}">
        ${renderCover(item)}
        <strong>${item.name}</strong>
        <p>${item.desc}</p>
      </a>
    `).join('')
  }

  function renderHistory(user) {
    const historyItems = auth.getHistory(user.id)

    if (!historyItems.length) {
      historyRef.innerHTML = '<div class="empty-state">当前账号还没有浏览记录，打开图谱详情后会自动记录在这里。</div>'
      return
    }

    historyRef.innerHTML = historyItems.map((item) => `
      <a class="mini-card mini-link favorite-card" href="./detail.html?id=${item.id}">
        ${renderCover(item)}
        <strong>${item.name}</strong>
        <p>${item.desc}</p>
      </a>
    `).join('')
  }

  function renderCover(item) {
    return `
      <div class="mini-cover theme-${item.coverTheme || 'herb'}">
        ${item.imageUrl ? `<img class="cover-photo" src="${item.imageUrl}" alt="${item.name}" loading="lazy" />` : ''}
        <span class="cover-kicker">${item.category || '图谱'}</span>
        <span class="cover-title">${item.coverLabel}</span>
      </div>
    `
  }
})()

