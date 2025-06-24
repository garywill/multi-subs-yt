"use strict";

console.log("background.js");

chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log("Detected timedtext URL:", details.url);
        const cc_url = details.url;
        const cc_url_obj = new URL(cc_url);
        const pot = cc_url_obj.searchParams.get("pot");
        console.log(pot);
        chrome.storage.session.set({ cc_pot: pot });
    },
    { urls: ["*://www.youtube.com/api/timedtext*"] },
    []
);

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.action === "get-pot") {
        console.log('background receive "get-pot"');
        const cc_pot =  (await chrome.storage.session.get() )['cc_pot'] || "" ;

        console.log("send response cc_pot", cc_pot);

        sendResponse(cc_pot);

        return cc_pot;
    }
});


