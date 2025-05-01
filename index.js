const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Webhook verification endpoint for Facebook
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

// Webhook to handle incoming data from WhatsApp Flow
app.post("/webhook", (req, res) => {
  console.log("📨 FULL INCOMING BODY:");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const messages = change?.value?.messages;
    const contact = change?.value?.contacts?.[0];

    // Ensure that it's an interactive message and a response from the flow (nfm_reply)
    if (messages && messages[0]?.interactive?.type === "nfm_reply") {
      const fromNumber = messages[0].from || contact?.wa_id || "Unknown";
      const rawJson = messages[0].interactive.nfm_reply.response_json;
      const parsed = JSON.parse(rawJson);

      // Capture responses from each screen (question) and ensure that the data exists
      const screen1Response = parsed["screen_1_Choose_one_0"] || "No selection";
      const screen2Response = parsed["screen_2_Choose_all_that_apply_0"] || "No selection";
      const screen3Response = parsed["screen_3_Choose_one_0"] || "No selection";

      console.log("✅ Parsed WhatsApp Flow Response from:", fromNumber);
      console.log(`Screen 1 Response: ${screen1Response}`);
      console.log(`Screen 2 Response: ${screen2Response}`);
      console.log(`Screen 3 Response: ${screen3Response}`);

      // Return the parsed responses in a structured JSON format
      return res.status(200).json({
        status: "success",
        from: fromNumber,
        responses: {
          screen_1: screen1Response,
          screen_2: screen2Response,
          screen_3: screen3Response
        }
      });
    } else {
      // In case the message is not an nfm_reply type
      console.log("ℹ️ Not an nfm_reply message.");
      return res.status(200).json({ status: "ignored", reason: "not an nfm_reply" });
    }
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return res.status(500).json({ status: "error", error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
