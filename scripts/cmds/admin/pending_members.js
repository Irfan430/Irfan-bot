"use strict";

module.exports = {
  config: {
    name: "pendingmembers",
    aliases: ["pm", "pending"],
    version: "1.2.0",
    author: "Manus",
    countDown: 5,
    role: 1,
    shortDescription: { en: "Fetch pending member requests for the current group." },
    category: "admin",
    guide: { en: "{pn}" }
  },

  ncStart: async function ({ api, event, message }) {
    const threadID = event.threadID;

    if (!event.isGroup) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ This command only\n│    works in groups.\n╰──────────────────╯"
      );
    }

    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.adminIDs.some(admin => admin.id === event.senderID)) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ You must be a group\n│    admin to use this.\n╰──────────────────╯"
      );
    }

    message.reply("╭──── 🔍 𝐒𝐘𝐒𝐓𝐄𝐌 ────╮\n│ ⏳ Fetching pending\n│    members...\n╰──────────────────╯");

    try {
      if (!api.getGroupPendingMembers) {
        throw new Error("getGroupPendingMembers not available in this FCA version.");
      }

      api.getGroupPendingMembers(threadID, (err, data) => {
        if (err) {
          console.error("Error fetching pending members:", err);
          return message.reply(
            `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to fetch\n│    pending members.\n│ ⚠️  ${err.error || err.message || err}\n╰──────────────────╯`
          );
        }

        const pendingMembers = data?.node?.pending_members?.edges || [];

        if (pendingMembers.length === 0) {
          return message.reply(
            "╭──── 📋 𝐈𝐍𝐅𝐎 ────╮\n│ ✅ No pending member\n│    requests found.\n╰──────────────────╯"
          );
        }

        let responseMsg = `╭──── 👥 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐌𝐄𝐌𝐁𝐄𝐑𝐒 (${pendingMembers.length}) ────╮\n`;
        pendingMembers.forEach((member, index) => {
          const userID = member.node.id;
          const userName = member.node.name;
          responseMsg += `│ ${index + 1}. 👤 ${userName}\n│    🆔 ${userID}\n`;
        });
        responseMsg += `╰──────────────────────────────────╯`;

        message.reply(responseMsg);
      });
    } catch (error) {
      console.error("Unexpected error in pendingmembers command:", error);
      message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Unexpected error:\n│ ⚠️  ${error.message}\n╰──────────────────╯`
      );
    }
  }
};
