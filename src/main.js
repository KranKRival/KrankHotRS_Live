// Global Configuration
let quality = "1080p60";
let live = false; // true if live on Kick.com
let alreadySwitched = false; // false if on twitch player, true if on Kick.com player
let kickCheck = 1000; // how often the live check updates for Kick.com (ms)
var kickCount = 10;
var interval;

// DOM Elements & URL Parsing
const platformSwitchBtn = document.getElementById('platformSwitch');
const channelBtn = document.getElementById('channelSelector'); 
const urlParams = new URLSearchParams(window.location.search);

// Automatically set host (handles localhost, IP, or GitHub Pages domain)
const parentURL = window.location.hostname || "krankrival.github.io";

// Determine Channel ID cleanly upon script load
let channelID = getInitialChannel();

// Cookie Helper Functions
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// Resolution Helper to determine starting channel cleanly
function getInitialChannel() {
    let qChannel = urlParams.get("channel");
    if (qChannel && qChannel !== "null" && qChannel.trim() !== "") {
        return qChannel.trim();
    }
    
    let cChannel = getCookie("channel");
    if (cChannel && cChannel !== "null" && cChannel.trim() !== "") {
        return cChannel.trim();
    }
    
    // Default fallback if no query parameter or cookie exists
    return "krankhotrs";
}

// Resolution Helper to determine quality setting
function getInitialQuality() {
    let qQuality = urlParams.get("quality");
    if (!qQuality || qQuality === "null" || qQuality.trim() === "") {
        return "720p60";
    }
    if (qQuality === "best") {
        return "chunked";
    }
    return qQuality;
}

// Embedded Player Builders
function buildTwitch(channel, targetQuality) {
    if (!channel || channel === "null" || channel === "") channel = "krankhotrs";
    
    const playerElem = document.getElementById('twitch-player');
    const chatElem = document.getElementById('twitch-chat');
    
    if (playerElem) {
        playerElem.src = `https://player.twitch.tv/?channel=${channel}&parent=${parentURL}&player=popout&quality=${targetQuality}`;
    }
    if (chatElem) {
        chatElem.src = `https://www.giambaj.it/twitch/jchat/v2/?channel=${channel}&bots=true&hide_commands=true&size=1&font=2`;
    }
    
    if (platformSwitchBtn) platformSwitchBtn.setAttribute("current", "twitch");
    alreadySwitched = false;
    channelID = channel;
}

function buildKick(channel) {
    if (!channel || channel === "null" || channel === "") channel = "krankhotrs";
    
    const playerElem = document.getElementById('twitch-player');
    const chatElem = document.getElementById('twitch-chat');
    
    if (playerElem) {
        playerElem.src = `https://player.kick.com/${channel}?muted=false&autoplay=true&allowfullscreen=true`;
    }
    if (chatElem) {
        chatElem.src = `https://chat-overlay.matinaniss.com/?channel=${channel}&sevenTVCosmeticsEnabled=true&sevenTVEmotesEnabled=true&theme=dark&textShadow=small&textSize=medium&animation=none&showPinEnabled=false&textBackgroundEnabled=true`;
    }
    
    if (platformSwitchBtn) platformSwitchBtn.setAttribute("current", "kick");
    alreadySwitched = true;
    channelID = channel;
}

// Stream Monitoring & Switching
async function checkStream(channel) {
    try {
        let response = await fetch(`https://kick.com/api/v2/channels/${channel}`);
        let data = await response.json();
        if (response.status === 200 && data.livestream && data.livestream.is_live === true) {
            setLive();
        } else {
            setOffline();
        }
    } catch (err) {
        setOffline();
    }
}

function setLive() { live = true; }
function setOffline() { live = false; }

function switchPlatform() {
    if (!platformSwitchBtn) return;
    if (platformSwitchBtn.getAttribute('current') === 'twitch') {
        buildKick(channelID);
    } else if (platformSwitchBtn.getAttribute('current') === 'kick') {
        buildTwitch(channelID, quality);
    }
}

function platformCheck() {
    checkStream(channelID);
    if (alreadySwitched && !live) {
        switchPlatform();
    } else if (!alreadySwitched && live) {
        switchPlatform();
    }
}

function startKickCheck() {
    clearInterval(interval);
    kickCount--;
    platformCheck();
    kickCheck = (kickCount <= 0) ? 10000 : 1000;
    interval = setInterval(startKickCheck, kickCheck);
}

function channelSelector() {
    deleteCookie("channel");
    clearInterval(interval);
    kickCount = 10;
    kickCheck = 1000;
    let selectedChannel = prompt("Set Channel", "xqc");
    if (selectedChannel && selectedChannel.trim() !== "") {
        channelID = selectedChannel.trim();
        setCookie("channel", channelID, 365);
    }
    buildTwitch(channelID, quality);
    startKickCheck();
}

// App Initialization
function init() {
    quality = getInitialQuality();
    setCookie("channel", channelID, 365);
    buildTwitch(channelID, quality);
    startKickCheck();
}

// Run initialization immediately on load
init();
