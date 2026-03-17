const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;

module.exports = {
  config: {
    name: "welcome",
    version: "2.1",
    author: "Saimx69x",
    category: "events"
  },

  ncStart: async function ({ api, event, message, threadsData }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const { addedParticipants } = logMessageData;
    const hours = new Date().getHours();
    const prefix = getPrefix(threadID);
    const nickNameBot = global.noobCore.config.nickNameBot;

    const { settings } = await threadsData.get(threadID);
    if (settings.sendWelcomeMessage === false) return;

    if (addedParticipants.some(user => user.userFbId === api.getCurrentUserID())) {
      if (nickNameBot) {
        try {
          await api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
        } catch (error) {
          console.error("❌ Error changing bot nickname:", error);
        }
      }
      return;
    }

    const botID = api.getCurrentUserID();
    if (addedParticipants.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "this group";
    const memberCount = threadInfo.participantIDs.length;

    for (const user of addedParticipants) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      try {
        const timeStr = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit", minute: "2-digit",
          weekday: "long", year: "numeric", month: "2-digit", day: "2-digit",
          hour12: true,
        });

        const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(fullName)}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;
        const tmp = path.join(__dirname, "..", "cache");
        await fs.ensureDir(tmp);
        const imagePath = path.join(tmp, `welcome_${userId}.png`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, response.data);

        const welcomeMsg = `╭─── 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ───╮\n` +
          `│ 👋 Hello, ${fullName}!\n` +
          `│ 🏠 Welcome to ${groupName}\n` +
          `│ 👥 You are member #${memberCount}\n` +
          `├─────────────────╮\n` +
          `│ 📅 ${timeStr}\n` +
          `│ ✨ Enjoy your stay! 🎉\n` +
          `╰─────────────────╯`;

        await api.sendMessage({
          body: welcomeMsg,
          attachment: fs.createReadStream(imagePath),
          mentions: [{ tag: fullName, id: userId }]
        }, threadID);

        fs.unlinkSync(imagePath);

      } catch (err) {
        console.error("❌ Error sending welcome message:", err);
      }
    }
  }
};
