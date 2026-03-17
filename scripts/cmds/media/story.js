const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "story",
		version: "1.2",
		author: "Irfan",
		countDown: 10,
		role: 0,
		description: {
			vi: "Đăng story lên Facebook",
			en: "Post a story to Facebook"
		},
		category: "media",
		guide: {
			vi: "   {pn} <văn bản>: Đăng story văn bản"
				+ "\n   {pn} <văn bản> (kèm ảnh/video): Đăng story kèm media",
			en: "   {pn} <text>: Post a text story"
				+ "\n   {pn} <text> (with image/video): Post a story with media"
		}
	},

	ncStart: async function ({ message, event, args, api }) {
		const { threadID, messageID, messageReply, attachments } = event;
		const text = args.join(" ");

		if (!text && !messageReply && attachments.length === 0) {
			return message.reply("╭─── 𝐒𝐘𝐒𝐓𝐄𝐌 ───╮\n│ ⚠️ Please provide content\n│ or attach media.\n╰──────────────╯");
		}

		let mediaStream = null;

		try {
			const targetAttachments = attachments.length > 0 ? attachments : (messageReply ? messageReply.attachments : []);
			
			if (targetAttachments.length > 0) {
				const attachment = targetAttachments[0];
				if (["photo", "video", "audio"].includes(attachment.type)) {
					const response = await axios.get(attachment.url, { responseType: "stream" });
					mediaStream = response.data;
				}
			}

			const storyData = {
				body: text,
				attachment: mediaStream
			};

			message.reply("╭─── 𝐒𝐓𝐎𝐑𝐘 ───╮\n│ ⏳ Processing...\n│ 🚀 Posting to Facebook\n╰─────────────╯");

			api.createStory(storyData, (err, res) => {
				if (err) {
					return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Failed to post story\n│ 📝 ${err.message || "Unknown error"}\n╰─────────────╯`);
				}
				message.reply("╭─── 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ───╮\n│ ✅ Story posted!\n│ ✨ Check your profile\n╰──────────────╯");
			});

		} catch (error) {
			message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ ${error.message}\n╰─────────────╯`);
		}
	}
};
