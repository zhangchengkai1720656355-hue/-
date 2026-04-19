(() => {
  const data = window.ZHYL_DATA
  const classics = data.classics || []
  const params = new URLSearchParams(window.location.search)
  const initialId = params.get('book')

  const refs = {
    list: document.getElementById('classics-list'),
    title: document.getElementById('reader-title'),
    subtitle: document.getElementById('reader-subtitle'),
    meta: document.getElementById('reader-meta'),
    frame: document.getElementById('reader-frame'),
    empty: document.getElementById('reader-empty'),
    open: document.getElementById('reader-open')
  }

  let activeId = resolveInitialId()

  renderList()
  syncReader()

  function resolveInitialId() {
    if (initialId && classics.some((item) => item.id === initialId)) {
      return initialId
    }

    return classics[0] ? classics[0].id : ''
  }

  function renderList() {
    if (!refs.list) {
      return
    }

    refs.list.innerHTML = classics
      .map((item) => `
        <button class="classic-card card classics-item${item.id === activeId ? ' is-active' : ''}" type="button" data-book-id="${item.id}">
          <img class="classic-card__media" src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
          <div class="classic-card__body">
            <span class="badge success">${item.tag}</span>
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
            <div class="classic-meta">${item.source}</div>
          </div>
        </button>
      `)
      .join('')

    refs.list.querySelectorAll('[data-book-id]').forEach((element) => {
      element.addEventListener('click', () => {
        activeId = element.getAttribute('data-book-id') || ''
        renderList()
        syncReader()
      })
    })
  }

  function syncReader() {
    const activeBook = classics.find((item) => item.id === activeId)

    if (!activeBook) {
      if (refs.empty) {
        refs.empty.hidden = false
      }
      if (refs.frame) {
        refs.frame.hidden = true
        refs.frame.removeAttribute('src')
      }
      if (refs.title) {
        refs.title.textContent = '暂未找到可查阅古籍'
      }
      if (refs.subtitle) {
        refs.subtitle.textContent = '请检查站内典藏资源是否已接入。'
      }
      if (refs.meta) {
        refs.meta.textContent = ''
      }
      if (refs.open) {
        refs.open.removeAttribute('href')
      }
      return
    }

    if (refs.title) {
      refs.title.textContent = activeBook.title
    }
    if (refs.subtitle) {
      refs.subtitle.textContent = activeBook.subtitle
    }
    if (refs.meta) {
      refs.meta.textContent = `${activeBook.tag} · ${activeBook.meta}`
    }
    if (refs.empty) {
      refs.empty.hidden = true
    }
    if (refs.frame) {
      refs.frame.hidden = false
      refs.frame.src = activeBook.pdfUrl
      refs.frame.title = activeBook.title
    }
    if (refs.open) {
      refs.open.href = activeBook.pdfUrl
    }

    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('book', activeBook.id)
    window.history.replaceState({}, '', nextUrl.toString())
  }
})()
