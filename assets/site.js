const search = document.querySelector('#archive-search');
if (search) {
  const cards = [...document.querySelectorAll('[data-card-list] .article-card')];
  const count = document.querySelector('#search-count');
  const empty = document.querySelector('[data-empty]');
  const title = document.querySelector('[data-results-title]');
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const match = card.dataset.search.includes(query);
      card.hidden = !match;
      if (match) visible++;
    }
    count.textContent = query ? `找到 ${visible} 篇文章` : `显示全部 ${cards.length} 篇`;
    document.body.classList.toggle('search-active', Boolean(query));
    title.textContent = query ? `搜索结果 · ${visible} 篇` : `全部文章 · ${cards.length} 篇`;
    empty.hidden = visible !== 0;
  };
  search.addEventListener('input', update);
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      search.focus();
      search.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  });
}
