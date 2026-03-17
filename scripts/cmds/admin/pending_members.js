"use strict";

module.exports = {
  config: {
    name: "pendingmembers",
    aliases: ["pm", "pending"],
    version: "1.1.0",
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

    // Check if the sender is an admin of the group
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.adminIDs.some(admin => admin.id === event.senderID)) {
      return message.reply("╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ You must be a group admin to use this command.\n╰────── ──────╯");
    }

    message.reply("╭─── 𝐒𝐘𝐒𝐓𝐄𝐌 ───╮\n│ Fetching pending members, please wait...\n╰────── ──────╯");

    try {
      if (!api.getGroupPendingMembers) {
        throw new Error("API getGroupPendingMembers is not available in your FCA. Please ensure your FCA is updated.");
      }

      api.getGroupPendingMembers(threadID, (err, data) => {
        if (err) {
          console.error("Error fetching pending members:", err);
          return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ Failed to fetch pending members: ${err.error || err.message || err}\n╰────── ──────╯`);
        }

        // Assuming data structure: data.node.pending_members.edges
        const pendingMembers = data?.node?.pending_members?.edges || [];

        if (pendingMembers.length === 0) {
          return message.reply("╭─── 𝐈𝐍𝐅𝐎 ───╮\n│ No pending member requests found for this group.\n╰────── ──────╯");
        }

        let responseMsg = `╭─── 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 (${pendingMembers.length}) ───╮\n`;
        pendingMembers.forEach((member, index) => {
          const userID = member.node.id;
          const userName = member.node.name;
          responseMsg += `│ ${index + 1}. ${userName} (ID: ${userID})\n`;
        });
        responseMsg += `╰────── ───────╯`;

        message.reply(responseMsg);
      });
    } catch (error) {
      console.error("Unexpected error in pendingmembers command:", error);
      message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ An unexpected error occurred:\n│ ${error.message}\n╰────── ──────╯`);
    }
  }
};
