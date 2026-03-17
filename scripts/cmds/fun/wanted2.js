const DIG = require("discord-image-generation");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "wanted2",
    version: "1.0",
    author: "NC-TOSHIRO",
    role: 0,
    category: "fun",
    atai: true
  },

  ncStart: async ({ event, message, usersData }) => {
    try {
      const uid = event.messageReply
        ? event.messageReply.senderID
        : event.mentions && Object.keys(event.mentions).length
        ? Object.keys(event.mentions)[0]
        : event.senderID;

      const avatarURL = await usersData.getAvatarUrl(uid);
      const buf = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
      const img = await new DIG.Wanted().getImage(buf);

      const p = path.join(__dirname, "tmp", `${uid}_wanted.png`);
      await fs.ensureDir(path.dirname(p));
      await fs.writeFile(p, img);

      message.reply({ attachment: fs.createReadStream(p) }, () => fs.unlinkSync(p));
    } catch {
      message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Wanted failed\n╰──────────────╯");
    }
  }
};