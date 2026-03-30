"use strict";

module.exports = {
  config: {
    name: "userinfo",
    aliases: ["info", "profile"],
    version: "1.1.0",
    author: "Manus",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Get detailed information about a Facebook user." },
    category: "info",
    guide: { en: "{pn} [user ID or reply to message]" }
  },

  ncStart: async function ({ api, event, args, message }) {
    let targetID = event.senderID;

    if (args[0]) {
      targetID = args[0];
    } else if (event.messageReply) {
      targetID = event.messageReply.senderID;
    }

    if (!targetID) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Please provide a user ID\n│    or reply to a message.\n╰──────────────────╯"
      );
    }

    message.reply("╭──── 🔍 𝐒𝐘𝐒𝐓𝐄𝐌 ────╮\n│ ⏳ Fetching user info...\n╰───────────────────╯");

    try {
      if (!api.getUserInfoV2) {
        throw new Error("getUserInfoV2 not available in this FCA version.");
      }

      api.getUserInfoV2(targetID, (err, data) => {
        if (err) {
          return message.reply(
            `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to fetch user info\n│ ⚠️  ${err.error || err.message || err}\n╰──────────────────╯`
          );
        }

        const userInfo = data[targetID];

        if (!userInfo || !userInfo.name) {
          return message.reply(
            "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ User not found or\n│    no information available.\n╰──────────────────╯"
          );
        }

        const genderMap = { MALE: "♂ Male", FEMALE: "♀ Female" };
        const friendMap = { ARE_FRIENDS: "✅ Friends", NOT_FRIENDS: "➖ Not Friends" };

        const responseMessage =
          `╭──── 👤 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 ────╮\n` +
          `│ 🏷️  𝗡𝗮𝗺𝗲     : ${userInfo.name}\n` +
          `│ 📛 𝗙𝗶𝗿𝘀𝘁    : ${userInfo.firstName || "N/A"}\n` +
          `│ 🔗 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲 : ${userInfo.vanity || "N/A"}\n` +
          `│ ⚧️  𝗚𝗲𝗻𝗱𝗲𝗿   : ${genderMap[userInfo.gender] || userInfo.gender || "N/A"}\n` +
          `│ 🤝 𝗙𝗿𝗶𝗲𝗻𝗱   : ${friendMap[userInfo.friendshipStatus] || userInfo.friendshipStatus || "N/A"}\n` +
          `│ 🆔 𝗜𝗗       : ${targetID}\n` +
          `├─────────────────────╮\n` +
          `│ 🌐 ${userInfo.profileUrl || "N/A"}\n` +
          `╰─────────────────────╯`;

        message.reply(responseMessage);
      });
    } catch (error) {
      message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Unexpected error:\n│ ⚠️  ${error.message}\n╰──────────────────╯`
      );
    }
  }
};
