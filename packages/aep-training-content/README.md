# AEP training content package

`aep-training-content-1.0.1.zip` is an AEM content package (FileVault) with the NovaMart training site
for Universal Editor / Edge Delivery Services:

| Path | Content |
| --- | --- |
| `/content/aep-training` | 57 pages: the 30 core pages, 23 extra product detail pages, 2 extra articles, plus the `nav` and `footer` fragments |
| `/content/dam/aep-training/images` | 109 images (products, scenes, avatars, logo) as JPEG/PNG DAM assets |

Pages use the `core/franklin` components (`page`, `root`, `section`, `block`, `block/item`,
`columns`, `text`, `title`, `image`). Block properties follow the models in
`component-models.json`. Page properties hold the analytics fields (template `aep-training`,
page type, category, product fields and so on). Section properties hold the Target fields
(Target Location, Audience, Activity, Activity Type, Experience, Campaign ID).

## Install

1. **Check the filter first.** The package uses the default *replace* mode on `/content/aep-training`
   and `/content/dam/aep-training`. Anything already under those paths is replaced.
2. AEM author > **Tools > Deployment > Packages** > *Upload Package* > choose the zip > **Install**.
3. Check the site root's **Cloud Configuration** (`cq:conf`). The package sets it to
   `/conf/aep-training`. That configuration (Tools > Cloud Services > Edge Delivery Services
   Configuration) must point to GitHub owner `sravaneds`, repository `frescopa-eds-analytics`, and the
   branch that contains the training code (`feature/aep-training-site` until the pull request is
   merged, then `main`). For a different configuration, rebuild with `--conf` (see below).
   The repo's `head.html` and `config.json` point to the author instance `author-p220207-e2271469`.
4. In Assets, select `/content/dam/aep-training/images` > **Reprocess Assets**. Packages don't
   trigger asset processing, so thumbnails and renditions are created only after this step.
5. Open `/content/aep-training` in Universal Editor and check a few pages. Then use **Publish >
   Preview** (or Quick Publish) for the site, so it is available at
   `https://<branch>--frescopa-eds-analytics--sravaneds.aem.page/aep-training/`.

## Things to verify after the first install

These parts of the mapping are based on the standard XWalk structure and haven't been tested
against your author instance yet:

- **Columns** use `columns/v1/columns > row > column` child nodes (footer, trust badges, contact, tiers).
- **Product Info gallery** stores several images in one multi-value `images` property.
- **In-page anchors** (`#customer-reviews`, `#all-deals`, `#shop-the-season`) rely on the generated
  heading IDs.

## Rebuild

```sh
node tools/aep-training/generate.mjs        # regenerate the preview pages + manifest
node tools/aep-training/build-package.mjs   # build this zip
node tools/aep-training/build-package.mjs --conf /conf/my-site --version 1.0.2
```

The builder reads `content/aep-training/**/*.plain.html` (via `tools/aep-training/manifest.json`)
and the rendered images in `tools/aep-training/assets/`. The expanded package is written to `build/`,
which is not committed.
