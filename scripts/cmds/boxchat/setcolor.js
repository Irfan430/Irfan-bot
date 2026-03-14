module.exports = {
	config: {
		name: "setcolor",
		aliases: ["changecolor", "color"],
		version: "1.0",
		author: "Manus",
		countDown: 5,
		role: 1,
		shortDescription: {
			vi: "Thay đổi màu sắc của nhóm",
			en: "Change group color"
		},
		description: {
			vi: "Thay đổi màu sắc mặc định của nhóm chat",
			en: "Change the default color of the chat group"
		},
		category: "box chat",
		guide: {
			vi: "   {pn} <mã màu/hex>: Thay đổi màu sắc của nhóm thành <mã màu/hex>",
			en: "   {pn} <color/hex>: Change group color to <color/hex>"
		}
	},

	langs: {
		vi: {
			missingColor: "⚠️ Vui lòng nhập mã màu hoặc hex bạn muốn đặt cho nhóm",
			success: "✅ Đã thay đổi màu sắc của nhóm thành công!",
			error: "❌ Đã xảy ra lỗi khi thay đổi màu sắc: %1"
		},
		en: {
			missingColor: "⚠️ Please enter the color code or hex you want to set for the group",
			success: "✅ Successfully changed group color!",
			error: "❌ An error occurred while changing color: %1"
		}
	},

	ncStart: async function ({ api, args, message, event, getLang }) {
		const color = args[0];
		if (!color) return message.reply(getLang("missingColor"));

		api.changeThreadColor(color, event.threadID, (err) => {
			if (err) return message.reply(getLang("error", err.errorDescription || err.errorMessage || JSON.stringify(err)));
			return message.reply(getLang("success"));
		});
	}
};
