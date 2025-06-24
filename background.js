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
