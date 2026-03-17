module.exports = {
	config: {
		name: "feed",
		version: "1.0",
		author: "Irfan",
		countDown: 10,
		role: 0,
		description: {
			vi: "Xem và tương tác với bảng tin",
			en: "View and interact with news feed"
		},
		category: "media",
		guide: {
			vi: "   {pn}: Xem bảng tin"
				+ "\n   {pn} react <postID> <type>: Thả cảm xúc vào bài viết"
				+ "\n   {pn} comment <postID> <text>: Bình luận vào bài viết",
			en: "   {pn}: View news feed"
				+ "\n   {pn} react <postID> <type>: React to a post"
				+ "\n   {pn} comment <postID> <text>: Comment on a post"
		}
	},

	ncStart: async function ({ message, event, args, api }) {
		const { threadID, messageID } = event;
		const action = args[0];

		try {
			if (!action) {
				message.reply("Fetching news feed, please wait...");
				api.getNewsFeed(5, (err, data) => {
					if (err) return message.reply(`Error fetching feed: ${err.message || JSON.stringify(err)}`);
					// Format and display feed (simplified for now)
					message.reply("News feed fetched successfully! (Feature in development)");
				});
			} else if (action === "react") {
				const postID = args[1];
				const type = args[2] || "like";
				if (!postID) return message.reply("Please provide a post ID.");
				api.setPostReaction(postID, type, (err, data) => {
					if (err) return message.reply(`Error reacting to post: ${err.message || JSON.stringify(err)}`);
					message.reply(`Reacted ${type} to post ${postID} successfully!`);
				});
			} else if (action === "comment") {
				const postID = args[1];
				const text = args.slice(2).join(" ");
				if (!postID || !text) return message.reply("Please provide post ID and comment text.");
				api.setPostComment(postID, text, (err, data) => {
					if (err) return message.reply(`Error commenting on post: ${err.message || JSON.stringify(err)}`);
					message.reply(`Commented on post ${postID} successfully!`);
				});
			}
		} catch (error) {
			message.reply(`Error: ${error.message}`);
		}
	}
};
