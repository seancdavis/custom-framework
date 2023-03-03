#!/usr/env/bin node

import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const IS_DEV = process.argv.includes('dev');
const SRC_DIR = path.join(process.cwd(), 'src');
const DIST_DIR = path.join(process.cwd(), 'dist');
const CONTENT_FILE = path.join(SRC_DIR, 'content.json');
const LAYOUT_FILE = path.join(SRC_DIR, 'layout.ejs');

// Prepare dist directory
if (fs.existsSync(DIST_DIR)) fs.rmSync(DIST_DIR, { recursive: true, force: true });
fs.mkdirSync(DIST_DIR);

function buildPage(page, layout) {
  const urlPath = page.urlPath + (page.urlPath.endsWith('/') ? 'index' : '') + '.html';
  const filePath = path.join(DIST_DIR, urlPath);
  // Create directory if it doesn't exist
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  // Run page through EJS layout and write to file
  const html = ejs.render(layout, { ...page });
  fs.writeFileSync(filePath, html);
}

function buildSite() {
  // Read and parse content file
  const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8').toString());
  // Read layout file
  const layout = fs.readFileSync(LAYOUT_FILE, 'utf-8').toString();
  // Build each page
  content.pages.forEach((page) => buildPage(page, layout));
  // Provide feedback
  console.log(`Built ${content.pages.length} pages`);
}

// In dev mode, watch for changes to content.json and rebuild
if (IS_DEV) {
  fs.watch(SRC_DIR, { recursive: true }, () => {
    console.log('Detected file change. Rebuilding ...');
    buildSite();
  });
}

// Do initial build
buildSite();
