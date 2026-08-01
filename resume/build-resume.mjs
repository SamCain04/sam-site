// Renders resume/resume.html to public/Sam_Cain_Resume.pdf using headless
// Chrome or Edge. Keeping an HTML source in the repo is the point: the previous
// PDF had no source in version control, so a LaTeX "70%" that silently
// commented out the rest of its line shipped as "70Tested" and stayed there.
//
// Usage: npm run resume
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "resume.html");
const output = resolve(here, "..", "public", "Sam_Cain_Resume.pdf");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

const browser = CANDIDATES.find((p) => existsSync(p));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to a browser binary.");
  process.exit(1);
}

if (!existsSync(source)) {
  console.error(`Missing resume source: ${source}`);
  process.exit(1);
}

mkdirSync(dirname(output), { recursive: true });

execFileSync(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    // Chrome otherwise stamps the date and file URL into the page margins,
    // which an ATS reads as part of the document text.
    "--no-pdf-header-footer",
    `--print-to-pdf=${output}`,
    pathToFileURL(source).href
  ],
  { stdio: "inherit" }
);

console.log(`Wrote ${output}`);
