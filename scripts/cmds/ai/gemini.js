const g = require("fca-aryan-nix");
const a = require("axios");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "gemini",
    aliases: ["ai", "chat"],
    version: "0.0.1",
    author: "Nc-ArYAN",
    countDown: 3,
    usePrefix: true,
    role: 0,
    shortDescription: "Ask Gemini AI (Text or Image)",
    longDescription: "Talk with Gemini AI. Reply to an image to ask about it.",
    category: "AI",
    guide: "/gemini [your question] (Reply to an image to use Vision)"
  },

  ncStart: async function({ api, event, args }) {
    const p = args.join(" ");
    if (!p) return api.sendMessage("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ❌ Please provide a question or prompt.\n╰──────────────╯", event.threadID, event.messageID);

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data && configRes.data.api;
      if (!baseApi) throw new Error("Configuration Error: Missing API in GitHub JSON.");
    } catch (error) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      return api.sendMessage("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Failed to fetch API configuration from GitHub.\n╰──────────────╯", event.threadID, event.messageID);
    }
    
    const apiUrlText = `${baseApi}/gemini`;
    const apiUrlPro = `${baseApi}/gemini-pro`;

    let imageUrl = null;
    let apiUrl;

    if (event.messageReply && event.messageReply.attachments.length > 0) {
      const replyAttachment = event.messageReply.attachments[0];
      if (['photo', 'sticker', 'animated_image'].includes(replyAttachment.type)) {
        imageUrl = replyAttachment.url;
      }
    }
    else if (event.attachments.length > 0) {
      const msgAttachment = event.attachments[0];
      if (['photo', 'sticker', 'animated_image'].includes(msgAttachment.type)) {
        imageUrl = msgAttachment.url;
      }
    }

    try {
      if (imageUrl) {
        apiUrl = `${apiUrlPro}?prompt=${encodeURIComponent(p)}&url=${encodeURIComponent(imageUrl)}`;
      } else {
        apiUrl = `${apiUrlText}?prompt=${encodeURIComponent(p)}`;
      }

      const r = await a.get(apiUrl);
      const reply = r.data?.response;
      if (!reply) throw new Error("No response from Gemini API.");

      api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, i) => {
        if (!i) return;
        if (!imageUrl) {
          global.noobCore.ncReply.set(i.messageID, { commandName: this.config.name, author: event.senderID });
        }
      }, event.messageID);

    } catch (e) {
      console.error("Gemini Command Error:", e.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ⚠ Gemini API a somossa hoyeche.\n╰──────────────╯", event.threadID, event.messageID);
    }
  },

  ncReply: async function({ api, event, Reply }) {
    if ([api.getCurrentUserID()].includes(event.senderID)) return;
    const p = event.body;
    if (!p) return;

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data && configRes.data.api;
      if (!baseApi) throw new Error("Configuration Error: Missing API in GitHub JSON.");
    } catch (error) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      return api.sendMessage("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Failed to fetch API configuration from GitHub.\n╰──────────────╯", event.threadID, event.messageID);
    }

    const apiUrlText = `${baseApi}/gemini`;
    
    try {
      const r = await a.get(`${apiUrlText}?prompt=${encodeURIComponent(p)}`);
      const reply = r.data?.response;
      if (!reply) throw new Error("No response from Gemini API.");

      api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, i) => {
        if (!i) return;
        global.GoatBot.onReply.set(i.messageID, { commandName: this.config.name, author: event.senderID });
      }, event.messageID);

    } catch (e) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      api.sendMessage("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ⚠ Gemini API er response dite somossa hocchhe.\n╰──────────────╯", event.threadID, event.messageID);
    }
  }
};