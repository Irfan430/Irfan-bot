const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "kick",
    aliases: ["remove"],
    version: "3.1.0",
    author: "Team NoobCore (Edited)",
    role: 1,
    usePrefix: true,
    category: "group",
    shortDescription: "Kick a member from group",
    longDescription: "Kick members and view kick history",
    guide: {
      en: "{pn} @mention | reply | uid\n{pn} list"
    }
  },

  ncStart: async function ({
    api,
    event,
    args,
    message,
    usersData,
    threadsData
  }) {
    const { threadID, senderID, messageReply, mentions } = event;
    const botID = api.getCurrentUserID();

    // ===== Get thread info =====
    const info = await api.getThreadInfo(threadID);

    // ===== Bot admin check =====
    const botIsAdmin = info.adminIDs?.some(a => a.id == botID);
    if (!botIsAdmin) {
      return message.reply(
        "╭──── ⚠️ 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ 🤖 Bot is not an admin!\n│ 👉 Please make the bot\n│    admin first.\n╰──────────────────────╯"
      );
    }

    // ===== Sender admin check =====
    const senderIsAdmin = info.adminIDs?.some(a => a.id == senderID);
    if (!senderIsAdmin) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Only group admins\n│    can use this command.\n╰──────────────────╯"
      );
    }

    // ===== Load kick history =====
    let kickLogs =
      (await threadsData.get(threadID, "data.kickLogs", [])) || [];

    // ===== Show kick history =====
    if (args[0] === "list") {
      if (!kickLogs.length) {
        return message.reply(
          "╭──── 📋 𝐈𝐍𝐅𝐎 ────╮\n│ 📭 No kick history found.\n╰──────────────────╯"
        );
      }

      const text = kickLogs
        .slice(-10)
        .map(
          (e, i) =>
            `│ ${i + 1}. 👤 ${e.targetName}\n` +
            `│    👮 By: ${e.byName}\n` +
            `│    🕒 ${e.time}`
        )
        .join("\n│\n");

      return message.reply(`╭──── 📜 𝐊𝐈𝐂𝐊 𝐇𝐈𝐒𝐓𝐎𝐑𝐘 (last 10) ────╮\n${text}\n╰──────────────────────────────╯`);
    }

    // ===== Get target UID =====
    let targetID;

    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else if (messageReply) {
      targetID = messageReply.senderID;
    } else if (args[0]) {
      targetID = args[0];
    }

    if (!targetID) {
      return message.reply(
        "╭──── ⚠️ 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ 💡 Please mention, reply,\n│    or provide UID to kick.\n╰──────────────────────╯"
      );
    }

    // ===== Prevent self kick =====
    if (targetID == botID) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ 🤖 Cannot kick myself!\n╰──────────────────╯"
      );
    }

    if (targetID == senderID) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ You cannot kick yourself!\n╰──────────────────╯"
      );
    }

    // ===== Prevent kicking admin =====
    if (info.adminIDs?.some(a => a.id == targetID)) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ 🛡️  Cannot kick an admin!\n╰──────────────────╯"
      );
    }

    // ===== Get names =====
    const targetName =
      (await usersData.getName(targetID)) || "Unknown User";
    const byName =
      (await usersData.getName(senderID)) || "Unknown Admin";

    // ===== Kick user =====
    try {
      await api.removeUserFromGroup(targetID, threadID);
    } catch (err) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to kick user!\n│ ⚠️  Bot may need more perms.\n╰──────────────────╯"
      );
    }

    // ===== Save kick history =====
    kickLogs.push({
      targetID,
      targetName,
      byID: senderID,
      byName,
      time: moment()
        .tz("Asia/Dhaka")
        .format("DD/MM/YYYY HH:mm:ss")
    });

    await threadsData.set(threadID, kickLogs, "data.kickLogs");

    // ===== Success message =====
    return message.reply(
      `╭──── 🥾 𝐊𝐈𝐂𝐊𝐄𝐃 ────╮\n│ ✅ User kicked!\n│ 👤 User : ${targetName}\n│ 👮 By   : ${byName}\n╰──────────────────────╯`
    );
  }
};