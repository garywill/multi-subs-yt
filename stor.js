async function getStor(key) {
    
    if ( ! key)
        return (await browser.storage.local.get());
    else
        return (await browser.storage.local.get())[key];
    
}

async function setStor(key, val) {
    var obj = new Object;
    obj[key] = val;
    await browser.storage.local.set( obj );
}
