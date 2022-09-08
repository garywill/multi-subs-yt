var isFirefox = false;
var isChrome = false;
isFirefox = chrome.runtime.getURL('').startsWith('moz-extension://');
isChrome = chrome.runtime.getURL('').startsWith('chrome-extension://');

if (isFirefox)
    window.chrome = window.browser;

async function getStor(key) {
    
    if ( ! key)
        return (await chrome.storage.local.get());
    else
        return (await chrome.storage.local.get())[key];
    
}

async function setStor(key, val) {
    var obj = new Object;
    obj[key] = val;
    await chrome.storage.local.set( obj );
}
