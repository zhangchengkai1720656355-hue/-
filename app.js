(() => {
  const auth = window.ZHYL_AUTH
  const data = window.ZHYL_DATA
  const publishedEntries = data.atlasEntries.filter((item) => item.status === 'published')

  const refs = {
    heroTags: document.getElementById('hero-tags'),
    heroMetrics: document.getElementById('hero-metrics'),
    heroShowcase: document.getElementById('hero-showcase'),
    featuredStories: document.getElementById('featured-stories'),
    homeAtlas: document.getElementById('home-atlas'),
    archiveList: document.getElementById('archive-list'),
    recentList: document.getElementById('recent-list'),
    adminOverview: document.getElementById('admin-overview'),
    imageGallery: document.getElementById('image-gallery'),
    homeClassics: document.getElementById('home-classics')
  }

  renderHome()
  renderArchive()
  renderRecent()
  renderAdminOverview()
  renderGallery()
  renderClassics()

  function renderHome() {
    if (refs.heroTags) {
      refs.heroTags.innerHTML = data.heroTags
        .map((tag) => `<span class="tag">${tag}</span>`)
        .join('')
    }

    if (refs.heroMetrics) {
      const metrics = [
        { value: `${data.atlasEntries.length}+`, label: '图谱样本' },
        { value: `${publishedEntries.length}`, label: '已发布条目' },
        { value: `${data.classics.length}`, label: '馆藏古籍' }
      ]

      refs.heroMetrics.innerHTML = metrics
        .map((item) => `
          <div class="metric-card">
            <strong>${item.value}</strong>
            <span>${item.label}</span>
          </div>
        `)
        .join('')
    }

    if (refs.featuredStories) {
      refs.featuredStories.innerHTML = data.featuredStories
        .map((story) => `
          <article class="story-card card">
            ${renderPhotoBlock(story.imageUrl, story.title, 'story-card__media')}
            <div class="story-card__body">
              <span class="badge">${story.badge}</span>
              <h3>${story.title}</h3>
              <p>${story.subtitle}</p>
            </div>
          </article>
        `)
        .join('')
    }

    if (refs.heroShowcase) {
      refs.heroShowcase.innerHTML = data.heroPanels
        .map((panel, index) => `
          <article class="hero-slide theme-${panel.theme}">
            ${renderPhotoBlock(panel.imageUrl, panel.title, 'hero-slide-photo')}
            <div class="hero-slide-art">
              <span class="hero-slide-index">0${index + 1}</span>
              <span class="hero-slide-meta">${panel.meta}</span>
            </div>
            <div class="hero-slide-copy">
              <h3>${panel.title}</h3>
              <p>${panel.subtitle}</p>
            </div>
          </article>
        `)
        .join('')
    }

    if (refs.homeAtlas) {
      refs.homeAtlas.innerHTML = publishedEntries
        .slice(0, 4)
        .map(renderMiniAtlasCard)
        .join('')
    }
  }

  function renderArchive() {
    if (!refs.archiveList) {
      return
    }

    refs.archiveList.innerHTML = data.archives
      .map((item) => `
        <article class="archive-card card">
          ${renderPhotoBlock(item.imageUrl, item.name, 'archive-card__media')}
          <div class="archive-card__body">
            <div class="archive-card__meta">
              <span class="year-pill">${item.year}</span>
              <div>
                <h3>${item.name}</h3>
                <div class="muted-line">${item.role}</div>
              </div>
            </div>
            <p>${item.focus}</p>
          </div>
        </article>
      `)
      .join('')
  }

  function renderRecent() {
    if (!refs.recentList) {
      return
    }

    const recent = auth.getHistory()
    if (!recent.length) {
      refs.recentList.innerHTML = '<div class="empty-state">打开任意图谱详情后，这里会自动记录最近浏览内容。</div>'
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

  function renderAdminOverview() {
    if (!refs.adminOverview) {
      return
    }

    const overview = data.atlasEntries.reduce(
      (acc, item) => {
        acc.total += 1
        acc[item.status] += 1
        return acc
      },
      { total: 0, draft: 0, pending: 0, published: 0 }
    )

    refs.adminOverview.innerHTML = [
      ['总图谱数', overview.total],
      ['草稿', overview.draft],
      ['待审核', overview.pending],
      ['已发布', overview.published]
    ]
      .map(
        ([label, value]) => `
          <div class="overview-tile">
            <strong>${value}</strong>
            <span>${label}</span>
          </div>
        `
      )
      .join('')
  }

  function renderGallery() {
    if (!refs.imageGallery) {
      return
    }

    refs.imageGallery.innerHTML = data.siteGallery
      .map((item) => `
        <article class="gallery-card card">
          ${renderPhotoBlock(item.imageUrl, item.title, 'gallery-card__media')}
          <div class="gallery-card__body">
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
          </div>
        </article>
      `)
      .join('')
  }

  function renderClassics() {
    if (!refs.homeClassics) {
      return
    }

    refs.homeClassics.innerHTML = data.classics
      .map((item) => `
        <article class="classic-card card">
          ${renderPhotoBlock(item.imageUrl, item.title, 'classic-card__media')}
          <div class="classic-card__body">
            <span class="badge success">${item.tag}</span>
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
            <div class="classic-meta">${item.meta}</div>
            <div class="classic-card__actions">
              <a class="primary-btn link-btn primary-link" href="./classics.html?book=${item.id}">在线查阅</a>
            </div>
          </div>
        </article>
      `)
      .join('')
  }

  function renderMiniAtlasCard(item) {
    return `
      <a class="mini-card mini-link" href="./detail.html?id=${item.id}">
        ${renderCoverArt(item, 'mini-cover')}
        <strong>${item.name}</strong>
        <p>${item.desc}</p>
      </a>
    `
  }

  function renderCoverArt(item, className) {
    return `
      <div class="${className} theme-${item.coverTheme || 'herb'}">
        ${renderPhotoBlock(item.imageUrl, item.name || item.coverLabel || '蒙医云境图像', 'cover-photo')}
        <span class="cover-kicker">${item.category || '图谱'}</span>
        <span class="cover-title">${item.coverLabel}</span>
      </div>
    `
  }

  function renderPhotoBlock(url, alt, className) {
    if (!url) {
      return ''
    }

    return `<img class="${className}" src="${url}" alt="${alt}" loading="lazy" />`
  }
})()
