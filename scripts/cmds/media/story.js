const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "story",
		version: "1.1",
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
			return message.reply("Please provide content or attach an image/video to post a story.");
		}

		let mediaStream = null;

		try {
			// Handle attachments from current message or replied message
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

			message.reply("Processing and posting story, please wait...");

			api.createStory(storyData, (err, res) => {
				if (err) {
					return message.reply(`An error occurred while posting story: ${err.message || JSON.stringify(err)}`);
				}
				message.reply("Story posted successfully!");
			});

		} catch (error) {
			message.reply(`Error: ${error.message}`);
		}
	}
};
