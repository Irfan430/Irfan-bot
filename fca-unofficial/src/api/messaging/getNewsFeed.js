"use strict";

const log = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return async function getNewsFeed(limit = 10, callback) {
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
        count: limit,
        cursor: null,
        scale: 3
      };

      const form = {
        av: ctx.userID,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "NewsFeedQuery",
        variables: JSON.stringify(variables),
        doc_id: "4769042373179384" // CometUFIFeedbackReactMutation doc_id as placeholder
      };

      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        throw resData.errors;
      }

      callback(null, resData.data);
    } catch (err) {
      log.error("getNewsFeed", err);
      callback(err);
    }

    return returnPromise;
  };
};
