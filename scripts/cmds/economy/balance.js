const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");
const fetch = require("node-fetch");

// ========== CONFIGURABLE SETTINGS ==========
const CONFIG = {
    // Currency Settings
    currency: {
        symbol: "$",
        name: "Dollar",
        decimalPlaces: 2
    },
    
    // Transfer Settings
    transfer: {
        minAmount: 10,
        maxAmount: 1000000,
        taxRates: [
            { max: 1000, rate: 2 },
            { max: 10000, rate: 5 },
            { max: 50000, rate: 8 },
            { max: 100000, rate: 10 },
            { max: 500000, rate: 12 },
            { max: 1000000, rate: 15 }
        ],
        dailyLimit: 500000
    },
    
    // Daily Bonus Settings
    dailyBonus: {
        baseAmount: 100,
        streakMultiplier: 0.1, // 10% increase per day
        maxStreak: 30,
        resetHours: 21
    },
    
    // Card Design Settings
    card: {
        width: 1000,
        height: 500,
        borderRadius: 30,
        glowIntensity: 25
    },
    
    // Tier System
    tiers: [
        { name: "Starter", min: 0, max: 999, color: "#cd7f32", badge: "🥉", multiplier: 1.0 },
        { name: "Rookie", min: 1000, max: 4999, color: "#c0c0c0", badge: "🥈", multiplier: 1.1 },
        { name: "Pro", min: 5000, max: 19999, color: "#ffd700", badge: "🥇", multiplier: 1.2 },
        { name: "Elite", min: 20000, max: 49999, color: "#e5e4e2", badge: "💎", multiplier: 1.3 },
        { name: "Master", min: 50000, max: 99999, color: "#0ff", badge: "👑", multiplier: 1.5 },
        { name: "Legend", min: 100000, max: 499999, color: "#ff00ff", badge: "🌟", multiplier: 2.0 },
        { name: "God", min: 500000, max: Infinity, color: "#ff0000", badge: "⚡", multiplier: 3.0 }
    ]
};

// ========== FONT REGISTRATION ==========
try {
    const fontsDir = path.join(__dirname, "fonts");
    if (fs.existsSync(fontsDir)) {
        const fontFiles = fs.readdirSync(fontsDir);
        for (const fontFile of fontFiles) {
            if (fontFile.endsWith(".ttf") || fontFile.endsWith(".otf")) {
                const fontPath = path.join(fontsDir, fontFile);
                const fontName = path.basename(fontFile, path.extname(fontFile));
                registerFont(fontPath, { family: fontName });
            }
        }
        console.log("✅ Custom fonts loaded successfully");
    }
} catch (error) {
    console.log("⚠️ Using default fonts");
}

// ========== HELPER FUNCTIONS ==========

/**
 * Enhanced money formatter with multi-scale support
 */
function formatMoney(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return `${CONFIG.currency.symbol}0`;
    }
    
    amount = Number(amount);
    
    // Handle special cases
    if (amount === Infinity) return `${CONFIG.currency.symbol}∞`;
    if (amount === -Infinity) return `${CONFIG.currency.symbol}-∞`;
    if (!isFinite(amount)) return `${CONFIG.currency.symbol}NaN`;
    
    // Determine scale
    const scales = [
        { value: 1e18, suffix: "Qi", name: "Quintillion" },
        { value: 1e15, suffix: "Qa", name: "Quadrillion" },
        { value: 1e12, suffix: "T", name: "Trillion" },
        { value: 1e9, suffix: "B", name: "Billion" },
        { value: 1e6, suffix: "M", name: "Million" },
        { value: 1e3, suffix: "K", name: "Thousand" }
    ];
    
    const scale = scales.find(s => Math.abs(amount) >= s.value);
    
    if (scale) {
        const scaledValue = amount / scale.value;
        const formatted = Math.abs(scaledValue).toFixed(CONFIG.currency.decimalPlaces);
        const cleanValue = formatted.endsWith(".00") ? 
            formatted.slice(0, -3) : formatted;
        
        return `${amount < 0 ? "-" : ""}${CONFIG.currency.symbol}${cleanValue}${scale.suffix}`;
    }
    
    // Format regular numbers with commas
    const parts = Math.abs(amount).toFixed(CONFIG.currency.decimalPlaces).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    return `${amount < 0 ? "-" : ""}${CONFIG.currency.symbol}${parts.join(".")}`;
}

/**
 * Get tier information based on balance
 */
function getTierInfo(balance) {
    const validBalance = Number(balance) || 0;
    
    for (const tier of CONFIG.tiers) {
        if (validBalance >= tier.min && validBalance <= tier.max) {
            return {
                ...tier,
                glow: `${tier.color}80`,
                nextTier: CONFIG.tiers[CONFIG.tiers.indexOf(tier) + 1] || null,
                progress: tier.max === Infinity ? 100 : 
                    Math.min(100, ((validBalance - tier.min) / (tier.max - tier.min)) * 100)
            };
        }
    }
    
    // Fallback
    return {
        name: "Unknown",
        color: "#888888",
        badge: "❓",
        multiplier: 1.0,
        glow: "#88888880"
    };
}

/**
 * Calculate tax for transfer amount
 */
function calculateTax(amount) {
    let applicableRate = 0;
    
    for (const rate of CONFIG.transfer.taxRates) {
        if (amount <= rate.max) {
            applicableRate = rate.rate;
            break;
        }
    }
    
    // If amount exceeds all ranges, use the last rate
    if (applicableRate === 0) {
        applicableRate = CONFIG.transfer.taxRates[CONFIG.transfer.taxRates.length - 1].rate;
    }
    
    const tax = Math.ceil((amount * applicableRate) / 100);
    const total = amount + tax;
    
    return {
        rate: applicableRate,
        tax: tax,
        total: total,
        netAmount: amount
    };
}

/**
 * Create rounded rectangle path
 */
function createRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Draw banknote effect
 */
function drawBanknote(ctx, x, y, width, height, value, color) {
    ctx.save();
    
    // Banknote background
    ctx.fillStyle = color + "20";
    ctx.fillRect(x, y, width, height);
    
    // Banknote border
    ctx.strokeStyle = color + "80";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Banknote pattern
    ctx.fillStyle = color + "10";
    for (let i = 0; i < width; i += 20) {
        for (let j = 0; j < height; j += 20) {
            if ((i + j) % 40 === 0) {
                ctx.fillRect(x + i, y + j, 10, 10);
            }
        }
    }
    
    // Value text
    ctx.fillStyle = color;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(formatMoney(value), x + width / 2, y + height / 2 + 5);
    
    // Currency symbol
    ctx.font = "20px Arial";
    ctx.fillText(CONFIG.currency.symbol, x + width / 2, y + height / 2 - 15);
    
    ctx.restore();
}

/**
 * Draw progress bar
 */
function drawProgressBar(ctx, x, y, width, height, progress, color) {
    ctx.save();
    
    // Background
    ctx.fillStyle = "#333333";
    createRoundedRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    
    // Progress
    const progressWidth = Math.max(5, (progress / 100) * width);
    ctx.fillStyle = color;
    createRoundedRect(ctx, x, y, progressWidth, height, height / 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;
    createRoundedRect(ctx, x, y, width, height, height / 2);
    ctx.stroke();
    
    // Progress text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(progress)}%`, x + width / 2, y + height / 2 + 4);
    
    ctx.restore();
}

/**
 * Load user avatar with fallback
 */
async function loadUserAvatar(usersData, targetID) {
    try {
        const avatarURL = await usersData.getAvatarUrl(targetID);
        if (!avatarURL) return null;
        
        const response = await fetch(avatarURL);
        if (!response.ok) return null;
        
        const buffer = await response.buffer();
        if (buffer.length < 100) return null;
        
        return await loadImage(buffer);
    } catch (error) {
        console.log("Avatar load error:", error.message);
        return null;
    }
}

/**
 * Generate transaction ID
 */
function generateTransactionID() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `TX${timestamp}${random}`.toUpperCase();
}


module.exports = {
    config: {
        name: "balance",
        aliases: ["bal"],
        version: "2.1.0",
        author: "NoobCore Team",
        team: "NoobCore",
        countDown: 3,
        role: 0,
        shortDescription: {
            en: "💰 Advanced economy system with visual cards & secure transfers"
        },
        longDescription: {
            en: "Check your balance, transfer money, view leaderboard, and get daily bonuses with premium visual cards and secure transactions."
        },
        guide: {
            en: `╭─── 𝐄𝐂𝐎𝐍𝐎𝐌𝐘 ───╮\n│ 💰 {pn} - Check balance\n│ 👤 {pn} @user - Check someone\n│ 💸 {pn} transfer @user <amt>\n│ 🏆 {pn} top [page]\n│ 🎁 {pn} daily - Claim bonus\n╰────────────────╯`
        }
    },

    ncStart: async function ({ message, event, args, usersData, commandName, api }) {
        const { senderID, mentions, messageReply, threadID } = event;
        const command = args[0]?.toLowerCase();
        
        try {
            // Handle Transfer
            if (command === "transfer" || command === "send" || command === "pay") {
                const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
                const amount = parseInt(args[args.length - 1]);

                if (!targetID || isNaN(amount) || amount < CONFIG.transfer.minAmount) {
                    return message.reply(`╭─── 𝐒𝐘𝐒𝐓𝐄𝐌 ───╮\n│ ⚠️ Invalid transfer!\n│ 💰 Min: ${CONFIG.transfer.minAmount}\n╰──────────────╯`);
                }

                const senderData = await usersData.get(senderID);
                const taxInfo = calculateTax(amount);

                if (senderData.money < taxInfo.total) {
                    return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ Insufficient funds\n│ 💸 Need: ${formatMoney(taxInfo.total)}\n╰─────────────╯`);
                }

                const targetData = await usersData.get(targetID);
                senderData.money -= taxInfo.total;
                targetData.money += amount;

                await usersData.set(senderID, senderData);
                await usersData.set(targetID, targetData);

                const txID = generateTransactionID();
                return message.reply(`╭─── 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 ───╮\n│ ✅ Success!\n│ 👤 To: ${mentions[targetID] || "User"}\n│ 💰 Amount: ${formatMoney(amount)}\n│ 📉 Tax: ${formatMoney(taxInfo.tax)} (${taxInfo.rate}%)\n│ 🆔 ID: ${txID}\n╰────────────────╯`);
            }

            // Handle Daily
            if (command === "daily" || command === "claim") {
                const userData = await usersData.get(senderID);
                const now = Date.now();
                const lastDaily = userData.lastDaily || 0;
                const cooldown = 24 * 60 * 60 * 1000;

                if (now - lastDaily < cooldown) {
                    const remaining = cooldown - (now - lastDaily);
                    const hours = Math.floor(remaining / (60 * 60 * 1000));
                    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                    return message.reply(`╭─── 𝐃𝐀𝐈𝐋𝐘 ───╮\n│ ⏳ Already claimed!\n│ 🕒 Next in: ${hours}h ${minutes}m\n╰──────────────╯`);
                }

                const reward = CONFIG.dailyBonus.baseAmount;
                userData.money += reward;
                userData.lastDaily = now;
                await usersData.set(senderID, userData);

                return message.reply(`╭─── 𝐃𝐀𝐈𝐋𝐘 ───╮\n│ 🎁 Bonus Claimed!\n│ 💰 Reward: ${formatMoney(reward)}\n│ ✨ Come back tomorrow!\n╰──────────────╯`);
            }

            // Default: Show Balance Card
            const targetID = Object.keys(mentions)[0] || messageReply?.senderID || senderID;
            const userData = await usersData.get(targetID);
            const tier = getTierInfo(userData.money);

            const balMsg = `╭─── 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 ───╮\n` +
                `│ 👤 User: ${userData.name || "User"}\n` +
                `│ 💰 Money: ${formatMoney(userData.money)}\n` +
                `│ 🏆 Tier: ${tier.badge} ${tier.name}\n` +
                `├────────────────╮\n` +
                `│ 📈 Progress: ${Math.round(tier.progress)}%\n` +
                `╰────────────────╯`;

            return message.reply(balMsg);

        } catch (error) {
            console.error(error);
            return message.reply(`╭─── 𝐄𝐑𝐑𝐎𝐑 ───╮\n│ ❌ ${error.message}\n╰─────────────╯`);
        }
    }
};
