const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ytstalk",
    aliases: ["ytinfo"],
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴",
    team: "NoobCore",
    version: "1.0",
    role: 0,
    countDown: 5,
    description: "Fetch YouTube channel info including subscribers, views, join date, description, thumbnail.",
    guide: "{p}ytstalk <channelName>"
  },

  ncStart: async function ({ api, event, args }) {
    const channelName = args.join(" ").trim();

    const FONT_URL = "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/ncsfont.json";
    const fontRes = await axios.get(FONT_URL);
    const fontMap = fontRes.data;

    const applyFont = (text) => text.split("").map(c => {
      if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z") || (c >= "0" && c <= "9")) return fontMap[c] || c;
      return c;
    }).join("");

    if (!channelName) {
      return api.sendMessage(
        applyFont("⚠️ Please provide a YouTube channel name.\nUsage: /ytstalk MrBeast"),
        event.threadID,
        event.messageID
      );
    }

    try {
    
      const noobcore = "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";
      const rawApiRes = await axios.get(noobcore);
      const apiBase = rawApiRes.data.apiv1;
      const apiUrl = `${apiBase}/api/ytinfo?channel=${encodeURIComponent(channelName)}`;
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.status) {
        return api.sendMessage(
          applyFont(`❌ Failed to fetch info for channel: ${channelName}`),
          event.threadID,
          event.messageID
        );
      }

      const info = data.channelInfo;

      const message =
        `╭─╼━━━━━━━━━━━━╾─╮\n` +
        `│  📺  ${applyFont("ＹＴ  ＳＴＡＬＫ")}  │\n` +
        `├─╼━━━━━━━━━━━━╾─╯\n` +
        `│ 🏷️ Channel: ${applyFont(info.title)}\n` +
        `│ 🌍 Country: ${info.country}\n` +
        `│ 📅 Joined: ${info.publishedAt}\n` +
        `│ 👥 Subs: ${applyFont(info.subscribers)}\n` +
        `│ 👁️ Views: ${applyFont(info.views)}\n` +
        `│ 🎬 Videos: ${applyFont(info.videos)}\n` +
        `├─╼━━━━━━━━━━━━╾─╮\n` +
        `│      ${applyFont("ＤＥＳＣＲＩＰＴＩＯＮ")}      │\n` +
        `├─╼━━━━━━━━━━━━╾─╯\n` +
        `│ ${applyFont(info.description.substring(0, 200))}${info.description.length > 200 ? "..." : ""}\n` +
        `╰─╼━━━━━━━━━━━━╾─╯`;

      if (info.thumbnail) {
        const imgPath = path.join(__dirname, `yt_${data.channelId}.jpg`);
        const writer = fs.createWriteStream(imgPath);
        const imgRes = await axios.get(info.thumbnail, { responseType: "stream" });
        imgRes.data.pipe(writer);

        writer.on("finish", () => {
          api.sendMessage(
            { body: message, attachment: fs.createReadStream(imgPath) },
            event.threadID,
            () => { try { fs.unlinkSync(imgPath); } catch {} },
            event.messageID
          );
        });

        writer.on("error", (e) => {
          console.error(e);
          api.sendMessage(message, event.threadID, event.messageID);
        });
      } else {
        api.sendMessage(message, event.threadID, event.messageID);
      }

    } catch (err) {
      console.error(err);
      api.sendMessage(
        applyFont("❌ Error occurred while fetching channel info. Please check the channel name or try again later."),
        event.threadID,
        event.messageID
      );
    }
  }
};