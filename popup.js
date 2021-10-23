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
    cur_tab = ( await browser.tabs.query({
        currentWindow: true, active: true
    }) ) [0];

    //console.log (cur_tab.id, cur_tab.title );
    //document.getElementById("div_page_title").textContent = cur_tab.title;
    
    browser.tabs.executeScript(cur_tab.id, {
        code: `
            // window.tabid=${cur_tab.id};
        `,
        runAt: "document_start"
    }).then(function() {
        browser.tabs.executeScript(cur_tab.id, {
            file: 'inject.js'
        }) ;
    });
    
    browser.runtime.onMessage.addListener(async function(message, sender) { 
        // 
        // console.log("popup receive message", message, sender);
        // console.log(message);
        
        if (sender.tab.id == cur_tab.id) 
        {
            document.getElementById("div_connecting_tip").style.display="none";
            
            //console.log("tab id matches");
            //document.getElementById("div_page_title").textContent = message['title'];
            //ytplayer = JSON.parse(message['ytplayer_json']);
            playerResponse = JSON.parse(message['playerResponse_json']);
            //console.log(ytplayer);
            //console.log(ytplayer.config);
            if (playerResponse === null || playerResponse === undefined )
            {
                show_refresh();
                return;
            }
            
            //const player_response = ytplayer.config.args.raw_player_response;
            
            var ytplayer_videoid = playerResponse.videoDetails.videoId;
            if ( typeof(ytplayer_videoid) === "string" && cur_tab.url.includes( ytplayer_videoid ) )
            {
                //console.log("ytpleyr 与 url 一致");
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
    captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
    translationLanguages = playerResponse.captions.playerCaptionsTracklistRenderer.translationLanguages;
    
    document.getElementById("div_page_title").textContent = playerResponse.videoDetails.title;
    
    //console.log(captionTracks);
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
    
    //console.log(translationLanguages);
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

        browser.tabs.sendMessage(cur_tab.id, {
            action: "display_sub",
            url: get_subtitle_url(),
            kill_left: true
        });
        
        const selector_sub_lang = document.getElementById("selector-sub-lang");
        const cbox_trans = document.getElementById("cbox_trans");
        const selector_trans_lang = document.getElementById("selector-trans-lang");
        
        var orig_vssid = captionTracks[selector_sub_lang.value].vssId;
        setStor("orig_sub_lang", orig_vssid);
        //console.log(getStor('orig_sub_lang'));
        
        if ( cbox_trans.checked) {
            var tran_lang = translationLanguages[selector_trans_lang.value].languageCode;
            setStor("tran_sub_lang", tran_lang);
        }
    };
});

onrd.push( function() {
    document.getElementById("btn_rm_sub").onclick = function() {
        browser.tabs.sendMessage(cur_tab.id, {
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

function get_subtitle_url(){
    const selector_sub_lang = document.getElementById("selector-sub-lang");
    const cbox_trans = document.getElementById("cbox_trans");
    const selector_trans_lang = document.getElementById("selector-trans-lang");
    
    var url = captionTracks[selector_sub_lang.value].baseUrl + "&fmt=vtt";
    
    if (cbox_trans.checked)
    {
        var trans_to_lang_code = translationLanguages[selector_trans_lang.value].languageCode;
        url += `&tlang=${trans_to_lang_code}`;
    }
    return url;
}
