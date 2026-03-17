"use strict";

const log = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return async function setPostComment(postID, text, callback) {
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
      const variables = {
        input: {
          actor_id: ctx.userID,
          feedback_id: Buffer.from("feedback:" + postID).toString("base64"),
          message: {
            text: text
          },
          client_mutation_id: Math.floor(Math.random() * 1024).toString()
        }
      };

      const form = {
        av: ctx.userID,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "CometUFICommentCreateMutation",
        variables: JSON.stringify(variables),
        doc_id: "4769042373179384" // Placeholder doc_id
      };

      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        throw resData.errors;
      }

      callback(null, resData.data);
    } catch (err) {
      log.error("setPostComment", err);
      callback(err);
    }

    return returnPromise;
  };
};
