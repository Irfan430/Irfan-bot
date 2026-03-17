const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap",
    aliases: ["botslap"],
    version: "1.2",
    author: "NC-TOSHIRO",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap image",
    longDescription: "Create a batslap image using avatars",
    category: "fun",
    guide: {
      en: "{pn} @mention"
    },
    atai: true
  },

  langs: {
    en: {
      noTag: "❌ Please mention a user to slap."
    }
  },

  ncStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const senderID = event.senderID;
      const targetID = event.mentions && Object.keys(event.mentions)[0];

      if (!targetID) {
        return message.reply(getLang("noTag"));
      }

      const senderAvatarURL = await usersData.getAvatarUrl(senderID);
      const targetAvatarURL = await usersData.getAvatarUrl(targetID);

      // Convert avatars to Buffer (required by DIG)
      const senderBuffer = Buffer.from(
        (await axios.get(senderAvatarURL, { responseType: "arraybuffer" })).data
      );

      const targetBuffer = Buffer.from(
        (await axios.get(targetAvatarURL, { responseType: "arraybuffer" })).data
      );

      // DIG Batslap: sender first, target second
      const img = await new DIG.Batslap().getImage(
        senderBuffer,
        targetBuffer
      );

      const outPath = path.join(
        __dirname,
        "tmp",
        `${senderID}_${targetID}_batslap.png`
      );

      await fs.ensureDir(path.dirname(outPath));
      await fs.writeFile(outPath, img);

      const content = args.join(" ").replace(targetID, "").trim();

      message.reply(
        {
          body: content || " 😵‍💫",
          attachment: fs.createReadStream(outPath)
        },
        () => fs.unlinkSync(outPath)
      );

    } catch (err) {
      console.error("BATSLAP ERROR:", err);
      message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Batslap effect failed.\n╰──────────────╯");
    }
  }
};