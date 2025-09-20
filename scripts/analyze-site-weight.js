#!/usr/bin/env node
"use strict";

/**
 * Analizador de peso del sitio (estático) y simulación de tráfico.
 *
 * - Escanea directorios públicos (por defecto: public/ y deploy/public/)
 * - Para cada archivo HTML: parsea assets locales (JS, CSS, IMG, VIDEO/SOURCE)
 * - Calcula tamaños por página (HTML + assets) y totales
 * - Simula 100 usuarios (primera visita = todo; con caché = solo HTML como aproximación)
 *
 * Nota: Esta es una aproximación basada en assets estáticos locales. No considera
 * peticiones dinámicas, fuentes externas (CDN), ni headers de caché reales.
 */

const fs = require("fs");
const path = require("path");

/**
 * Convierte bytes a una cadena legible (KB/MB/GB) con 2 decimales.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let n = bytes;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx += 1;
  }
  return `${n.toFixed(2)} ${units[idx]}`;
}

/**
 * Lee un archivo de forma segura, devolviendo cadena vacía si falla.
 * @param {string} filePath
 * @returns {string}
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_err) {
    return "";
  }
}

/**
 * Obtiene el tamaño de un archivo si existe; si no, 0.
 * @param {string} filePath
 * @returns {number}
 */
function getFileSize(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) return stat.size;
    return 0;
  } catch (_err) {
    return 0;
  }
}

/**
 * Determina si una URL es externa (http, https, //) o data URI.
 * @param {string} url
 * @returns {boolean}
 */
function isExternalUrl(url) {
  const u = url.trim();
  return (
    u.startsWith("http://") ||
    u.startsWith("https://") ||
    u.startsWith("//") ||
    u.startsWith("data:")
  );
}

/**
 * Normaliza una ruta de asset relativa a un HTML en base a su directorio público.
 * Soporta rutas absolutas "/..." interpretadas relativas a la raíz del directorio base.
 * @param {string} assetRef Ruta encontrada en el HTML (src/href)
 * @param {string} htmlFile Ruta absoluta del HTML
 * @param {string} basePublicDir Directorio público base (absoluto)
 * @returns {string|null} Ruta absoluta del asset o null si es externa/no válida
 */
function resolveAssetPath(assetRef, htmlFile, basePublicDir) {
  if (!assetRef || isExternalUrl(assetRef)) return null;
  // Quitar querystring/hash
  const clean = assetRef.split("?")[0].split("#")[0];
  if (!clean) return null;

  if (clean.startsWith("/")) {
    return path.join(basePublicDir, clean);
  }
  // Relativo al HTML
  const htmlDir = path.dirname(htmlFile);
  return path.resolve(htmlDir, clean);
}

/**
 * Extrae referencias de assets relevantes desde el HTML (JS, CSS, IMG, VIDEO/SOURCE, LINK rel=favicon)
 * @param {string} htmlContent
 * @returns {Array<{attr: string, value: string, tag: string}>}
 */
function extractAssetRefs(htmlContent) {
  const refs = [];
  const pushAll = (regex, tag, attr) => {
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const value = match[1] || match[2] || match[3] || "";
      if (value) refs.push({ attr, value, tag });
    }
  };

  // <script src="...">
  pushAll(/<script[^>]*?src=["']([^"']+)["'][^>]*?>/gi, "script", "src");
  // <link rel="stylesheet" href="..."> o cualquier link con href a .css
  pushAll(/<link[^>]*?href=["']([^"']+\.css)(?:\?[^"']*)?["'][^>]*?>/gi, "link", "href");
  // <img src="...">
  pushAll(/<img[^>]*?src=["']([^"']+)["'][^>]*?>/gi, "img", "src");
  // <video src="...">
  pushAll(/<video[^>]*?src=["']([^"']+)["'][^>]*?>/gi, "video", "src");
  // <source src="..."> (para video/audio)
  pushAll(/<source[^>]*?src=["']([^"']+)["'][^>]*?>/gi, "source", "src");
  // <link rel="icon" href="..."> (favicons)
  pushAll(/<link[^>]*?rel=["'](?:icon|shortcut icon)["'][^>]*?href=["']([^"']+)["'][^>]*?>/gi, "link", "href");

  return refs;
}

/**
 * Clasifica un archivo por tipo simple para el resumen.
 * @param {string} filePath
 * @returns {"html"|"js"|"css"|"image"|"video"|"other"}
 */
function classifyByExtension(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".html", ".htm"].includes(ext)) return "html";
  if (ext === ".js") return "js";
  if (ext === ".css") return "css";
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico"].includes(ext)) return "image";
  if ([".mp4", ".webm", ".ogg", ".mp3"].includes(ext)) return "video";
  return "other";
}

/**
 * Analiza un directorio público y devuelve métricas por página HTML.
 * @param {string} basePublicDir Directorio público absoluto
 * @returns {Array}
 */
function analyzePublicDir(basePublicDir) {
  /** @type {Array<{pagePath: string, htmlSize: number, assets: Array<{path: string, size: number, type: string}>, totals: {html: number, js: number, css: number, image: number, video: number, other: number, all: number}}>} */
  const results = [];

  if (!fs.existsSync(basePublicDir) || !fs.statSync(basePublicDir).isDirectory()) {
    return results;
  }

  // Buscar HTMLs en el nivel superior del public (sin recursión para simplicidad)
  const entries = fs.readdirSync(basePublicDir, { withFileTypes: true });
  const htmlFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".html"))
    .map((e) => path.join(basePublicDir, e.name));

  for (const htmlFile of htmlFiles) {
    const htmlContent = safeReadFile(htmlFile);
    const htmlSize = getFileSize(htmlFile);
    const refs = extractAssetRefs(htmlContent);

    /** @type {Map<string, {path: string, size: number, type: string}>} */
    const assetsMap = new Map();

    for (const ref of refs) {
      const resolved = resolveAssetPath(ref.value, htmlFile, basePublicDir);
      if (!resolved) continue;
      // Normalizar para evitar duplicados por separador
      const normalized = path.normalize(resolved);
      if (assetsMap.has(normalized)) continue;
      const size = getFileSize(normalized);
      const type = classifyByExtension(normalized);
      assetsMap.set(normalized, { path: normalized, size, type });
    }

    const assets = Array.from(assetsMap.values());
    const totals = {
      html: htmlSize,
      js: 0,
      css: 0,
      image: 0,
      video: 0,
      other: 0,
      all: 0,
    };

    for (const a of assets) {
      totals[a.type] += a.size;
      totals.all += a.size;
    }

    // Incluir el peso del HTML en el total general de página
    totals.all += htmlSize;

    results.push({ pagePath: htmlFile, htmlSize, assets, totals });
  }

  return results;
}

/**
 * Imprime un reporte conciso para un conjunto de resultados de análisis.
 * @param {string} label
 * @param {ReturnType<typeof analyzePublicDir>} results
 */
function printReport(label, results) {
  console.log(`\n=== ${label} ===`);
  if (!results.length) {
    console.log("(Sin páginas HTML encontradas)");
    return;
  }

  let grandTotal = 0;
  for (const r of results) {
    const pageName = path.basename(r.pagePath);
    const firstVisitBytes = r.totals.all;
    const cachedVisitBytes = r.htmlSize; // Aproximación: sólo HTML con caché
    grandTotal += firstVisitBytes;

    console.log(`\n- Página: ${pageName}`);
    console.log(`  Ruta: ${r.pagePath}`);
    console.log(`  Peso HTML: ${formatBytes(r.htmlSize)} (${r.htmlSize} B)`);
    console.log(
      `  Assets -> JS: ${formatBytes(r.totals.js)}, CSS: ${formatBytes(r.totals.css)}, IMG: ${formatBytes(r.totals.image)}, VIDEO: ${formatBytes(r.totals.video)}, OTROS: ${formatBytes(r.totals.other)}`
    );
    console.log(`  Total primera visita: ${formatBytes(firstVisitBytes)} (${firstVisitBytes} B)`);
    console.log(`  Total visita con caché: ${formatBytes(cachedVisitBytes)} (${cachedVisitBytes} B)`);

    // Simulación 100 usuarios
    const users = 100;
    const totalFirst100 = firstVisitBytes * users;
    const totalCached100 = cachedVisitBytes * users;
    console.log(`  Simulación x${users} (primera visita): ${formatBytes(totalFirst100)} (${totalFirst100} B)`);
    console.log(`  Simulación x${users} (con caché): ${formatBytes(totalCached100)} (${totalCached100} B)`);
  }

  console.log(`\nTotal acumulado (suma de primeras visitas de todas las páginas): ${formatBytes(grandTotal)} (${grandTotal} B)`);
}

function main() {
  // Directorios objetivo
  const roots = [
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "deploy", "public"),
  ];

  for (const root of roots) {
    const label = path.relative(process.cwd(), root) || root;
    try {
      const results = analyzePublicDir(root);
      printReport(label, results);
    } catch (err) {
      console.error(`Error analizando ${label}:`, err && err.message ? err.message : err);
    }
  }
}

main();


