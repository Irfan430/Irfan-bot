"use strict";

module.exports = {
  config: {
    name: "pendingmembers",
    aliases: ["pm", "pending"],
    version: "1.0.0",
    author: "Manus",
    countDown: 5,
    role: 1, // Admin only
    description: "Fetch pending member requests for the current group.",
    category: "admin",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, message }) {
    const threadID = event.threadID;

    if (!event.isGroup) {
      return message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ This command only works in groups.\n╰────── ──────╯");
    }

    message.reply("╭─── 𝐒𝐘𝐒𝐓𝐄𝐌 ───╮\n│ Fetching pending members, please wait...\n╰────── ──────╯");

    try {
      if (!api.getGroupPendingMembers) {
        throw new Error("API getGroupPendingMembers is not available in your FCA.");
      }

      api.getGroupPendingMembers(threadID, (err, data) => {
        if (err) {
          return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ Failed to fetch pending members: ${err.error || err}\n╰────── ──────╯`);
        }

        // Note: The actual parsing of 'data' depends on the GraphQL response structure
        // For now, we show a success message with the raw data count or summary
        message.reply(`╭─── 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ───╮\n│ Successfully fetched pending members data.\n│ Check console for details.\n╰────── ──────╯`);
        console.log("Pending Members Data:", JSON.stringify(data, null, 2));
      });
    } catch (error) {
      message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ An unexpected error occurred:\n│ ${error.message}\n╰────── ──────╯`);
    }
  }
};
