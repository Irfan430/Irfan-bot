module.exports = {
	config: {
		name: "storyview",
		version: "1.0",
		author: "Irfan",
		countDown: 10,
		role: 0,
		description: {
			vi: "Xem và tương tác với story của bạn bè",
			en: "View and interact with friends' stories"
		},
		category: "media",
		guide: {
			vi: "   {pn}: Xem danh sách story"
				+ "\n   {pn} react <storyID> <type>: Thả cảm xúc vào story",
			en: "   {pn}: View story list"
				+ "\n   {pn} react <storyID> <type>: React to a story"
		}
	},

	ncStart: async function ({ message, event, args, api }) {
		const { threadID, messageID } = event;
		const action = args[0];

		try {
			if (!action) {
				message.reply("Fetching stories, please wait...");
				api.getStories((err, data) => {
					if (err) return message.reply(`Error fetching stories: ${err.message || JSON.stringify(err)}`);
					// Format and display stories (simplified for now)
					message.reply("Stories fetched successfully! (Feature in development)");
				});
			} else if (action === "react") {
				const storyID = args[1];
				const type = args[2] || "like";
				if (!storyID) return message.reply("Please provide a story ID.");
				api.setStoryReaction(storyID, type, (err, data) => {
					if (err) return message.reply(`Error reacting to story: ${err.message || JSON.stringify(err)}`);
					message.reply(`Reacted ${type} to story ${storyID} successfully!`);
				});
			}
		} catch (error) {
			message.reply(`Error: ${error.message}`);
		}
	}
};
