"use strict";

const { parseAndCheckLogin } = require("../../utils/client");
const log = require("../../../func/logAdapter");

module.exports = function (defaultFuncs, api, ctx) {
  return function getThreadMedia(threadID, limit, callback) {
    let resolveFunc = function () { };
    let rejectFunc = function () { };
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err, data) {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    const form = {
      av: ctx.userID,
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "CometSharedMediaViewQuery",
      doc_id: "5333134240065849", // Example doc_id for shared media
      variables: JSON.stringify({
        count: limit || 20,
        threadID: threadID,
        is_comet: true
      })
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData.errors) {
          throw resData;
        }
        callback(null, resData.data);
      })
      .catch(function (err) {
        log.error("getThreadMedia", err);
        return callback(err);
      });

    return returnPromise;
  };
};
