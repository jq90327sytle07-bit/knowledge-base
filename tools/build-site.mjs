import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const articleRoot = join(root, 'articles');
const categories = [
  { slug: 'getting-started', label: '新生入门', en: 'Getting started', description: '从选专业到熟悉校园平台，把常用入口一次找齐。', ids: [1, 2, 3, 4, 32, 49], mark: '01' },
  { slug: 'majors', label: '专业探索', en: 'Explore majors', description: '听听不同专业的课程安排、学习体验与选择建议。', ids: Array.from({ length: 18 }, (_, i) => i + 5), mark: '02' },
  { slug: 'courses', label: '课程与教授', en: 'Courses & faculty', description: '选课之前，先看看课程和教授的真实体验。', ids: [...Array.from({ length: 9 }, (_, i) => i + 23), 33], mark: '03' },
  { slug: 'exchange', label: '交换与实习', en: 'Beyond campus', description: '交换申请、异地生活与实习机会的经验分享。', ids: [34, 35, 36, 43, 48], mark: '04' },
  { slug: 'academic-support', label: '学术支持', en: 'Academic support', description: '写作、复习、学术政策和可使用的支持资源。', ids: [37, 38, 39, 40, 41, 42, 44, 45, 46, 47, 50], mark: '05' },
];

const byId = new Map(categories.flatMap(category => category.ids.map(id => [id, category])));
if (byId.size !== 50 || categories.reduce((sum, category) => sum + category.ids.length, 0) !== 50) {
  throw new Error('The five categories must assign every article exactly once.');
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const articleUrl = article => `articles/${encodeURIComponent(article.folder)}/${encodeURIComponent(article.file.replace(/\.md$/, '.html'))}`;
const categoryUrl = category => `category/${category.slug}/index.html`;
const cleanTitle = title => title.replace(/^GPS\s*(?:干货|专业介绍|专业攻略|课程介绍|新生指南|交换分享)\s*[-｜|—：:]?\s*/i, '').replace(/^【课程揭秘】/, '').trim();

const sourceDirs = (await readdir(articleRoot, { withFileTypes: true })).filter(entry => entry.isDirectory() && /^article-\d{3}-/.test(entry.name));
const articles = [];
for (const dir of sourceDirs) {
  const id = Number(dir.name.slice(8, 11));
  const files = await readdir(join(articleRoot, dir.name));
  const file = files.find(name => name.endsWith('.md') && name !== 'image-index.md');
  if (!file || !byId.has(id)) throw new Error(`Missing article or category for ${dir.name}`);
  const markdown = await readFile(join(articleRoot, dir.name, file), 'utf8');
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  const source = markdown.match(/^>\s*原链接：\s*(https:\/\/\S+)/m)?.[1];
  if (!heading || !source) throw new Error(`Missing title or source in ${file}`);
  const body = markdown.replace(/^#[^\n]*\n(?:.|\n)*?\n---\s*\n/, '');
  const plain = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '').replace(/[#*`>_\[\]]/g, '').replace(/\s+/g, ' ').trim();
  const category = byId.get(id);
  articles.push({ id, folder: dir.name, file, title: heading, shortTitle: cleanTitle(heading), category, source, body, excerpt: plain.slice(0, 110) + (plain.length > 110 ? '…' : '') });
}
articles.sort((a, b) => a.id - b.id);
if (articles.length !== 50 || articles.some((article, index) => article.id !== index + 1)) throw new Error('Expected articles 001–050.');

function shell({ title, description, rootPath, current, main, extraHead = '' }) {
  const navLinks = [
    `<a href="${rootPath}index.html" ${current === 'home' ? 'aria-current="page"' : ''}>全部文章</a>`,
    ...categories.map(category => `<a href="${rootPath}${categoryUrl(category)}" ${current === category.slug ? 'aria-current="page"' : ''}>${category.label}</a>`),
  ].join('');
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#8c1c24">
<title>${escapeHtml(title)} · GPS 文章馆</title>
<link rel="stylesheet" href="${rootPath}assets/site.css"><link rel="stylesheet" href="${rootPath}assets/brand.css">${extraHead}</head>
<body><a class="skip-link" href="#main">跳转到正文</a><div class="site-wrap">
<header class="site-header"><a class="brand" href="${rootPath}index.html" aria-label="Queen's GPS 文章馆首页"><img class="brand-symbol" src="${rootPath}assets/gps-logo.jpg" alt=""><span>Queen's GPS <small>文章馆</small></span></a>
<nav class="site-nav" aria-label="主导航">${navLinks}</nav></header>
${main}
<footer class="site-footer"><span>Queen's GPS · 文章馆</span><span>内容来自原始文章，政策及平台操作请以学校现行信息为准。</span></footer>
</div><script src="${rootPath}assets/site.js" defer></script></body></html>`;
}

function card(article, rootPath) {
  return `<a class="article-card" href="${rootPath}${articleUrl(article)}" data-search="${escapeHtml(`${article.title} ${article.excerpt} ${article.category.label}`.toLowerCase())}">
    <span class="card-top"><span class="card-category">${article.category.label}</span><span class="card-number">${String(article.id).padStart(2, '0')}</span></span>
    <h3>${escapeHtml(article.shortTitle)}</h3><p>${escapeHtml(article.excerpt)}</p><span class="card-link">阅读文章 <span aria-hidden="true">↗</span></span>
  </a>`;
}

const categoryTiles = categories.map(category => `<a class="category-tile" href="${categoryUrl(category)}"><span class="tile-index">${category.mark} / ${String(category.ids.length).padStart(2, '0')} 篇</span><strong>${category.label}</strong><span>${category.en} <b aria-hidden="true">↗</b></span></a>`).join('');
const home = `<main id="main"><section class="directory-intro"><h1>文章馆</h1><p>按主题浏览，或搜索 50 篇校园经验文章。</p>
<div class="search-wrap"><label for="archive-search">搜索文章</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="archive-search" type="search" placeholder="搜索专业、课程、SOLUS……" autocomplete="off"><kbd>/</kbd></div><p id="search-count" class="search-count" aria-live="polite">显示全部 50 篇</p></div></section>
<section class="section categories-section" id="explore"><h2>按主题浏览</h2><div class="category-grid">${categoryTiles}</div></section>
<section class="section archive-section" id="all"><h2 data-results-title>全部文章 <span class="heading-count">50</span></h2>
<div class="article-grid" data-card-list>${articles.map(article => card(article, '')).join('')}</div><p class="empty-state" data-empty hidden>没有找到相关文章，试试更短的关键词。</p></section></main>`;
await writeFile(join(root, 'index.html'), shell({ title: '首页', description: 'GPS 文章馆：50 篇 Queen’s 校园生活经验文章，按主题分类阅读。', rootPath: '', current: 'home', main: home }));

for (const category of categories) {
  const selected = articles.filter(article => article.category === category);
  const tiles = categories.map(item => `<a href="../../${categoryUrl(item)}" ${item === category ? 'aria-current="page"' : ''}>${item.label} <span>${item.ids.length}</span></a>`).join('');
  const main = `<main id="main"><section class="category-hero"><a class="back-link" href="../../index.html">← 返回文章馆</a><p class="eyebrow">${category.mark} / ${escapeHtml(category.en.toUpperCase())}</p><h1>${category.label}<span class="category-hero-count">${selected.length} 篇</span></h1><p>${category.description}</p></section>
  <div class="category-layout"><aside class="category-sidebar"><p class="sidebar-label">浏览分类</p>${tiles}</aside><section class="category-results"><p class="result-label">${category.label} · ${selected.length} 篇文章</p><div class="article-grid">${selected.map(article => card(article, '../../')).join('')}</div></section></div></main>`;
  const output = join(root, 'category', category.slug, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, shell({ title: category.label, description: category.description, rootPath: '../../', current: category.slug, main }));
}

marked.setOptions({ gfm: true, breaks: false });
for (const article of articles) {
  const category = article.category;
  const headings = [...article.body.matchAll(/^#{2,3}\s+(.+)$/gm)].map(match => ({ depth: match[0].match(/^#+/)[0].length, text: match[1].replace(/[*_`]/g, '').trim() })).filter(x => x.text.length > 1).slice(0, 18);
  let content = marked.parse(article.body);
  content = content.replace(/<img /g, '<img loading="lazy" decoding="async" ');
  // Relative image URLs in the Markdown resolve beside this generated HTML file.
  const siblings = articles.filter(item => item.category === category);
  const pos = siblings.indexOf(article);
  const adjacent = [siblings[pos - 1], siblings[pos + 1]].filter(Boolean);
  const related = adjacent.map(item => `<a href="../../${articleUrl(item)}"><span>${item.id < article.id ? '上一篇' : '下一篇'}</span><strong>${escapeHtml(item.shortTitle)}</strong><span aria-hidden="true">↗</span></a>`).join('');
  const toc = headings.length ? `<aside class="article-toc"><span class="sidebar-label">本文目录</span><nav aria-label="本文目录">${headings.map((heading, index) => `<a href="#section-${index}" class="toc-depth-${heading.depth}">${escapeHtml(heading.text)}</a>`).join('')}</nav></aside>` : '';
  let headingIndex = 0;
  content = content.replace(/<h([23])>(.*?)<\/h\1>/g, (_match, depth, inner) => `<h${depth} id="section-${headingIndex++}">${inner}</h${depth}>`);
  const main = `<main id="main"><div class="article-breadcrumb"><a href="../../index.html">文章馆</a><span>›</span><a href="../../${categoryUrl(category)}">${category.label}</a><span>›</span><span>第 ${String(article.id).padStart(2, '0')} 篇</span></div>
  <header class="article-hero"><span class="article-badge">${category.label} <span>·</span> ARTICLE ${String(article.id).padStart(2, '0')}</span><h1>${escapeHtml(article.title)}</h1><p class="article-intro">${escapeHtml(article.excerpt)}</p><div class="article-meta"><span>GPS 文章归档</span><span class="meta-dot">✳</span><a href="${escapeHtml(article.source)}" target="_blank" rel="noopener noreferrer">阅读微信原文 ↗</a></div></header>
  <div class="article-layout">${toc}<article class="prose"><div class="archive-note"><strong>归档提示</strong><span>本文保留原发布时的叙述。涉及课程、平台或学校政策时，请以学校最新信息为准。</span></div>${content}<div class="article-end"><span>✳</span><p>感谢阅读。继续探索这一主题：</p><a href="../../${categoryUrl(category)}">查看「${category.label}」全部文章 →</a></div></article></div>
  ${related ? `<nav class="related-articles" aria-label="相邻文章">${related}</nav>` : ''}</main>`;
  const output = join(articleRoot, article.folder, article.file.replace(/\.md$/, '.html'));
  await writeFile(output, shell({ title: article.shortTitle, description: article.excerpt, rootPath: '../../', current: category.slug, main }));
}

console.log(`Built ${articles.length} article pages and ${categories.length} category pages.`);
