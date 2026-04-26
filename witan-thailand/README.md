# Witan Thailand — Website

Static, responsive multi-page site for Witan Thailand (위튼컴퍼니 태국 법인).

## Structure

```
witan-thailand/
├── index.html              Home
├── about.html              About / company story
├── services.html           Services overview (links to 6 detail pages)
├── services/
│   ├── rnd.html            01 · R&D · Ingredient Development
│   ├── materials.html      02 · Material Sales
│   ├── oem.html            03 · OEM/ODM Small-Batch Platform
│   ├── fda.html            04 · Thai FDA Registration
│   ├── clinical.html       05 · Korean Clinical Testing
│   └── logistics.html      06 · Korea → Thailand Logistics
├── process.html            8-step workflow
├── contact.html            Contact info + form
├── css/style.css           All styles
├── js/
│   ├── layout.js           Injects shared header/footer; expands data-i18n-svc
│   ├── i18n.js             Loads /locales/<lang>.json and applies translations
│   └── main.js             Mobile nav toggle, active link, form handler
├── locales/
│   ├── th.json             Thai (default)
│   ├── en.json             English
│   └── ko.json             Korean
└── assets/                 Images
```

## i18n

Every translatable element uses `data-i18n="path.to.key"`. The user's selected
language is stored in `localStorage["witan_lang"]`; switch via the **TH / EN / KO**
buttons in the header. Default = Thai.

Service detail pages use a shorthand: `data-i18n-svc="title"` on a page with
`<body data-service="rnd">` resolves to `services.rnd.title`. This lets the six
detail pages share a single template.

## Local development

```bash
cd witan-thailand
python3 -m http.server 8000
# open http://127.0.0.1:8000/
```

A static server is required because `i18n.js` `fetch()`-es JSON files; opening
the HTML directly via `file://` will not work.

## Deploy

Copy the entire `witan-thailand/` directory to any static host
(Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, etc). No build step.

## Editing content

All copy lives in `locales/{th,en,ko}.json`. Edit the same key in all three
files to keep languages in sync.
