(() => {
  const data = window.ZHYL_DATA
  const target = document.getElementById('archive-page-list')
  const visuals = document.getElementById('archive-visuals')

  target.innerHTML = data.archives.map((item) => `
    <article class="archive-card card">
      <img class="archive-card__media" src="${item.imageUrl}" alt="${item.name}" loading="lazy" />
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
  `).join('')

  visuals.innerHTML = data.siteGallery.slice(4).map((item) => `
    <article class="gallery-card card">
      <img class="gallery-card__media" src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
      <div class="gallery-card__body">
        <h3>${item.title}</h3>
        <p>${item.subtitle}</p>
      </div>
    </article>
  `).join('')
})()
