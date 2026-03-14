const { getPrefix } = global.utils;
const { commands, aliases } = global.noobCore;
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const PER_PAGE = 100;

// ----- UTILITY FUNCTIONS -----
function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeCat(cat) {
  return String(cat || "other").trim().toLowerCase();
}

// ----- LINE BREAK FOR COMMANDS -----
function chunkCommands(names, maxLen = 50, fontFn = (t) => t) {
  const lines = [];
  let line = "• ";
  for (const name of names) {
    const addition = line === "• " ? fontFn(name) : ` • ${fontFn(name)}`;
    if ((line + addition).length > maxLen) {
      lines.push(line);
      line = "• " + fontFn(name);
    } else {
      line += addition;
    }
  }
  if (line !== "• ") lines.push(line);
  return lines;
}

// ----- CATEGORY EMOJI FETCH -----
let categoryEmoji = {};
async function fetchCategoryEmoji() {
  try {
    const url = "https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/nchelp/category.json";
    const res = await axios.get(url);
    categoryEmoji = res.data || {};
  } catch (e) {
    console.error("Failed to fetch category emoji:", e);
  }
}

// ----- FONT FETCH -----
let fontCategory = {};
let fontCommand = {};
async function fetchFonts() {
  try {
    const [fontY, fontX] = await Promise.all([
      axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/nchelp/fonty.json").then(r => r.data),
      axios.get("https://raw.githubusercontent.com/noobcore404/NC-STORE/main/nchelp/fontx.json").then(r => r.data)
    ]);
    fontCategory = fontY;
    fontCommand = fontX;
  } catch (e) {
    console.error("Failed to fetch fonts:", e);
  }
}

function applyFont(text, fontMap) {
  return [...text].map(c => fontMap[c] || c).join("");
}

// ----- GET CATEGORY FROM PATH -----
function getCategoryFromPath(commandPath) {
  if (!commandPath) return "other";

  try {
    const normalizedPath = path.normalize(commandPath);
    const dirName = path.dirname(normalizedPath);

    const category = path.basename(dirName).toLowerCase();

    if (dirName.endsWith('cmds') || dirName === '.' || dirName === '') {
      return "general";
    }

    return category || "general";
  } catch (e) {
    console.error("Error getting category from path:", e);
    return "other";
  }
}

// ----- HELP MODULE -----
module.exports = {
  config: {
    name: "help",
    version: "7.6",
    modify: ["NC-XNIL", "NC-SAIM"],
    author: "NoobCore Team",
    countDown: 5,
    role: 0,
    autoUnseen: 40,
    usePrefix: true,
    premium: false,
    aliases: ["menu"],
    shortDescription: { en: "Show bot commands by page, category, or single command details" },
    longDescription: { en: "Compact help menu — 100 commands per page. Use help c category_name to browse categories." },
    guide: {
      en: [
        "{pn} → list commands by page (100/pg)",
        "{pn} <page> → open specific page",
        "{pn} <command> → details for a command",
        "{pn} category → list all categories",
        "{pn} category <name> [page] → list commands in a category"
      ].join("\n")
    },
    priority: 1
  },

  ncStart: async function({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);

    await Promise.all([fetchCategoryEmoji(), fetchFonts()]); 

    // Collect all commands with category from path
    const all = [];
    for (const [name, cmd] of commands) {
      if (!cmd?.config) continue;

      const cmdRole = typeof cmd.config.role === "number" ? cmd.config.role : 0;
      if (cmdRole > role) continue;

      // Get category from file path only
      let category = "other";
      if (cmd.config.filePath) {
        category = getCategoryFromPath(cmd.config.filePath);
      } else if (cmd.config.dirPath) {
        category = getCategoryFromPath(cmd.config.dirPath);
      } else if (cmd.location) {
        // Fallback to location property if filePath not set
        category = getCategoryFromPath(cmd.location);
      }

      all.push({ 
        name, 
        category: normalizeCat(category), 
        priority: cmd.config.priority || cmd.priority || 0 
      });
    }

    // Sort commands
    all.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      return a.name.localeCompare(b.name);
    });

    // Create category index
    const catIndex = all.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item.name);
      return acc;
    }, {});

    const pages = chunkArray(all, PER_PAGE);
    const totalPages = Math.max(1, pages.length);

    if (!args.length) return sendPage(1);

    const first = String(args[0]).toLowerCase();
    if (["category", "c", "-c", "--category"].includes(first)) {
      if (!args[1]) return sendCategoryList();

      const rawCat = normalizeCat(args[1]);
      const matchedCat = findCategory(rawCat, Object.keys(catIndex));
      const pageNum = Number.isInteger(Number(args[2])) && Number(args[2]) > 0 ? Number(args[2]) : 1;

      if (!matchedCat) {
        return message.reply(
          `❌ Category "${applyFont(args[1], fontCategory)}" not found.\nAvailable: ${Object.keys(catIndex).map(c => applyFont(c, fontCategory)).join(", ")}\nUse: ${prefix}help c <name> [page]`
        );
      }
      return sendCategory(matchedCat, pageNum);
    }

    const maybePage = parseInt(args[0], 10);
    if (!isNaN(maybePage) && maybePage >= 1 && maybePage <= totalPages) 
      return sendPage(maybePage);

    const query = args[0].toLowerCase();
    let cmd = commands.get(query);
    if (!cmd && aliases.has(query)) cmd = commands.get(aliases.get(query));

    if (!cmd) {
      const maybeCat = findCategory(normalizeCat(query), Object.keys(catIndex));
      if (maybeCat) return sendCategory(maybeCat, 1);
      return message.reply(`❌ Command or category "${applyFont(query, fontCommand)}" not found.\nTry: ${prefix}help category`);
    }

    return sendCommandDetail(cmd);

    // ===== HELPERS =====
    async function sendCommandDetail(cmd) {
      const cfg = cmd.config || {};
      const name = cfg.name || "unknown";
      const version = cfg.version || "1.0";
      const author = cfg.author || "unknown";
      const cooldown = cfg.countDown || cfg.cooldown || 1;
      const roleText = cfg.role === 0 ? "👥 All Users" : 
                      cfg.role === 1 ? "👑 Group Admins" : 
                      cfg.role === 2 ? "🤖 Bot Admins" : 
                      cfg.role === 3 ? "💻 Creator" : "❓ Unknown Role";
      const aliasesList = Array.isArray(cfg.aliases) && cfg.aliases.length ? cfg.aliases.join(", ") : "None";

      // Get category from file path, with fallback to location
      let category = "other";
      if (cfg.filePath) {
        category = getCategoryFromPath(cfg.filePath);
      } else if (cfg.dirPath) {
        category = getCategoryFromPath(cfg.dirPath);
      } else if (cmd.location) {
        category = getCategoryFromPath(cmd.location);
      }
      category = capitalize(category);

      const emoji = categoryEmoji[category.toLowerCase()] || "";
      const shortDesc = typeof cfg.shortDescription === "string" ? cfg.shortDescription : cfg.shortDescription?.en || "";

      let guide = cfg.guide || "";
      if (typeof guide === "object") guide = guide.en || Object.values(guide)[0] || "";
      guide = guide.replace(/\{prefix\}|\{p\}/g, prefix)
                   .replace(/\{name\}|\{n\}/g, name)
                   .replace(/\{pn\}/g, prefix + name);

      const premium = cfg.premium || false;
      const modify = cfg.modify || ["NoobCore Team"];
      const usePrefix = cfg.usePrefix !== false;

      let msg = `╭─╼════════════════╾─╮\n`;
      msg += `│ 📘 Command: ${applyFont(prefix + name, fontCommand)}\n`;
      msg += `│ 🗂️ Category: ${emoji} | ${applyFont(category, fontCategory)}\n`;
      msg += `│ 📄 Description: ${shortDesc || "No description"}\n`;
      msg += `│ 🧩 Aliases: ${aliasesList}\n`;
      msg += `│ ⚙️ Version: ${version}\n`;
      msg += `│ ⏳ Cooldown: ${cooldown}s\n`;
      msg += `│ 🧷 Role: ${roleText}\n`;
      msg += `│ 👑 Author: ${author}\n`;
      msg += `│ 💎 Premium Only: ${premium ? "✅ Yes" : "❌ No"}\n`;
      msg += `│ 🧮 modified by: ${modify} \n`;
      msg += `│ 🔤 Use Prefix: ${usePrefix ? "✅ Yes" : "❌ No"}\n`;
      msg += `╰─╼════════════════╾─╯\n`;

      msg += guide ? guide.split("\n").map(l => "│ 📜 " + l).join("\n") + "\n" : "│ 📜 Usage: No guide available\n";
      msg += `╰─╼════════════════╾─╯`;

      return message.send({ body: msg });
    }

    async function sendPage(pageNum) {
      const page = Math.max(1, Math.min(totalPages, pageNum));
      const items = pages[page - 1] || [];

      const cats = {};
      for (const { name, category } of items) {
        if (!cats[category]) cats[category] = [];
        cats[category].push(name);
      }

      let msg = `╭─╼━━━━━━━━━━━━╾─╮\n`;
      msg += `│  🌟  ${applyFont("IRFAN BOT MENU", fontCategory)}  🌟  \n`;
      msg += `╰─╼━━━━━━━━━━━━╾─╯\n\n`;

      for (const cat of Object.keys(cats).sort()) {
        const emoji = categoryEmoji[cat] || "📁";
        const lines = chunkCommands(cats[cat].sort(), 50, t => applyFont(t, fontCommand));
        msg += `╭─╼━━━━━━━━━━━━╾─╮\n`;
        msg += `│ ${emoji} ${applyFont(cat.toUpperCase(), fontCategory)}\n`;
        msg += `├─╼━━━━━━━━━━━━╾─╯\n`;
        for (const l of lines) msg += `│ ${l}\n`;
        msg += `╰─╼━━━━━━━━━━━━╾─╯\n\n`;
      }

      msg += `╭─╼━━━━━━━━━━━━╾─╮\n`;
      msg += `│ 💡 ${applyFont("Total Commands", fontCategory)}: ${all.length}\n`;
      msg += `│ 📖 ${applyFont("Page", fontCategory)}: ${page} / ${totalPages}\n`;
      msg += `│ 🤖 ${applyFont("Bot Name", fontCategory)}: ${global.noobCore.ncsetting.nickNameBot}\n`;
      msg += `╰─╼━━━━━━━━━━━━╾─╯\n`;

      const buttons = [
        { title: "Admin Info", url: "https://www.facebook.com/Irfan.Khan.0430" },
        { title: "Support Group", url: "https://m.me/j/AbY_X-8X8X8X8X8X/" }
      ];

      if (typeof message.sendCTA === "function") {
        return message.sendCTA(msg, buttons);
      }

      return message.reply({ body: msg });
    }

    async function sendCategoryList() {
      const entries = Object.entries(catIndex).sort((a, b) => a[0].localeCompare(b[0]));
      let msg = `━━━━━━━━━━━━━━\n🗂️ CATEGORIES\n`;

      for (const [cat, names] of entries) {
        const emoji = categoryEmoji[cat] || "";
        msg += `• ${emoji} | ${applyFont(cat, fontCategory)} — ${names.length}\n`;
      }

      msg += `━━━━━━━━━━━━━━\nUse: ${prefix}help c <name> [page]\nExample: ${prefix}help c tools\n━━━━━━━━━━━━━━`;

      return message.reply({ body: msg });
    }

    async function sendCategory(cat, pageNum) {
      const names = (catIndex[cat] || []).sort();
      if (!names.length) return message.reply(`❌ No commands in category "${applyFont(cat, fontCategory)}".`);

      const chunks = chunkArray(names, PER_PAGE);
      const total = chunks.length || 1;
      const page = Math.max(1, Math.min(total, pageNum));
      const lines = chunkCommands(chunks[page - 1], 50, t => applyFont(t, fontCommand));

      let msg = `━━━━━━━━━━━━━━\n🗂️ CATEGORY: ${applyFont(cat, fontCategory)}\n`;
      for (const l of lines) msg += `${l}\n`;
      msg += `\nTotal: ${names.length} command(s) | Page ${page}/${total}\nℹ️ View details: ${prefix}help <command>\n━━━━━━━━━━━━━━`;

      return message.reply({ body: msg });
    }

    function findCategory(queryCat, catList) {
      if (!queryCat) return null;
      if (catList.includes(queryCat)) return queryCat;
      return catList.find(c => c.startsWith(queryCat) || c.includes(queryCat)) || null;
    }
  }
};