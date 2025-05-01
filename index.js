const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TWIXOR_WEBHOOK_URL = 'https://mycustombot.com/api/receive-whatsapp-data';

app.get('/', (req, res) => {
  res.send('Webhook is live');
});

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

      console.log('Forwarded to Twixor:', payload);
      res.sendStatus(200);
    } else {
      res.sendStatus(200);
    }
  } catch (err) {
    console.error('Error:', err.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
