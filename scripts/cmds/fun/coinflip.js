module.exports = {
  config: {
    name: "coinflip",
    aliases: ["cf"],
    version: "1.3",
    author: "NC-Toshiro Editz",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Flip a coin and win coins" },
    longDescription: { en: "Bet coins on a coin flip: Heads (🪙) or Tails (⚡)" },
    guide: { en: "{pn} <bet amount> [h/t]" }
  },

  ncStart: async function ({ api, event, args, usersData }) {
    try {
      const bet = parseInt(args[0]);
      if (!bet || bet <= 0)
        return api.sendMessage(
          "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Enter a valid bet amount.\n│ 💡 Usage: cf <amount> [h/t]\n╰──────────────────╯",
          event.threadID, event.messageID
        );

      const user = await usersData.get(event.senderID);
      if (user.money < bet)
        return api.sendMessage(
          `╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Insufficient balance!\n│ 💰 Your Balance: ${user.money} coin\n╰──────────────────╯`,
          event.threadID, event.messageID
        );

      let choice = args[1]?.toLowerCase();
      if (!choice || !["h", "t", "heads", "tails"].includes(choice)) {
        choice = Math.random() < 0.5 ? "h" : "t";
      }

      const pick = (choice === "h" || choice === "heads") ? "Heads 🪙" : "Tails ⚡";
      const outcomes = ["Heads 🪙", "Tails ⚡"];
      const result = outcomes[Math.floor(Math.random() * 2)];

      const oldBalance = user.money;
      let newBalance;
      let win = false;

      if (pick === result) {
        await usersData.addMoney(event.senderID, bet * 2);
        newBalance = oldBalance + bet * 2;
        win = true;
      } else {
        await usersData.addMoney(event.senderID, -bet);
        newBalance = Math.max(0, oldBalance - bet);
      }

      const resultEmoji = win ? "🎉" : "💔";
      const statusText = win ? "𝗪𝗜𝗡𝗡𝗘𝗥!" : "𝗟𝗢𝗦𝗧!";
      const changeText = win ? `+${bet * 2} 💰` : `-${bet} 💸`;

      const msg =
        `╭──── 🎲 𝗖𝗢𝗜𝗡 𝗙𝗟𝗜𝗣 🎲 ────╮\n` +
        `│ ${resultEmoji} ${statusText}\n` +
        `├────────────────────────╮\n` +
        `│ 🎯 Your Pick  : ${pick}\n` +
        `│ 🪙 Result     : ${result}\n` +
        `├────────────────────────╮\n` +
        `│ 💵 Old Balance: ${oldBalance}\n` +
        `│ ${win ? "💰 You Won  " : "💸 You Lost "} : ${changeText}\n` +
        `│ 🏦 New Balance: ${newBalance}\n` +
        `╰────────────────────────╯`;

      return api.sendMessage(msg, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage(
        "╭──── 𝐄𝐑𝐑𝐎𝐑 ────╮\n│ ❌ Coinflip error occurred.\n╰──────────────────╯",
        event.threadID, event.messageID
      );
    }
  },
};
