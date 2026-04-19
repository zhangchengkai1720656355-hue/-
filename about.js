(() => {
  const data = window.ZHYL_DATA
  const modulesTarget = document.getElementById('about-modules')
  const galleryTarget = document.getElementById('about-gallery')
  const modules = [
    ['首页主视觉', '项目主题、品牌气质与大批量图像入口统一落在首页展示。'],
    ['非遗图谱', '药材、疗法、纹样、音频等内容以图文卡片方式集中整理。'],
    ['图谱详情', '独立详情页支持头图、最近浏览与收藏联动。'],
    ['传承档案', '人物、机构与田野计划转成带图像的档案卡片。'],
    ['古籍典藏', '站内接入《四部医典》和《蒙药正典》，登录后可直接在线阅读。'],
    ['管理看板', '内容状态与结构性概览保留，便于后续扩展后台。']
  ]

  if (modulesTarget) {
    modulesTarget.innerHTML = modules
      .map(([title, desc]) => `
        <article class="module-card">
          <h3>${title}</h3>
          <p>${desc}</p>
        </article>
      `)
      .join('')
  }

  if (galleryTarget) {
    galleryTarget.innerHTML = data.siteGallery
      .slice(0, 6)
      .map((item) => `
        <article class="gallery-card card">
          <img class="gallery-card__media" src="${item.imageUrl}" alt="${item.title}" loading="lazy" />
          <div class="gallery-card__body">
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
          </div>
        </article>
      `)
      .join('')
  }
})()
