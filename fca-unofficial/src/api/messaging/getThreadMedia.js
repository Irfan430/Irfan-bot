"use strict";

const { parseAndCheckLogin } = require("../../utils/client");
const log = require("../../../func/logAdapter");

// Updated doc_id for CometSharedMediaViewQuery
const SHARED_MEDIA_DOC_ID = "6195050423874046";

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
      doc_id: SHARED_MEDIA_DOC_ID,
      variables: JSON.stringify({
        count: limit || 20,
        id: String(threadID),
        mediaType: "IMAGES_AND_VIDEOS",
        scale: 1
      }),
      server_timestamps: true
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData && resData.errors) {
          const errMsg = Array.isArray(resData.errors)
            ? resData.errors.map(e => e.message || String(e)).join(", ")
            : String(resData.errors);
          throw new Error(errMsg);
        }
        callback(null, resData && resData.data ? resData.data : resData);
      })
      .catch(function (err) {
        log.error("getThreadMedia", err && err.message ? err.message : err);
        return callback(err);
      });

    return returnPromise;
  };
};
