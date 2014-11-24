var chrome = require('./chrome-sdk/chrome');
chrome({
    browser_action: {
        default_title: "Darkwallet",
        default_icon: {
            "16": "./images/icon_16.png",
            "32": "./images/icon_32.png",
            "64": "./images/icon_64.png",
            "128": "./images/icon_128.png"
        },
        default_popup: "html/popup.html"
    }
});
