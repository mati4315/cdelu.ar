const axios = require('axios');
const config = require('../config/default');

class AIService {
    constructor() {
        this.apiKey = config.deepseek.apiKey;
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    }

    /**
     * Genera un resumen de texto usando DeepSeek
     * @param {string} text Texto a resumir
     * @returns {Promise<string>} Resumen generado
     */
    async generateSummary(text) {
        try {
            const response = await axios.post(this.apiUrl, {
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un asistente que resume noticias de manera concisa y objetiva.'
                    },
                    {
                        role: 'user',
                        content: `Por favor, resume el siguiente texto en un párrafo corto: ${text}`
                    }
                ],
                max_tokens: 150
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error al generar resumen con DeepSeek:', error);
            throw error;
        }
    }

    async generateTitle(content) {
        try {
            const response = await axios.post(
                this.apiUrl,
                {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un experto en crear títulos limpios y directos para noticias. El título debe ser conciso, sin signos de exclamación, sin puntos finales, y sin caracteres especiales. Debe capturar la esencia de la noticia en un máximo de 10 palabras."
                        },
                        {
                            role: "user",
                            content: `Crea un título limpio y directo para la siguiente noticia:\n\n${content}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 100
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Limpiar el título generado
            let title = response.data.choices[0].message.content.trim();
            
            // Eliminar signos de puntuación al final
            title = title.replace(/[.!?]+$/, '');
            
            // Eliminar comillas si existen
            title = title.replace(/^["']|["']$/g, '');
            
            // Eliminar espacios extra
            title = title.replace(/\s+/g, ' ').trim();
            
            // Limitar a 10 palabras
            title = title.split(' ').slice(0, 10).join(' ');

            return title;
        } catch (error) {
            console.error('Error al generar título con DEEPSEEK:', error.message);
            throw error;
        }
    }
}

module.exports = new AIService(); 