module.exports = {
	config: {
		name: "setemoji",
		aliases: ["changeemoji", "emoji"],
		version: "1.0",
		author: "Manus",
		countDown: 5,
		role: 1,
		shortDescription: {
			vi: "Thay đổi biểu tượng cảm xúc của nhóm",
			en: "Change group emoji"
		},
		description: {
			vi: "Thay đổi biểu tượng cảm xúc (emoji) mặc định của nhóm chat",
			en: "Change the default emoji of the chat group"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} <emoji>: Thay đổi emoji của nhóm thành <emoji>",
			en: "   {pn} <emoji>: Change group emoji to <emoji>"
		}
	},

	langs: {
		vi: {
			missingEmoji: "⚠️ Vui lòng nhập emoji bạn muốn đặt cho nhóm",
			success: "✅ Đã thay đổi emoji của nhóm thành: %1",
			error: "❌ Đã xảy ra lỗi khi thay đổi emoji: %1"
		},
		en: {
			missingEmoji: "⚠️ Please enter the emoji you want to set for the group",
			success: "✅ Successfully changed group emoji to: %1",
			error: "❌ An error occurred while changing emoji: %1"
		}
	},

	ncStart: async function ({ api, args, message, event, getLang }) {
		const emoji = args[0];
		if (!emoji) return message.reply(getLang("missingEmoji"));

		api.changeThreadEmoji(emoji, event.threadID, (err) => {
			if (err) return message.reply(getLang("error", err.errorDescription || err.errorMessage || JSON.stringify(err)));
			return message.reply(getLang("success", emoji));
		});
	}
};
