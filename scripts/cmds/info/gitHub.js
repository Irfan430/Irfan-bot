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
          "⛔ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐆𝐢𝐭𝐇𝐮𝐛 𝐮𝐬𝐞𝐫𝐧𝐚𝐦𝐞.",
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
          `❌ 𝐍𝐨 𝐆𝐢𝐭𝐇𝐮𝐛 𝐮𝐬𝐞𝐫 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫 𝐮𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ${username}`,
          event.threadID,
          event.messageID
        );
      }
      
      const replyText = `╭─╼━━━━━━━━━━━━╾─╮
│  🐙  ${"ＧＩＴＨＵＢ  ＰＲＯＦＩＬＥ"}  │
├─╼━━━━━━━━━━━━╾─╯
│ 🧑‍💻 Name: ${data.name || "None"}
│ 👤 User: ${data.user || "None"}
│ 🏢 Company: ${data.company || "None"}
│ 🌐 Blog: ${data.blog || "None"}
│ 📍 Location: ${data.location || "None"}
│ 📧 Email: ${data.email || "None"}
│ 📝 Bio: ${data.bio || "None"}
│ 📦 Repos: ${data.public_repos || 0}
│ 👥 Followers: ${data.followers || 0}
│ 👣 Following: ${data.following || 0}
│ 📆 Created: ${new Date(data.created_at).toDateString()}
╰─╼━━━━━━━━━━━━╾─╯`;

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
        "❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐭 𝐆𝐢𝐭𝐇𝐮𝐛 𝐮𝐬𝐞𝐫 𝐢𝐧𝐟𝐨.",
        event.threadID,
        event.messageID
      );
    }
  }
};