/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 */


var onrd = new Array(); //on document ready
document.addEventListener('DOMContentLoaded', async (event) => {

    for (var i=0; i<onrd.length; ++i)
    {
        try{
            await Promise.resolve( onrd[i]() );
        }catch(err){
            console.error(err);
        }
    }
});

var cur_tab;

//var ytplayer;
var playerResponse;
var captionTracks;
var translationLanguages;

onrd.push(async function(){
    cur_tab = ( await chrome.tabs.query({
        currentWindow: true, active: true
    }) ) [0];




    chrome.scripting.executeScript({
        target: {tabId: cur_tab.id},
        files: ['inject.js'],
    });
    
    chrome.runtime.onMessage.addListener(async function(message, sender) { 
        // 
        // console.debug("popup receive message", message, sender);
        // console.debug(message);
        
        if (sender.tab.id == cur_tab.id) 
        {
            
            playerResponse = null;
            //console.debug("tab id matches");
            //document.getElementById("div_page_title").textContent = message['title'];
            //ytplayer = JSON.parse(message['ytplayer_json']);
            try {
                playerResponse = JSON.parse(message['playerResponse_json']);
            }catch (err) {
                show_refresh();
            }
            
            document.getElementById("div_connecting_tip").style.display="none";
            
            //console.debug(ytplayer);
            //console.debug(ytplayer.config);
            if (playerResponse === null || playerResponse === undefined )
            {
                show_refresh();
                return;
            }
            
            //const player_response = ytplayer.config.args.raw_player_response;
            
            var ytplayer_videoid = playerResponse.videoDetails.videoId;
            if ( typeof(ytplayer_videoid) === "string" && cur_tab.url.includes( ytplayer_videoid ) )
            {
                //console.debug("ytpleyr 与 url 一致");
            }else
                show_refresh();

            parse_ytplayer();
        }
        
    });
    
});

function show_refresh() {
    document.getElementById("div_refresh_tip").style.display="";
    document.getElementById("div_page_title").style.color="orange";
}
function parse_ytplayer()
{
    //const player_response = ytplayer.config.args.raw_player_response;
    
    if (playerResponse.captions) {
        captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
        translationLanguages = playerResponse.captions.playerCaptionsTracklistRenderer.translationLanguages;
    }else{
        captionTracks = [];
        translationLanguages = [];
    }
    
    document.getElementById("div_page_title").textContent = playerResponse.videoDetails.title;
    
    //console.debug(captionTracks);
    const selector_sub_lang = document.getElementById("selector-sub-lang");
    selector_sub_lang.innerHTML = "";
    captionTracks.forEach(async function (c, i) {
        var option = document.createElement("option");
        option.setAttribute("value", i);
        
        var text = c.name.simpleText;
    
        //if (c.isTranslatable)
        //    text += " (Translatable)";
        
        option.textContent = text;
        
        selector_sub_lang.appendChild(option);
        
        if (await getStor("orig_sub_lang") == c.vssId)
            selector_sub_lang.value = i;
    });
    
    //console.debug(translationLanguages);
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    translationLanguages.forEach(async function (c, i) {
        var option = document.createElement("option");
        option.setAttribute("value", i);
        
        var text = c.languageName.simpleText;
        
        option.textContent = text;
        
        selector_trans_lang.appendChild(option);
        
        if (await getStor("tran_sub_lang") == c.languageCode)
            selector_trans_lang.value = i;
    });
}

onrd.push( function() {
    document.getElementById("btn_disp_sub").onclick = function() {

        chrome.tabs.sendMessage(cur_tab.id, {
            action: "display_sub",
            url: get_subtitle_url(),
            kill_left: true
        });
        
        const selector_sub_lang = document.getElementById("selector-sub-lang");
        const cbox_trans = document.getElementById("cbox_trans");
        const selector_trans_lang = document.getElementById("selector-trans-lang");
        
        var orig_vssid = captionTracks[selector_sub_lang.value].vssId;
        setStor("orig_sub_lang", orig_vssid);
        //console.debug(getStor('orig_sub_lang'));
        
        if ( cbox_trans.checked) {
            var tran_lang = translationLanguages[selector_trans_lang.value].languageCode;
            setStor("tran_sub_lang", tran_lang);
        }
    };
});

onrd.push( function() {
    document.getElementById("btn_rm_sub").onclick = function() {
        chrome.tabs.sendMessage(cur_tab.id, {
            action: "remove_subs",
        });
    };
});

onrd.push( function() {
    document.getElementById("btn_url").onclick = function() {
        var url = get_subtitle_url();
        
        navigator.clipboard.writeText(url);
    };
});

onrd.push(function() {
    const cbox_trans = document.getElementById("cbox_trans");
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    cbox_trans.addEventListener("change", function() {
        if (cbox_trans.checked)
            selector_trans_lang.removeAttribute("disabled");
        else
            selector_trans_lang.setAttribute("disabled", "true");
    });
});

let pot;
let fetch_pot_timer_id;
onrd.push(function() {
    fetch_pot();
    fetch_pot_timer_id = window.setInterval( fetch_pot , 1000);
});
async function fetch_pot() {
    chrome.runtime.sendMessage( { action: "get-pot" } )
    .then(function(message) {
        console.log("response message =", message);
        if (typeof message === "string" && message) {
            pot = message;
            set_link_ready_state(true);
            clearInterval(fetch_pot_timer_id);
        }else{
            set_link_ready_state(false);
        }
    });
}


function get_subtitle_url(){
    const selector_sub_lang = document.getElementById("selector-sub-lang");
    const cbox_trans = document.getElementById("cbox_trans");
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    
    var url = captionTracks[selector_sub_lang.value].baseUrl + "&fmt=vtt";
    
    url +=`&c=WEB&pot=${pot}`;

    if (cbox_trans.checked)
    {
        var trans_to_lang_code = translationLanguages[selector_trans_lang.value].languageCode;
        url += `&tlang=${trans_to_lang_code}`;
    }
    return url;
}


function set_link_ready_state(ready)
{
    const div_notready = document.getElementById("div_notready");
    const div_tiptogglecc = document.getElementById("div_tiptogglecc");

    const btn_disp_sub = document.getElementById("btn_disp_sub");
    const btn_url = document.getElementById("btn_url");

    if (ready) {
        div_notready.style.visibility = 'hidden';
        div_tiptogglecc.style.color = 'gray';
        btn_disp_sub.removeAttribute("disabled");
        btn_url.removeAttribute("disabled");
    }else {
        div_notready.style.visibility = '';
        div_tiptogglecc.style.color = '';
        btn_disp_sub.setAttribute("disabled", "true");
        btn_url.setAttribute("disabled", "true");
    }
}




