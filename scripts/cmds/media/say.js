const fs = require("fs");
const axios = require("axios");
const googleTTS = require("google-tts-api");

module.exports = {
  config: {
    name: "say",
    aliases: ["speak"],
    version: "1.0",
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴",
    team: "NoobCore",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Convert text to Bangla voice"
    },
    longDescription: {
      en: "Bot will speak your text in Bangla using Google TTS"
    },
    guide: {
      en: "{pn} <your Bangla text> → e.g. {pn} আমি ভালো আছি"
    }
  },

  ncStart: async function ({ args, message }) {
    const text = args.join(" ").trim();
    if (!text) return message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ⚠️ Please provide some Bangla text to speak!\n╰──────────────╯");

    try {
  
      const url = googleTTS.getAudioUrl(text, {
        lang: 'bn',
        slow: false,
        host: 'https://translate.google.com'
      });

  
      const tempPath = `${__dirname}/voice.mp3`;
      const res = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(tempPath, Buffer.from(res.data));

      await message.reply({
        body: `🔊 Voice Output: ${text}`,
        attachment: fs.createReadStream(tempPath)
      });

      fs.unlinkSync(tempPath);

    } catch (err) {
      console.error("❌ Say command error:", err);
      message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Failed to generate voice!\n╰──────────────╯");
    }
  }
};