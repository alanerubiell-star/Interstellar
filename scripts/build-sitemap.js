#!/usr/bin/env node
'use strict';
/* Genera public/sitemap.xml y public/robots.txt recorriendo el sitio.
   Se ejecuta solo en cada build de Netlify (ver netlify.toml). */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'public');

/* El dominio sale de config.js para no tenerlo escrito en dos lugares. */
function dominio() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const cfg = fs.readFileSync(path.join(RAIZ, 'assets', 'js', 'config.js'), 'utf8');
  const m = cfg.match(/siteUrl:\s*'([^']+)'/);
  return (m ? m[1] : 'https://cotiza.app').replace(/\/+$/, '');
}

function paginas(dir, base) {
  base = base || '';
  let out = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.name.startsWith('.') || item.name === 'assets') continue;
    const abs = path.join(dir, item.name);
    if (item.isDirectory()) {
      out = out.concat(paginas(abs, base + '/' + item.name));
    } else if (item.name.endsWith('.html')) {
      if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(fs.readFileSync(abs, 'utf8'))) continue;
      const url = item.name === 'index.html' ? base + '/' : base + '/' + item.name;
      out.push({ url, mtime: fs.statSync(abs).mtime });
    }
  }
  return out;
}

const sitio = dominio();
const lista = paginas(RAIZ).sort((a, b) => a.url.localeCompare(b.url));

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  lista.map((p) =>
    '  <url>\n' +
    '    <loc>' + sitio + p.url + '</loc>\n' +
    '    <lastmod>' + p.mtime.toISOString().slice(0, 10) + '</lastmod>\n' +
    '    <priority>' + (p.url === '/' ? '1.0' : p.url === '/app.html' ? '0.9' : '0.7') + '</priority>\n' +
    '  </url>\n'
  ).join('') +
  '</urlset>\n';

fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), xml);

fs.writeFileSync(
  path.join(RAIZ, 'robots.txt'),
  'User-agent: *\nAllow: /\nDisallow: /gracias.html\n\nSitemap: ' + sitio + '/sitemap.xml\n'
);

console.log('sitemap.xml con ' + lista.length + ' páginas → ' + sitio);
