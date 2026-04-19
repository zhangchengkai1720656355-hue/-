(() => {
  const data = window.ZHYL_DATA
  const overviewRef = document.getElementById('admin-overview-page')
  const listRef = document.getElementById('admin-list-page')

  const overview = data.atlasEntries.reduce(
    (acc, item) => {
      acc.total += 1
      acc[item.status] += 1
      return acc
    },
    { total: 0, draft: 0, pending: 0, published: 0 }
  )

  overviewRef.innerHTML = [
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

  listRef.innerHTML = data.atlasEntries
    .map((entry) => `
      <article class="admin-row">
        <div>
          <h3>${entry.name}</h3>
          <div class="meta-line">${entry.id} · ${entry.category} · ${entry.location}</div>
        </div>
        <span class="status-badge status-${entry.status}">${entry.statusText}</span>
      </article>
    `)
    .join('')
})()
