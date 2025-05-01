const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "twixor123";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

app.post("/webhook", (req, res) => {
  console.log("📨 FULL INCOMING BODY:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const messages = change?.value?.messages;

    if (messages && messages[0]?.interactive?.type === "nfm_reply") {
      const rawJson = messages[0].interactive.nfm_reply.response_json;
      const parsed = JSON.parse(rawJson);

      console.log("✅ PARSED FLOW RESPONSE:");
      console.log(JSON.stringify(parsed, null, 2));
    }
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
