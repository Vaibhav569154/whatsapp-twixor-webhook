const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

const VERIFY_TOKEN = 'twixor123'; // Your verify token

app.use(bodyParser.json());

// ✅ Webhook verification (for Facebook Developer setup)
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

// 📥 Webhook POST: receive flow completion data
app.post('/webhook', (req, res) => {
  try {
    console.log('📥 Incoming payload:', JSON.stringify(req.body, null, 2));

    const messages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(200).json({ message: 'No messages found' });
    }

    const flowResponses = messages[0]?.flow_completion?.responses;
    if (!flowResponses) {
      return res.status(200).json({ message: 'No flow responses found' });
    }

    const from = messages[0]?.from;
    const formatted = {
      mobile: from,
      responses: flowResponses.map(item => ({
        name: item.name,
        answer: item.answer
      }))
    };

    console.log('✅ Parsed responses:', JSON.stringify(formatted, null, 2));

    // Return JSON back to client
    res.status(200).json(formatted);
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🟢 Webhook server listening on port ${port}`);
});
