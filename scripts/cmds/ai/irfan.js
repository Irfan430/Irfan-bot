const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = {
  name: "irfan",
  version: "3.0",
  author: "irfan",
  role: 0,
  shortDescription: "Irfan AI - Smart Memory Bot",
  category: "ai"
};

const NIX = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

// ========== Memory System ==========

const DATA_DIR = path.join(process.cwd(), "data", "irfan", "userinfo");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getUserFile(senderID) {
  return path.join(DATA_DIR, `${senderID}.json`);
}

function loadUser(senderID) {
  ensureDir();
  const f = getUserFile(senderID);

  if (!fs.existsSync(f)) {
    return { permanent: { name: null, age: null, favorites: [] }, history: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) {
    return { permanent: { name: null, age: null, favorites: [] }, history: [] };
  }
}

function saveUser(senderID, data) {
  ensureDir();
  fs.writeFileSync(getUserFile(senderID), JSON.stringify(data, null, 2), "utf8");
}

function addHistory(senderID, userMsg, botReply) {
  const data = loadUser(senderID);

  data.history.push({ role: "user", content: userMsg });
  data.history.push({ role: "assistant", content: botReply });

  if (data.history.length > 20) {
    data.history = data.history.slice(data.history.length - 20);
  }

  saveUser(senderID, data);
}

function extractPermanent(senderID, msg) {
  const data = loadUser(senderID);

  const nameM = msg.match(/(?:আমার নাম|my name is|i(?:'m| am))\s+([a-zA-Z\u0980-\u09FF]{2,20})/i);
  if (nameM) data.permanent.name = nameM[1];

  const ageM = msg.match(/(?:আমার বয়স|i(?:'m| am))\s+(\d{1,3})\s*(?:বছর|years?|yr)?/i);
  if (ageM) data.permanent.age = parseInt(ageM[1]);

  const favM = msg.match(/(?:আমি|i)\s+(?:পছন্দ করি|like|love|ভালোবাসি|enjoy)\s+(.+?)(?:[।.!?]|$)/i);

  if (favM) {
    const fav = favM[1].trim();

    if (fav && !data.permanent.favorites.includes(fav)) {
      data.permanent.favorites.push(fav);

      if (data.permanent.favorites.length > 10) {
        data.permanent.favorites.shift();
      }
    }
  }

  saveUser(senderID, data);
}

// ========== Prompt Builder ==========

function buildFullPrompt(gender, name, permanent, history, userMessage) {

  const facts = [];

  if (name) facts.push("নাম: " + name);
  if (permanent.age) facts.push("বয়স: " + permanent.age + " বছর");

  if (permanent.favorites && permanent.favorites.length) {
    facts.push("পছন্দ: " + permanent.favorites.join(", "));
  }

  const memoryBlock = facts.length
    ? "[ইউজার সম্পর্কে তুমি জানো: " + facts.join(" | ") + "] এই তথ্য naturally use করো。\n\n"
    : "";

  let persona = "";

  if (gender === "Female") {
    persona = "তুমি Irfan। একজন charming মজাদার ছেলে। মেয়েদের সাথে sweet playful respectful ভাবে কথা বলো। মাঝে মাঝে emoji ব্যবহার করো।";
  }

  else if (gender === "Male") {
    persona = "তুমি Irfan। একদম chill best friend vibe। casual funny বাংলিশ mix করে কথা বলো। ভাই ব্রো মামা টাইপ tone।";
  }

  else {
    persona = "তুমি Irfan, একটা friendly AI assistant।";
  }

  let historyText = "";

  for (let i = 0; i < history.length; i++) {
    const h = history[i];

    if (h.role === "user") historyText += "User: " + h.content + "\n";
    else historyText += "Irfan: " + h.content + "\n";
  }

  return persona + "\n\n" + memoryBlock + historyText + "User: " + userMessage + "\nIrfan:";
}

// ========== Helpers ==========

function genConvert(gender) {
  if (gender === 2 || gender === "MALE") return "Male";
  if (gender === 1 || gender === "FEMALE") return "Female";
  return "Unknown";
}

function getImageUrl(event) {

  const sources = [
    event.messageReply && event.messageReply.attachments,
    event.attachments
  ];

  for (let i = 0; i < sources.length; i++) {

    const list = sources[i];

    if (!list || !list.length) continue;

    const att = list[0];

    if (["photo", "sticker", "animated_image"].includes(att.type)) {
      return att.url;
    }
  }

  return null;
}

async function getBaseApi() {

  const res = await axios.get(NIX, { timeout: 10000 });

  const base = res.data && res.data.api;

  if (!base) throw new Error("API config missing");

  return base;
}

// ========== AI Call ==========

async function askAI(senderID, prompt, gender, name, permanent, imageUrl) {

  const baseApi = await getBaseApi();

  const userData = loadUser(senderID);

  const fullPrompt = buildFullPrompt(
    gender,
    name,
    permanent,
    userData.history,
    prompt
  );

  let url;

  if (imageUrl) {

    url =
      baseApi +
      "/gemini-pro?prompt=" +
      encodeURIComponent(fullPrompt) +
      "&url=" +
      encodeURIComponent(imageUrl);

  } else {

    url =
      baseApi +
      "/gemini?prompt=" +
      encodeURIComponent(fullPrompt);

  }

  const res = await axios.get(url, { timeout: 20000 });

  const reply = res.data && res.data.response;

  if (!reply) throw new Error("Empty response");

  return reply;
}

// ========== Core Handler ==========

async function handleMessage(message, event, usersData, api, question) {

  if (!question || !question.trim()) {
    return message.reply("কিছু জিজ্ঞেস করো আমাকে 😊");
  }

  try {

    const user = await usersData.get(event.senderID).catch(() => null);
    const fb = await api.getUserInfo(event.senderID).catch(() => null);

    const fbName =
      (fb && fb[event.senderID] && fb[event.senderID].name) || "Friend";

    const gender = genConvert(
      (user && user.gender) ||
      (fb && fb[event.senderID] && fb[event.senderID].gender)
    );

    const imageUrl = getImageUrl(event);

    const userData = loadUser(event.senderID);

    if (!userData.permanent.name && fbName !== "Friend") {
      userData.permanent.name = fbName;
      saveUser(event.senderID, userData);
    }

    extractPermanent(event.senderID, question);

    const fresh = loadUser(event.senderID);

    const displayName = fresh.permanent.name || fbName;

    const reply = await askAI(
      event.senderID,
      question,
      gender,
      displayName,
      fresh.permanent,
      imageUrl
    );

    addHistory(event.senderID, question, reply);

    message.reply(reply, (_, info) => {

      if (!info) return;

      global.noobCore.ncReply.set(info.messageID, {
        commandName: "irfan",
        author: event.senderID
      });

    });

  } catch (e) {

    console.error("[Irfan Error]", e.message);

    message.reply("AI এখন ঘুমাচ্ছে 😴 একটু পরে try করো।");

  }

}

// ========== Exports ==========

async function ncStart(ctx) {

  const question = ctx.args.join(" ");

  await handleMessage(
    ctx.message,
    ctx.event,
    ctx.usersData,
    ctx.api,
    question
  );

}

async function ncReply(ctx) {

  if (ctx.event.senderID !== ctx.Reply.author) return;

  await handleMessage(
    ctx.message,
    ctx.event,
    ctx.usersData,
    ctx.api,
    ctx.event.body
  );

}

module.exports = {
  config,
  ncStart,
  ncReply
};