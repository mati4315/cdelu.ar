"use strict";

/**
 * Sanitizador de HTML muy básico para permitir solo etiquetas seguras
 * @param {string} html El HTML a sanitizar
 * @returns {string} HTML sanitizado
 */
function sanitizeBasicHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // Lista de etiquetas permitidas (regex-friendly)
  // b, strong, i, em, u, p, br, ul, ol, li, a, span, h1-h6, div, blockquote, img
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'img'];
  
  // 1. Eliminar scripts, estilos, iframes, etc. completamente (etiqueta y contenido)
  let clean = html.replace(/<(script|style|iframe|object|embed|form)[^>]*>([\s\S]*?)<\/\1>/gi, '');
  
  // 2. Eliminar atributos peligrosos como onmouseover, onclick, etc.
  clean = clean.replace(/\s+on\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\s+on\w+\s*=\s*[^"'\s>]+/gi, '');
  
  // 3. Eliminar href que empiecen con javascript:
  clean = clean.replace(/href\s*=\s*(['"])javascript:.*?\1/gi, 'href="#"');
  
  // 4. Filtrar etiquetas no permitidas pero mantener su contenido
  const tagRegex = /<\/?([a-z0-9]+)[^>]*>/gi;
  clean = clean.replace(tagRegex, (match, tagName) => {
    return allowedTags.includes(tagName.toLowerCase()) ? match : '';
  });

  return clean;
}

module.exports = {
  sanitizeBasicHtml
};
