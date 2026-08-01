# sam-site

Personal portfolio site for Sam Cain. React + Vite, no backend, deploys as static files.

Animated canvas hero (starfield above a shoreline, ripples below), then scrollable
Projects and Contact sections.

## Develop

```sh
npm ci
npm run dev
```

Runs at http://localhost:5173.

## Build

```sh
npm run build
npm run preview
```

`npm run build` emits static files to `dist/`. Vite `base` is `"./"`, so the same
build works from a domain root, a GitHub Pages project subpath, or `preview`.

## Lint

```sh
npm run lint
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. Enable it once under
**Settings → Pages → Source → GitHub Actions**.

Netlify and Vercel work with no config: build command `npm run build`, publish
directory `dist`.

## Editing content

- Projects are the `PROJECTS` array in `src/App.jsx`.
- Contact details are the constants at the top of `src/App.jsx`.
- The resume PDF is `public/Sam_Cain_Resume.pdf`; the link is derived from
  `import.meta.env.BASE_URL`, so renaming the file means updating `RESUME_URL`.

## Resume

`public/Sam_Cain_Resume.pdf` is generated, not hand-edited. Edit
`resume/resume.html`, then:

```sh
npm run resume
```

That prints the PDF with headless Chrome or Edge (set `CHROME_PATH` to
override the browser it finds).

The HTML is deliberately ATS-plain: single column, normal document flow, no
tables or text boxes, standard fonts, plain ASCII, and contact details as
labelled text rather than icon glyphs. Keep it that way — an applicant
tracking system reads the extracted text, not the layout. Check changes still
fit one page before committing.

## Layout

```
index.html            page shell, meta tags, favicon link
src/main.jsx          React root
src/App.jsx           hero + projects + contact, all copy and links
src/TopMilkyWay.jsx   upper canvas: stars, meteors, shoreline
src/BottomRipples.jsx lower canvas: expanding ripples
src/styles.css        all styles
public/               static assets copied verbatim into dist/
```

Both canvases stop animating and render a single static frame under
`prefers-reduced-motion: reduce`.
