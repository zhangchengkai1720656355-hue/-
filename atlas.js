(() => {
  const auth = window.ZHYL_AUTH
  const data = window.ZHYL_DATA
  const state = {
    filter: '全部',
    keyword: '',
    entries: data.atlasEntries.filter((item) => item.status === 'published')
  }

  const refs = {
    atlasFilters: document.getElementById('atlas-filters'),
    atlasGrid: document.getElementById('atlas-grid'),
    atlasCount: document.getElementById('atlas-count'),
    searchInput: document.getElementById('search-input'),
    recentList: document.getElementById('atlas-recent-list')
  }

  renderFilters()
  renderAtlas()
  renderRecent()
  bindEvents()

  function bindEvents() {
    refs.searchInput.addEventListener('input', (event) => {
      state.keyword = event.target.value.trim().toLowerCase()
      renderAtlas()
    })

    refs.atlasGrid.addEventListener('click', (event) => {
      const favoriteButton = event.target.closest('[data-favorite-id]')
      if (!favoriteButton) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const result = auth.toggleFavorite(favoriteButton.dataset.favoriteId)
      if (!result.ok) {
        window.location.href = './login.html'
        return
      }

      renderAtlas()
    })
  }

  function renderFilters() {
    const filters = ['全部', '药材', '疗法', '纹样', '音频']
    refs.atlasFilters.innerHTML = filters
      .map((filter) => `
        <button class="filter-btn ${filter === state.filter ? 'is-active' : ''}" data-filter="${filter}">
          ${filter}
        </button>
      `)
      .join('')

    refs.atlasFilters.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.filter
        renderFilters()
        renderAtlas()
      })
    })
  }

  function renderAtlas() {
    const filtered = state.entries.filter((item) => {
      const filterOk = state.filter === '全部' || item.category === state.filter
      const keywordText = [
        item.name,
        item.category,
        item.desc,
        item.location,
        item.period,
        ...item.tags,
        ...item.details
      ]
        .join(' ')
        .toLowerCase()

      return filterOk && (!state.keyword || keywordText.includes(state.keyword))
    })

    refs.atlasCount.textContent = `${filtered.length} 条内容`

    if (!filtered.length) {
      refs.atlasGrid.innerHTML = '<div class="card empty-state-card">没有找到匹配内容，可以尝试切换分类或缩短关键词。</div>'
      return
    }

    refs.atlasGrid.innerHTML = filtered
      .map((entry) => `
        <a class="card atlas-card atlas-link" href="./detail.html?id=${entry.id}">
          ${renderCoverArt(entry, 'cover-fallback')}
          <div class="card-actions-row">
            ${renderFavoriteButton(entry)}
          </div>
          <div class="atlas-card__head">
            <div>
              <h3>${entry.name}</h3>
              <div class="meta-line">${entry.category} · ${entry.location}</div>
            </div>
            <div class="value-mark">${entry.value}${entry.unit}</div>
          </div>
          <p>${entry.desc}</p>
          <div class="tag-cluster">${entry.tags.map((tag) => `<span class="tag subtle">${tag}</span>`).join('')}</div>
        </a>
      `)
      .join('')
  }

  function renderRecent() {
    const recent = auth.getHistory()
    if (!recent.length) {
      refs.recentList.innerHTML = '<div class="empty-state">打开图谱详情后，这里会显示最近浏览记录。</div>'
      return
    }

    refs.recentList.innerHTML = recent
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
