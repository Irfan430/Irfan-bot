const speakeasy = require("speakeasy");

module.exports = {
  config: {
    name: "2fa",
    version: "1.0",
    author: "nc - xnil",
    role: 0,
    usePrefix: true,
    description: "Generate 2FA code using secret key",
    guide: {
        en: "/2fa <secret>"
    },
    countDown: 3
  },

  // ================== onStart ==================
  ncStart: async function ({ message, args }) {
    if (!args || args.length < 1) {
      return message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ ❌ Use: /2fa <secret>\n╰──────────────╯");
    }

    const secret = args
      .join("")
      .replace(/[^A-Z2-7]/gi, "")
      .toUpperCase();
      
    const currentTime = Math.floor(Date.now() / 1000);

    try {
      const token = speakeasy.totp({
        secret: secret,
        encoding: "base32",
        digits: 6,
        step: 30,
        time: currentTime
      });

      return message.reply(`🔐 2FA Code:\n\n${token}`);
    } catch (err) {
      return message.reply("❌ Wrong secret code:\n" + err.message);
    }
  }
};