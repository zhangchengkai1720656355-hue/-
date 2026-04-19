(() => {
  const auth = window.ZHYL_AUTH
  const data = window.ZHYL_DATA
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  const entry = data.atlasEntries.find((item) => item.id === id)
  const detailContent = document.getElementById('detail-page-content')
  const recentList = document.getElementById('detail-recent-list')

  if (!entry) {
    detailContent.innerHTML = `
      <div class="empty-page">
        <h1>内容不存在</h1>
        <p>当前详情数据没有找到，请返回首页重新选择图谱内容。</p>
        <a class="primary-btn link-btn primary-link" href="./index.html">返回首页</a>
      </div>
    `
    return
  }

  pushHistory(entry)
  renderDetail(entry)
  renderRecent()

  function renderDetail(item) {
    detailContent.innerHTML = `
      ${renderCoverArt(item, 'detail-page-cover')}
      <div class="card-actions-row detail-actions-row">
        ${renderFavoriteButton(item)}
      </div>
      <div class="detail-page-header">
        <span class="badge success">${item.category}</span>
        <span class="status-badge status-${item.status}">${item.statusText}</span>
      </div>
      <h1 class="detail-page-title">${item.name}</h1>
      <p class="detail-page-desc">${item.desc}</p>

      <div class="detail-grid">
        <div class="card soft-card">
          <span class="muted-line">样本规模</span>
          <strong class="detail-value">${item.value}${item.unit}</strong>
        </div>
        <div class="card soft-card">
          <span class="muted-line">采录周期</span>
          <strong class="detail-value detail-small">${item.period}</strong>
        </div>
      </div>

      <div class="card soft-card">
        <div class="section-head compact">
          <h3>内容说明</h3>
          <span>${item.location}</span>
        </div>
        <div class="tag-cluster">${item.tags.map((tag) => `<span class="tag subtle">${tag}</span>`).join('')}</div>
        <div class="detail-copy">
          ${item.details.map((line, index) => `<p>${index + 1}. ${line}</p>`).join('')}
        </div>
      </div>

      <div class="card soft-card">
        <div class="section-head compact">
          <h3>导览音频</h3>
          <span>${item.audioTitle}</span>
        </div>
        <p class="muted-text">当前 HTML 官网版保留音频导览位，后续可以继续接入真实播放器、字幕和时间轴。</p>
        <div class="hero-actions">
          <button class="primary-btn" type="button">播放导览音频</button>
          <button class="secondary-btn" type="button">分享当前页面</button>
        </div>
      </div>
    `

    const favoriteButton = detailContent.querySelector('[data-favorite-id]')
    if (favoriteButton) {
      favoriteButton.addEventListener('click', () => {
        const result = auth.toggleFavorite(item.id)
        if (!result.ok) {
          window.location.href = './login.html'
          return
        }

        renderDetail(item)
      })
    }
  }

  function renderRecent() {
    const recent = auth.getHistory()
    if (!recent.length) {
      recentList.innerHTML = '<div class="empty-state">还没有浏览记录。</div>'
      return
    }

    recentList.innerHTML = recent
      .map((item) => `
        <a class="history-item" href="./detail.html?id=${item.id}">
          ${renderCoverArt(item, 'history-cover')}
          <span>
            <strong>${item.name}</strong>
            <small>${item.desc}</small>
          </span>
        </a>
      `)
      .join('')
  }

  function pushHistory(item) {
    auth.pushHistory({
      id: item.id,
      name: item.name,
      desc: item.desc,
      coverLabel: item.coverLabel,
      coverTheme: item.coverTheme,
      category: item.category,
      imageUrl: item.imageUrl
    })
  }

  function renderCoverArt(item, className) {
    return `
      <div class="${className} theme-${item.coverTheme || 'herb'}">
        ${item.imageUrl ? `<img class="cover-photo" src="${item.imageUrl}" alt="${item.name}" loading="lazy" />` : ''}
        <span class="cover-kicker">${item.category || '图谱'}</span>
        <span class="cover-title">${item.coverLabel}</span>
      </div>
    `
  }

  function renderFavoriteButton(item) {
    const active = auth.isFavorited(item.id)
    return `
      <button
        class="favorite-btn ${active ? 'is-active' : ''}"
        type="button"
        data-favorite-id="${item.id}"
        aria-label="${active ? '取消收藏' : '加入收藏'}"
      >
        ${active ? '已收藏' : '收藏'}
      </button>
    `
  }
})()
