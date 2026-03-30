const axios = require("axios");

module.exports = {
  config: {
    name: "github",
    aliases: [],
    version: "1.1",
    author: "Azadx69x",
    countDown: 3,
    role: 0,
    shortDescription: "Get GitHub user info",
    longDescription: "Fetch GitHub user info and show profile data with fancy text",
    category: "owner",
    guide: {
      en: "{pn} <username>"
    }
  },

  ncStart: async function ({ api, event, args }) {
    try {
      if (!args[0]) {
        return api.sendMessage(
          "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Please provide a GitHub\n│    username to search.\n│ 💡 Usage: github <username>\n╰──────────────────╯",
          event.threadID,
          event.messageID
        );
      }

      const username = args[0];
      const apiURL = `https://azadx69x-all-apis-top.vercel.app/api/github?user=${encodeURIComponent(username)}`;

      const res = await axios.get(apiURL);
      const data = res.data.data;

      if (!data) {
        return api.sendMessage(
          `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ No GitHub user found\n│    for: ${username}\n╰──────────────────╯`,
          event.threadID,
          event.messageID
        );
      }

      const replyText =
        `╭──── 🐙 𝗚𝗜𝗧𝗛𝗨𝗕 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 ────╮\n` +
        `│ 🧑‍💻 𝗡𝗮𝗺𝗲     : ${data.name || "None"}\n` +
        `│ 👤 𝗨𝘀𝗲𝗿     : ${data.user || "None"}\n` +
        `│ 🏢 𝗖𝗼𝗺𝗽𝗮𝗻𝘆  : ${data.company || "None"}\n` +
        `│ 🌐 𝗕𝗹𝗼𝗴     : ${data.blog || "None"}\n` +
        `│ 📍 𝗟𝗼𝗰𝗮𝘁𝗶𝗼𝗻 : ${data.location || "None"}\n` +
        `│ 📧 𝗘𝗺𝗮𝗶𝗹    : ${data.email || "None"}\n` +
        `│ 📝 𝗕𝗶𝗼      : ${data.bio || "None"}\n` +
        `├─────────────────────────╮\n` +
        `│ 📦 𝗥𝗲𝗽𝗼𝘀    : ${data.public_repos || 0}\n` +
        `│ 👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀 : ${data.followers || 0}\n` +
        `│ 👣 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴 : ${data.following || 0}\n` +
        `│ 📆 𝗝𝗼𝗶𝗻𝗲𝗱   : ${new Date(data.created_at).toDateString()}\n` +
        `╰─────────────────────────╯`;

      await api.sendMessage(
        {
          body: replyText,
          attachment: await global.utils.getStreamFromURL(data.avatar)
        },
        event.threadID,
        event.messageID
      );

    } catch (err) {
      console.error("[GITHUB CMD ERROR]", err);
      return api.sendMessage(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to get GitHub\n│    user information.\n╰──────────────────╯",
        event.threadID,
        event.messageID
      );
    }
  }
};