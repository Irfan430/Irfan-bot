"use strict";

module.exports = {
  config: {
    name: "changeavatar",
    aliases: ["setavatar", "avatar"],
    version: "1.1.0",
    author: "Manus",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Change the bot's Facebook profile picture." },
    category: "admin",
    guide: { en: "{pn} [reply to image/video]" }
  },

  ncStart: async function ({ api, event, message }) {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Please reply to an image\n│    or video to set as avatar.\n╰──────────────────╯"
      );
    }

    const attachment = event.messageReply.attachments[0];

    if (attachment.type !== "Photo" && attachment.type !== "Video") {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Only images and videos\n│    are supported for avatar.\n╰──────────────────╯"
      );
    }

    message.reply("╭──── 🔄 𝐒𝐘𝐒𝐓𝐄𝐌 ────╮\n│ ⏳ Changing avatar...\n│    Please wait.\n╰──────────────────╯");

    try {
      if (!api.changeAvatar) {
        throw new Error("changeAvatar API is not available in this FCA version.");
      }

      const axios = require("axios");
      const fs = require("fs");
      const path = require("path");
      const imagePath = path.join(__dirname, `avatar_${event.senderID}.tmp`);

      const response = await axios.get(attachment.url, { responseType: "stream" });
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const imageStream = fs.createReadStream(imagePath);

      api.changeAvatar(imageStream, (err) => {
        fs.unlink(imagePath, (unlinkErr) => {
          if (unlinkErr) console.error("Failed to delete temp avatar file:", unlinkErr);
        });

        if (err) {
          return message.reply(
            `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to change avatar\n│ ⚠️  ${err.error || err}\n╰──────────────────╯`
          );
        }
        message.reply(
          "╭──── ✅ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ────╮\n│ 🖼️  Avatar changed\n│    successfully!\n╰────────────────────╯"
        );
      });
    } catch (error) {
      message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Unexpected error:\n│ ⚠️  ${error.message}\n╰──────────────────╯`
      );
    }
  }
};
