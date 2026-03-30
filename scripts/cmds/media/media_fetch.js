"use strict";

module.exports = {
  config: {
    name: "mediafetch",
    aliases: ["mf", "getmedia"],
    version: "1.2.0",
    author: "Manus",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Fetch shared media (images/videos) from the current thread." },
    category: "media",
    guide: { en: "{pn} [limit] [image/video]" }
  },

  ncStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    const limit = parseInt(args[0]) || 10;
    const mediaType = args[1] ? args[1].toLowerCase() : null;

    if (isNaN(limit) || limit <= 0) {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Please provide a valid\n│    limit (positive number).\n╰──────────────────╯"
      );
    }

    if (mediaType && mediaType !== "image" && mediaType !== "video") {
      return message.reply(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Invalid type!\n│ 💡 Use: image or video\n╰──────────────────╯"
      );
    }

    message.reply(
      `╭──── 🔍 𝐒𝐘𝐒𝐓𝐄𝐌 ────╮\n│ ⏳ Fetching ${mediaType || "all"} media\n│    (limit: ${limit})...\n╰──────────────────╯`
    );

    try {
      if (!api.getThreadMedia) {
        throw new Error("getThreadMedia not available in this FCA version.");
      }

      api.getThreadMedia(threadID, limit, (err, data) => {
        if (err) {
          console.error("Error fetching thread media:", err);
          return message.reply(
            `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Failed to fetch media.\n│ ⚠️  ${err.error || err.message || err}\n╰──────────────────╯`
          );
        }

        if (!data || !data.thread || !data.thread.message_shared_media) {
          return message.reply(
            "╭──── 📋 𝐈𝐍𝐅𝐎 ────╮\n│ 📭 No shared media found\n│    in this thread.\n╰──────────────────╯"
          );
        }

        const mediaEdges = data.thread.message_shared_media.edges;
        const filteredMedia = [];

        for (const edge of mediaEdges) {
          const attachment = edge.node.message.attachments.nodes[0];
          if (attachment) {
            if (mediaType === "image" && attachment.photo) {
              filteredMedia.push(attachment.photo.image.uri);
            } else if (mediaType === "video" && attachment.video) {
              filteredMedia.push(attachment.video.playable_url);
            } else if (!mediaType) {
              if (attachment.photo) filteredMedia.push(attachment.photo.image.uri);
              if (attachment.video) filteredMedia.push(attachment.video.playable_url);
            }
          }
        }

        if (filteredMedia.length === 0) {
          return message.reply(
            `╭──── 📋 𝐈𝐍𝐅𝐎 ────╮\n│ 📭 No ${mediaType || ""} media\n│    found in this thread.\n╰──────────────────╯`
          );
        }

        let responseMsg = `╭──── 🖼️  𝐒𝐇𝐀𝐑𝐄𝐃 𝐌𝐄𝐃𝐈𝐀 ────╮\n│ 🗂️  Type: ${mediaType || "All"} | Found: ${filteredMedia.length}\n├────────────────────────╮\n`;
        filteredMedia.forEach((url, index) => {
          responseMsg += `│ ${index + 1}. ${url}\n`;
        });
        responseMsg += `╰────────────────────────╯`;

        message.reply(responseMsg);
      });
    } catch (error) {
      console.error("Unexpected error in mediafetch command:", error);
      message.reply(
        `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Unexpected error:\n│ ⚠️  ${error.message}\n╰──────────────────╯`
      );
    }
  }
};
