const axios = require('axios');

/**
 * Genera un resumen de texto usando DeepSeek
 * @param {string} text Texto a resumir
 * @returns {Promise<string>} Resumen generado
 */
async function generateSummary(text) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
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
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar resumen con DeepSeek:', error);
        throw error;
    }
}

/**
 * Genera un nuevo título para una noticia
 * @param {string} description Descripción de la noticia
 * @returns {Promise<string>} Título generado
 */
async function generateTitle(description) {
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un editor de noticias que crea títulos atractivos y precisos.'
                },
                {
                    role: 'user',
                    content: `Crea un título atractivo para esta noticia: ${description}`
                }
            ],
            max_tokens: 50
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al generar título con DeepSeek:', error);
        throw error;
    }
}

module.exports = {
    generateSummary,
    generateTitle
}; 