const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const VERIFY_TOKEN = 'twixor123'; // Your chosen verify token
const TWIXOR_WEBHOOK_URL = 'http://10.250.55.21/chatbird/message/65dd9d293c3214123502a69f/send'; // Twixor endpoint to forward responses

app.use(bodyParser.json());

// ✅ Webhook verification route
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// 📥 Route to receive WhatsApp flow completion data
app.post('/webhook', async (req, res) => {
  try {
    console.log('📥 Incoming request body:', JSON.stringify(req.body, null, 2));

    const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || !Array.isArray(messages)) {
      console.log('⚠️ No messages found');
      return res.status(200).send('No messages in payload');
    }

    const message = messages[0];
    const from = message?.from;
    const flowResponses = message?.flow_completion?.responses;

    if (!flowResponses) {
      console.log('⚠️ No flow_completion data found');
      return res.status(200).send('No flow responses');
    }

    // Format payload to send to Twixor
    const dataToSend = {
      mobile: from,
      variables: {}
    };

    flowResponses.forEach((item, index) => {
      dataToSend.variables[`q${index + 1}`] = item.answer;
    });

    console.log('➡️ Forwarding to Twixor:', JSON.stringify(dataToSend));

    // Send to Twixor endpoint
    await axios.post(TWIXOR_WEBHOOK_URL, dataToSend);

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error handling webhook:', err.message);
    res.sendStatus(500);
  }
});

// 🚀 Start server
app.listen(port, () => {
  console.log(`🟢 Server running at https://whatsapp-twixor-webhook.onrender.com on port ${port}`);
});
