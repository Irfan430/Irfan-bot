const axios = require("axios");
const fs = require("fs");
const yts = require("yt-search");

const RENDER_API = "https://yt-api-2.onrender.com/download";

module.exports = {
  config: {
    name: "song",
    version: "4.3.0",
    author: "NC-TOSHIRO",
    category: "media",
    cooldown: 5,
    role: 0,
    shortDescription: "Download audio from YouTube",
    usages: "{usePrefix}song [name or link]",
    usePrefix: true
  },

  ncStart: async function ({ api, event, args, message }) {
    if (!args[0])
      return message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ❄️ Please provide a song name or YouTube link.\n╰──────────────╯");

    await api.setMessageReaction("🎧", event.messageID, event.threadID);

    const waitMsg = await api.sendMessage(
      "⏳ Downloading your song, please wait…",
      event.threadID
    );

    try {
      let video;

      if (/youtu\.?be/.test(args.join(" "))) {
        const search = await yts(args.join(" "));
        video = search.videos[0];
      } else {
        const search = await yts(args.join(" "));
        if (!search.videos.length) {
          await api.unsendMessage(waitMsg.messageID);
          return message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ❌ No results found.\n╰──────────────╯");
        }
        video = search.videos[0];
      }

      const { data } = await axios.get(
        `${RENDER_API}?url=${encodeURIComponent(video.url)}`
      );

      if (!data.success || !data.url) {
        await api.unsendMessage(waitMsg.messageID);
        return message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Download failed.\n╰──────────────╯");
      }

      const audio = await axios.get(data.url, { responseType: "arraybuffer" });
      const fileName = `audio_${Date.now()}.mp3`;
      fs.writeFileSync(fileName, Buffer.from(audio.data));

      try { await api.unsendMessage(waitMsg.messageID); } catch {}

      await api.sendMessage({
        body: `🎵 ${video.title}`,
        attachment: fs.createReadStream(fileName)
      }, event.threadID);

      fs.unlinkSync(fileName);
      await api.setMessageReaction("✅", event.messageID, event.threadID);

    } catch (err) {
      try { await api.unsendMessage(waitMsg.messageID); } catch {}
      message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ⚠️ Error while downloading song.\n╰──────────────╯");
    }
  },

  ncPrefix: async function () {},

  ncReply: async function () {}
};