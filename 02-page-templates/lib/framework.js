#!/usr/env/bin node

import ejs from 'ejs';
import fs from 'fs';
import glob from 'fast-glob';
import liveServer from 'live-server';
import path from 'path';

/* ----- Constants ----- */

const IS_DEV = process.argv.includes('dev');
const DIST_DIR = path.join(process.cwd(), 'dist');
const PAGES_DIR = path.join(process.cwd(), 'content/pages');
const LAYOUTS_DIR = path.join(process.cwd(), 'layouts');

/* ----- References ----- */

// Shared across multiple functions and are populated by update functions.

let layouts = {};

/* ----- Setup ----- */

// Remove existing dist directory and built files
if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
// Create new dist directory
fs.mkdirSync(DIST_DIR);

/* ----- Updaters ----- */

/**
 * Update `layouts` reference. Called on initial build and whenever a layout
 * file is changed.
 */
function updateLayouts() {
  const layoutFiles = glob.sync('**/*.ejs', { cwd: LAYOUTS_DIR });
  layouts = Object.fromEntries(
    layoutFiles.map((filePath) => {
      const layoutName = path.basename(filePath, '.ejs');
      const layout = fs.readFileSync(path.join(LAYOUTS_DIR, filePath), 'utf-8').toString();
      return [layoutName, layout];
    }),
  );
}

/**
 * Function to call when a file changes while development server is running.
 * Determines what to do based on the file that changed.
 *
 * @param {string} fileChanged - Path to file that changed
 * @param {boolean} runUpdateLayouts - Whether to update layouts reference
 */
const updateSite = (fileChanged, runUpdateLayouts = false) => {
  console.log(`File changed: ${fileChanged}`);
  // If layout file changed, rebuild the layouts reference
  if (runUpdateLayouts) updateLayouts();
  // Rebuild the site
  buildSite();
};

/* ----- Builders ----- */

/**
 * Retrieve all page files and build each page. Called on initial build and
 * whenever a source file is changed.
 */
function buildSite() {
  // Get page files
  const pageFiles = glob.sync('**/*.json', { cwd: PAGES_DIR });
  // Build each page
  pageFiles.forEach(buildPage);
  // Provide feedback
  console.log(`Built ${pageFiles.length} pages`);
}

/**
 * Reads page content, runs it through the proper layout, and writes the result
 * to a file in the dist directory.
 *
 * @param {string} relSrcFilePath - Relative path to page file
 */
function buildPage(relSrcFilePath) {
  // Parse page and retrieve layout
  const absSrcFilePath = path.join(PAGES_DIR, relSrcFilePath);
  const rawPageContent = fs.readFileSync(absSrcFilePath, 'utf-8').toString();
  const page = JSON.parse(rawPageContent);
  const layout = layouts[page.layout];
  // Escape if layout doesn't exist
  if (!layout) console.error(`Layout "${page.layout}" not found for page "${relSrcFilePath}"`);
  // Get and set urlPath on page from file path
  const urlPath = relSrcFilePath
    .replace(/\.json$/, '/index.html')
    .replace(/\/index\/index\.html$/, '/index.html')
    .replace(/^index\/index\.html$/, 'index.html');
  // Determine destination file path
  const distFilePath = path.join(DIST_DIR, urlPath);
  // Create directory if it doesn't exist
  const dirPath = path.dirname(distFilePath);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  // Run page through EJS layout and write to file
  const html = ejs.render(layout, { page });
  fs.writeFileSync(distFilePath, html);
}

/* ----- Watchers / Callers ----- */

if (IS_DEV) {
  fs.watch(PAGES_DIR, { recursive: true }, (_, filename) => updateSite(filename));
  fs.watch(LAYOUTS_DIR, { recursive: true }, (_, filename) => updateSite(filename, true));
  liveServer.start({
    port: 3000,
    root: path.relative(process.cwd(), DIST_DIR),
    open: false,
    host: 'localhost',
  });
}

// Do initial build
updateLayouts();
buildSite();
