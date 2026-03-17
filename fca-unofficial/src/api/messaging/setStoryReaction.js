"use strict";

const log = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return async function setStoryReaction(storyID, reaction, callback) {
    let resolveFunc = () => {};
    let rejectFunc = () => {};
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = (err, res) => {
        if (err) return rejectFunc(err);
        resolveFunc(res);
      };
    }

    const reactionMap = {
      like: "LIKE",
      love: "LOVE",
      haha: "HAHA",
      wow: "WOW",
      sad: "SAD",
      angry: "ANGRY",
      heart: "LOVE"
    };

    const type = reactionMap[reaction.toLowerCase()] || "LIKE";

    try {
      const variables = {
        input: {
          client_mutation_id: Math.floor(Math.random() * 1024).toString(),
          actor_id: ctx.userID,
          story_id: storyID,
          reaction: type
        }
      };

      const form = {
        av: ctx.userID,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "StoriesReactionMutation",
        variables: JSON.stringify(variables),
        doc_id: "5493172230761756" // Placeholder doc_id, needs verification
      };

      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        throw resData.errors;
      }

      callback(null, resData.data);
    } catch (err) {
      log.error("setStoryReaction", err);
      callback(err);
    }

    return returnPromise;
  };
};
