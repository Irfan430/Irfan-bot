"use strict";

module.exports = {
  config: {
    name: "groupapprove",
    version: "1.1.0",
    author: "Manus",
    countDown: 5,
    role: 1,
    shortDescription: { en: "Approve or deny pending group members" },
    category: "admin",
    guide: { en: "{pn} approve <userID> | {pn} deny <userID>" }
  },

  ncStart: async function ({ api, event, args, message }) {
    const { threadID } = event;
    const action = args[0]?.toLowerCase();
    const targetID = args[1];

    if (!action || !["approve", "deny"].includes(action) || !targetID) {
      return message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ⚠️  Invalid usage!\n│ 💡 {pn} approve/deny <userID>\n╰──────────────────╯`
      );
    }

    message.reply(
      `╭──── ⏳ 𝐒𝐘𝐒𝐓𝐄𝐌 ────╮\n│ 🔄 Processing ${action}\n│    for ID: ${targetID}...\n╰────────────────────╯`
    );

    try {
      await api.handleGroupPendingMember(threadID, targetID, action);
      const emoji = action === "approve" ? "✅" : "🚫";
      const verb = action === "approve" ? "approved" : "denied";
      return message.reply(
        `╭──── ✅ 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ────╮\n│ ${emoji} User ${verb}!\n│ 🆔 ID: ${targetID}\n╰────────────────────╯`
      );
    } catch (err) {
      console.error(err);
      return message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to ${action} user.\n│ ⚠️  ${err.errorDescription || err.message || "Unknown error"}\n╰──────────────────╯`
      );
    }
  }
};
