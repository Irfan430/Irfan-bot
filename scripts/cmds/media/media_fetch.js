"use strict";

module.exports = {
  config: {
    name: "mediafetch",
    aliases: ["mf", "getmedia"],
    version: "1.0.0",
    author: "Manus",
    countDown: 5,
    role: 0,
    description: "Fetch shared media (images/videos) from the current thread.",
    category: "media",
    guide: "{pn} [limit]"
  },

  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    const limit = parseInt(args[0]) || 10;

    if (isNaN(limit) || limit <= 0) {
      return message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ Please provide a valid limit.\n╰────── ──────╯");
    }

    message.reply("╭─── 𝐒𝐘𝐒𝐓𝐄𝐌 ───╮\n│ Fetching shared media, please wait...\n╰────── ──────╯");

    try {
      if (!api.getThreadMedia) {
        throw new Error("API getThreadMedia is not available in your FCA.");
      }

      api.getThreadMedia(threadID, limit, (err, data) => {
        if (err) {
          return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ Failed to fetch media: ${err.error || err}\n╰────── ──────╯`);
        }

        // Note: The actual parsing of 'data' depends on the GraphQL response structure
        // For now, we show a success message with the raw data count or summary
        message.reply(`╭─── 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ───╮\n│ Successfully fetched media data.\n│ Check console for details.\n╰────── ──────╯`);
        console.log("Media Data:", JSON.stringify(data, null, 2));
      });
    } catch (error) {
      message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ An unexpected error occurred:\n│ ${error.message}\n╰────── ──────╯`);
    }
  }
};
