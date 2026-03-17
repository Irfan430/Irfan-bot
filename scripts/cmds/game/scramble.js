/**
 * @file scramble.js
 * @description A live interactive word scramble game for Irfan-bot.
 * @path /home/ubuntu/Irfan-bot/scripts/cmds/game/scramble.js
 */

const axios = require("axios");

module.exports = {
	config: {
		name: "scramble",
		aliases: ["wordgame", "ws"],
		version: "1.0",
		author: "Manus AI",
		countDown: 5,
		role: 0,
		description: {
			en: "Unscramble the word to win coins!",
			vi: "Giải đố từ bị xáo trộn để nhận xu!"
		},
		category: "game",
		guide: {
			en: "{pn}: Start a new word scramble game.",
			vi: "{pn}: Bắt đầu trò chơi xáo trộn từ mới."
		}
	},

	ncStart: async function ({ api, event }) {
		try {
			// List of words for the game
			const words = [
				"FACEBOOK", "MESSENGER", "JAVASCRIPT", "NODEJS", "COMPUTER",
				"INTERNET", "PROGRAMMING", "SOFTWARE", "HARDWARE", "DATABASE",
				"ALGORITHM", "NETWORK", "SECURITY", "BROWSER", "KEYBOARD",
				"MONITOR", "PROCESSOR", "MEMORY", "STORAGE", "GRAPHICS",
				"MOBILE", "APPLICATION", "WEBSITE", "SERVER", "CLIENT",
				"PYTHON", "GITHUB", "REACTION", "MESSAGE", "FRIEND"
			];

			const originalWord = words[Math.floor(Math.random() * words.length)];
			
			// Scramble the word
			let scrambledWord = originalWord.split('').sort(() => Math.random() - 0.5).join('');
			
			// Ensure scrambled word is different from original
			while (scrambledWord === originalWord) {
				scrambledWord = originalWord.split('').sort(() => Math.random() - 0.5).join('');
			}

			const body = `🎮 𝐖𝐎𝐑𝐃 𝐒𝐂𝐑𝐀𝐌𝐁𝐋𝐄 🎮\n\n` +
				`🔠 Scrambled Word: **${scrambledWord}**\n\n` +
				`💡 Hint: It's a tech or social media related word.\n` +
				`💰 Reward: 500 Coins\n` +
				`⏱️ You have 30 seconds to reply with the correct word!`;

			api.sendMessage(body, event.threadID, (err, info) => {
				if (err) return;

				// Store game state in global reply handler
				if (!global.noobCore) global.noobCore = {};
				if (!global.noobCore.ncReply) global.noobCore.ncReply = new Map();

				global.noobCore.ncReply.set(info.messageID, {
					commandName: this.config.name,
					type: "reply",
					messageID: info.messageID,
					author: event.senderID,
					correctWord: originalWord,
					isEnded: false
				});

				// Auto-end game after 30 seconds
				setTimeout(async () => {
					const gameState = global.noobCore.ncReply.get(info.messageID);
					if (gameState && !gameState.isEnded) {
						gameState.isEnded = true;
						api.sendMessage(`⏰ Time's up! The correct word was: **${originalWord}**`, event.threadID, info.messageID);
						global.noobCore.ncReply.delete(info.messageID);
					}
				}, 30000);
			}, event.messageID);

		} catch (error) {
			console.error(error);
			api.sendMessage("❌ Failed to start the game. Please try again.", event.threadID, event.messageID);
		}
	},

	ncReply: async function ({ api, event, Reply, usersData }) {
		const { correctWord, messageID, isEnded } = Reply;
		const userGuess = event.body?.trim().toUpperCase();

		if (isEnded) return;

		if (userGuess === correctWord) {
			Reply.isEnded = true;
			
			try {
				const reward = 500;
				const userData = await usersData.get(event.senderID);
				userData.money = (userData.money || 0) + reward;
				await usersData.set(event.senderID, userData);

				const successMsg = `🎉 CONGRATULATIONS! 🎉\n\n` +
					`✅ Correct Word: **${correctWord}**\n` +
					`👤 Winner: @${event.senderID}\n` +
					`💰 Reward: +${reward} Coins\n\n` +
					`Well done! You unscrambled it!`;

				api.sendMessage(successMsg, event.threadID, event.messageID);
				global.noobCore.ncReply.delete(messageID);
			} catch (error) {
				console.error(error);
				api.sendMessage(`✅ Correct! The word was **${correctWord}**. (Error updating coins)`, event.threadID, event.messageID);
			}
		} else {
			// Optional: Provide feedback for wrong guess or just ignore to allow others to try
			// For a "Live" feel, we don't restrict to the author, anyone can guess!
		}
	}
};
