require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint para receber o Webhook da Hotmart
app.post('/webhook', async (req, res) => {
    try {
        const eventData = req.body;
        console.log('Recebido Webhook da Hotmart:', eventData);

        // Transformar os dados da Hotmart para o formato da Conversions API
        const fbEvent = {
            event_name: "Purchase",
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            user_data: {
                em: [hashEmail(eventData.buyer.email)] // Hash do email para o Facebook
            },
            custom_data: {
                value: eventData.price.amount,
                currency: eventData.price.currency,
                content_name: eventData.product.name
            }
        };

        // Enviar evento para o Facebook Conversions API
        const fbResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.FB_PIXEL_ID}/events?access_token=${process.env.FB_ACCESS_TOKEN}`,
            { data: [fbEvent] }
        );

        console.log('Resposta do Facebook:', fbResponse.data);
        res.status(200).send({ success: true, message: 'Evento enviado ao Facebook' });
    } catch (error) {
        console.error('Erro ao processar Webhook:', error);
        res.status(500).send({ success: false, message: 'Erro interno' });
    }
});

// Função para hashear o email (SHA256) para o Facebook Conversions API
const crypto = require('crypto');
function hashEmail(email) {
    return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
