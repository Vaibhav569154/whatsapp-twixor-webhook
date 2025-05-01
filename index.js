const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'twixor123'; // You can set any token you want here
const TWIXOR_WEBHOOK_URL = 'https://whatsapp-twixor-webhook.onrender.com'; // replace if needed

// 🟢 Meta Webhook Verification Handler
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Verification failed');
    res.sendStatus(403);
  }
});

// 🔁 Main WhatsApp Flow Handling
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const message = entry?.changes?.[0]?.value?.messages?.[0];

    if (message?.type === 'flow_completion') {
      const userPhone = message.from;
      const responses = message.flow_completion?.responses || [];

      const payload = {
        mobile: userPhone,
        variables: {}
      };

      responses.forEach((r, i) => {
        payload.variables[`q${i + 1}`] = Array.isArray(r.answer)
          ? r.answer.join(', ')
          : r.answer;
      });

      await axios.post(TWIXOR_WEBHOOK_URL, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('✅ Forwarded to Twixor:', payload);
      res.sendStatus(200);
    } else {
      res.sendStatus(200); // Not a flow message
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
