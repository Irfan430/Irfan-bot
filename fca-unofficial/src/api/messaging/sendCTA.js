"use strict";

const { generateOfflineThreadingID } = require("../../utils/format");

module.exports = function (defaultFuncs, api, ctx) {
  return async function sendCTA(threadID, text, buttons, callback) {
    let resolveFunc, rejectFunc;
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = (err, data) => {
        if (err) return rejectFunc(err);
        resolveFunc(data);
      };
    }

    if (!ctx.mqttClient) {
      const err = new Error("Not connected to MQTT");
      callback(err);
      return returnPromise;
    }

    const reqID = ++ctx.wsReqNumber;
    const taskID = ++ctx.wsTaskNumber;

    // buttons format: [{ title: "Click Me", url: "https://google.com" }]
    const ctaButtons = buttons.map(btn => ({
      title: btn.title,
      action_url: btn.url,
      button_type: 1 // URL button
    }));

    const payload = {
      epoch_id: generateOfflineThreadingID(),
      tasks: [
        {
          label: "46",
          payload: JSON.stringify({
            thread_id: threadID,
            otid: generateOfflineThreadingID(),
            source: 2097153,
            send_type: 1,
            sync_group: 1,
            mark_thread_read: 1,
            text: text,
            initiating_source: 0,
            text_has_links: 1,
            cta_data: {
              cta_title: text,
              cta_buttons: ctaButtons
            }
          }),
          queue_name: threadID,
          task_id: taskID,
          failure_count: null
        }
      ],
      version_id: "24804310205905615"
    };

    const content = {
      app_id: "2220391788200892",
      payload: JSON.stringify(payload),
      request_id: reqID,
      type: 3
    };

    ctx.mqttClient.publish("/ls_req", JSON.stringify(content), { qos: 1, retain: false });
    
    // We don't wait for response here to keep it simple, but could add listener like in sendMessage
    callback(null, { success: true, request_id: reqID });
    return returnPromise;
  };
};
