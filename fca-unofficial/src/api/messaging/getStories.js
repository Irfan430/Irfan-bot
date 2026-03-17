"use strict";

const utils = require("../../utils/format");
const log = require("../../../func/logger");

module.exports = function (defaultFuncs, api, ctx) {
  return async function getStories(callback) {
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
          client_mutation_id: Math.floor(Math.random() * 1024).toString(),
          actor_id: ctx.userID,
          source: "WWW"
        }
      };

      const form = {
        av: ctx.userID,
        fb_api_caller_class: "RelayModern",
        fb_api_req_friendly_name: "StoriesTrayQuery",
        variables: JSON.stringify(variables),
        doc_id: "5493172230761756" // Reusing doc_id for now, might need specific one
      };

      const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form);
      const resData = JSON.parse(res.body.replace("for (;;);", ""));

      if (resData.errors) {
        throw resData.errors;
      }

      callback(null, resData.data.stories_tray);
    } catch (err) {
      log.error("getStories", err);
      callback(err);
    }

    return returnPromise;
  };
};
