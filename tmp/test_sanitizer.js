"use strict";

const { sanitizeBasicHtml } = require('../src/utils/sanitizer');

const testHtml = `
  <div>
    <h1>Título</h1>
    <p>Este es un <b>test</b> con <a href="https://example.com" onclick="alert('xss')">link</a></p>
    <br/>
    <script>alert('dangerous')</script>
    <p>Más <strong>contenido</strong> permitido.</p>
    <iframe src="malicious"></iframe>
  </div>
`;

const result = sanitizeBasicHtml(testHtml);
console.log("--- ORIGINAL ---");
console.log(testHtml);
console.log("--- SANITIZADO ---");
console.log(result);

if (result.includes('<script>') || result.includes('onclick') || result.includes('iframe')) {
  console.error("❌ FALLÓ: El sanitizador no eliminó contenido peligroso");
} else if (result.includes('<b>') && result.includes('<strong>') && result.includes('<h1>')) {
  console.log("✅ ÉXITO: El sanitizador mantuvo las etiquetas básicas");
} else {
  console.log("⚠️ REVISAR: Algunos tags esperados no están.");
}
