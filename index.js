const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// To parse JSON bodies
app.use(bodyParser.json());

// Replace this with your token
const VERIFY_TOKEN = "twixor123";

// Facebook webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified with Meta!");
    res.status(200).send(challenge);
  } else {
    console.log("❌ Webhook verification failed.");
    res.sendStatus(403);
  }
});

// Handle incoming webhook POST (message or flow submission)
app.post('/webhook', (req, res) => {
  console.log("📨 Received webhook data:");
  console.log(JSON.stringify(req.body, null, 2)); // Log to Render logs

  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages;

  if (messages && messages[0]?.interactive?.type === "flow_submission") {
    const flowSubmission = messages[0].interactive.flow_submission;
    const responses = flowSubmission.responses;

    console.log("✅ FLOW SUBMISSION RECEIVED:");
    console.log(JSON.stringify(responses, null, 2));
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
