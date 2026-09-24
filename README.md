# knowledge-base

GPS 文章馆：50 篇校园经验文章的 Markdown 归档和静态阅读站。

## 网站结构

| 分类 | 篇数 | 文章编号 |
| --- | ---: | --- |
| 新生入门 | 6 | 001–004、032、049 |
| 专业探索 | 18 | 005–022 |
| 课程与教授 | 10 | 023–031、033 |
| 交换与实习 | 5 | 034–036、043、048 |
| 学术支持 | 11 | 037–042、044–047、050 |

原始文章和图片保存在 `articles/`。生成的网站页面与 Markdown 位于同一目录，因此正文中的相对图片路径无需修改。首页是 `index.html`，分类页在 `category/`。基础布局在 `assets/site.css`，品牌配色在 `assets/brand.css`，Logo 在 `assets/gps-logo.jpg`。

## 更新网站

需要 Node.js 20 或更新版本。修改 Markdown 或分类配置后运行：

```sh
npm ci
npm run build
```

提交生成的 HTML 与源文件。分类编号和页面生成逻辑位于 `tools/build-site.mjs`；构建会检查 001–050 是否都被分配到且仅分配到一个分类。部署不需要 Node.js：仓库根目录的 `.nojekyll` 让 GitHub Pages 直接发布静态文件。

网站准备发布时，在仓库 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**、`main`、`/(root)`。预览分支合并前不需要改动 Pages 设置。
