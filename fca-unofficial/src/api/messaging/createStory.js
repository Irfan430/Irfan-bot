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
        log.info("Uploading story attachment...");
        const uploadRes = await api.uploadAttachment(data.attachment);
        if (uploadRes && uploadRes.length > 0) {
          attachmentID = uploadRes[0];
          log.info(`Attachment uploaded successfully. ID: ${attachmentID}`);
        } else {
          throw new Error("Failed to upload story attachment. No ID returned.");
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
        doc_id: "5493172230761756"
      };

      log.info("Sending story creation request to Facebook...");
      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      
      if (!res || !res.body) {
        throw new Error("Empty response from Facebook.");
      }

      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        log.error("createStory", JSON.stringify(resData.errors));
        throw new Error(resData.errors[0].message || "Facebook API error.");
      }

      log.info("Story created successfully!");
      callback(null, resData.data ? resData.data.story_create : resData);
    } catch (err) {
      const errMsg = err.message || JSON.stringify(err);
      log.error("createStory", errMsg);
      callback(err);
    }

    return returnPromise;
  };
};
