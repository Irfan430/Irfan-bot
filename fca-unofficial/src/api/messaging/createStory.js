"use strict";

const utils = require("../../utils/format");
const log = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return async function createStory(data, callback) {
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

    try {
      if (!data || (!data.attachment && !data.body)) {
        throw new Error("Story must have an attachment or a body.");
      }

      let attachmentID = null;
      if (data.attachment) {
        const uploadRes = await api.uploadAttachment(data.attachment);
        if (uploadRes && uploadRes.length > 0) {
          attachmentID = uploadRes[0];
        } else {
          throw new Error("Failed to upload story attachment.");
        }
      }

      const variables = {
        input: {
          client_mutation_id: Math.floor(Math.random() * 1024).toString(),
          actor_id: ctx.userID,
          source: "WWW",
          story_type: "STORY",
          text: data.body || "",
          attachment_id: attachmentID,
          audience: {
            privacy_scope: data.privacy || "EVERYONE"
          }
        }
      };

      const form = {
        av: ctx.userID,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "StoriesCreateMutation",
        variables: JSON.stringify(variables),
        doc_id: "5493172230761756" // Latest known doc_id for story creation
      };

      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        throw resData.errors;
      }

      callback(null, resData.data.story_create);
    } catch (err) {
      log.error("createStory", err);
      callback(err);
    }

    return returnPromise;
  };
};
