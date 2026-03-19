"use strict";

var utils = require("../../utils");

module.exports = function(defaultFuncs, api, ctx) {
    return function handleGroupPendingMember(groupID, userID, action, callback) {
        var resolveFunc = function() {};
        var rejectFunc = function() {};
        var returnPromise = new Promise(function(resolve, reject) {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        if (!callback) {
            callback = function(err, data) {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }

        var actionType = action === "approve" ? "APPROVE" : "DENY";

        var form = {
            fb_api_caller_class: "RelayModern",
            fb_api_req_friendly_name: "GroupsCometPendingMembersApproveMutation",
            variables: JSON.stringify({
                input: {
                    client_mutation_id: "1",
                    actor_id: ctx.userID,
                    group_id: groupID,
                    user_ids: [userID],
                    action: actionType
                }
            }),
            doc_id: "5343414125712345" // This is a placeholder for the actual doc_id, which often changes. 
            // In a real scenario, we'd use the most recent one found or a dynamic approach.
        };

        defaultFuncs
            .post("https://www.facebook.com/api/graphql/", ctx.jar, form)
            .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
            .then(function(resData) {
                if (resData.errors) {
                    throw resData;
                }
                return callback(null, resData);
            })
            .catch(function(err) {
                return callback(err);
            });

        return returnPromise;
    };
};
