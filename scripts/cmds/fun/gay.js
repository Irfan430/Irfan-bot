const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "gay",
    version: "1.1",
    author: "NC-TOSHIRO",
    countDown: 1,
    role: 0,
    shortDescription: "Apply rainbow gay effect",
    longDescription: "Add rainbow overlay effect on avatar",
    category: "fun",
    guide: "{pn} [mention | reply | self]",
    atai: true
  },

  ncStart: async function ({ event, message, usersData }) {
    try {
      let uid;

      if (event.messageReply) {
        uid = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        uid = Object.keys(event.mentions)[0];
      } else {
        uid = event.senderID;
      }

      const avatarURL = await usersData.getAvatarUrl(uid);

      const res = await axios.get(avatarURL, {
        responseType: "arraybuffer"
      });
      const avatarBuffer = Buffer.from(res.data);

      const img = await new DIG.Gay().getImage(avatarBuffer);

      const outPath = path.join(__dirname, "tmp", `${uid}_gay.png`);
      await fs.ensureDir(path.dirname(outPath));
      await fs.writeFile(outPath, img);

      message.reply(
        { attachment: fs.createReadStream(outPath) },
        () => fs.unlinkSync(outPath)
      );

    } catch (e) {
      console.error(e);
      message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ❌ Effect apply kora jay nai\n╰──────────────╯");
    }
  }
};