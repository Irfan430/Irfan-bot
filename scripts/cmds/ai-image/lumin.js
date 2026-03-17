const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const noobcore =
  "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";

async function getRenzApi() {
  const res = await axios.get(noobcore, { timeout: 10000 });
  if (!res.data?.renz) {
    throw new Error("Renz API not found in JSON");
  }
  return res.data.renz;
}

module.exports = {
  config: {
    name: "lumin",
    version: "1.0",
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴", //Api by Renz 
    team: "NoobCore",
    countDown: 5,
    role: 0,
    description: {
      en: "Generate an AI image",
    },
    guide: {
      en: "{pn} <prompt>\nExample: ${prefix}lumin futuristic dragon flying in space",
    },
  },

  ncStart: async function ({ message, event, args, api, commandName }) {
    const prefix = global.utils?.getPrefix
      ? global.utils.getPrefix(event.threadID)
      : global.noobCore?.config?.prefix || "/";

    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply(
        `⚠️ Please provide a prompt.\nExample: ${prefix}${commandName} futuristic dragon flying in space`
      );
    }

    api.setMessageReaction("🎨", event.messageID, () => {}, true);
    const waitingMsg = await message.reply(
      "🎨 Generating your  image... Please wait..."
    );

    const imgPath = path.join(
      __dirname,
      "cache",
      `lumin_${event.senderID}.png`
    );

    try {
      const BASE_URL = await getRenzApi();
      const url = `${BASE_URL}/api/luminarium?prompt=${encodeURIComponent(
        prompt
      )}`;

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 180000
      });

      await fs.ensureDir(path.dirname(imgPath));
      fs.writeFileSync(imgPath, response.data);

      await message.reply(
        {
          body: `✅ Here is your generated ${commandName} image.`,
          attachment: fs.createReadStream(imgPath),
        },
        () => {
          try { fs.unlinkSync(imgPath); } catch {}
          if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
        }
      );
    } catch (error) {
      console.error("lumin generation error:", error?.message || error);
      message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ⚠️ Failed to generate image. Please try again later.\n╰──────────────╯");
      if (waitingMsg?.messageID) api.unsendMessage(waitingMsg.messageID);
    }
  },
};