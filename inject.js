/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 */

console.debug("============inject.js=================");

 
//console.debug(window.tabid);
if ( ! window.has_executed )
{
    console.debug("calling first_run()");
    first_run();
    console.debug("finished first_run()");
    window.has_executed = true;
    //console.debug("first inject");
    
    
}

send_ytplayer();

//====================================================

function first_run() {
    chrome.runtime.onMessage.addListener( async function(message, sender) { 
        console.debug("content script received message");
        //console.debug(message, sender);
        if ( message.action == "display_sub" )
        {
            console.debug("content script received message : display_sub");
            
            var url = message.url;

            var videos = document.getElementsByTagName("video");
            for (var i=0; i< videos.length; i++) {
                var video = videos[i];
            
                subt = document.createElement("track");

                const loading_tip = `WEBVTT

STYLE
::cue {
  color: #197aa7; !important
  font-size: 50%;
}

00:00:00.100 --> 1999:59:59.080 align:start position:0% 
Fetching one subtitle..`;
                
                
                subt.default = true;
                
                subt.src = "data:text/vtt," + encodeURIComponent(loading_tip, true);
            
                //subt.srclang = "en";
                video.appendChild(subt);
                subt.track.mode = "showing";            
                

                var sub_data;
                var succ_fetch_sub = false;
                
                try {
                    await fetch(url).then(response => {
                        if (response.ok)
                        {
                            succ_fetch_sub = true;
                            console.debug("Fetching subtitle file responsed ok");
                        }
                        return response.text();
                    }).then(textString => {
                        if (succ_fetch_sub)
                            sub_data = textString;
                        else 
                        {
                            fetching_sub_failed();
                        }
                    });
                }
                catch(err) 
                {
                        fetching_sub_failed();
                }
                function fetching_sub_failed() {
                    console.warn("Failed to fetch subtitle");
                    sub_data = `WEBVTT


STYLE
::cue {
  color: #b8ba35; !important
  font-size: 50%;
}

00:00:00.100 --> 1999:59:59.080 align:start position:0% 
Failed to fetch one subtitle`
                }
                
                if ( succ_fetch_sub && message.kill_left  )
                    sub_data = sub_data.replaceAll("align:start position:0%", "")
                                        .replaceAll("align:start position:100%", "")
                        ;
                
                subt.src = "data:text/vtt," + encodeURIComponent(sub_data, true);
            
                //subt.srclang = "en";
                subt.track.mode = "showing";
            }
            
            /*
            var st = document.createElement("style");
            st.textContent =`
            ::cue { 
                white-space: pre-wrap;
                color: yellow; 
                text-align: center; 
            } \
            
            `;
            document.head.appendChild(st);
            */
        } else if (message.action == "remove_subs")
        {
            console.debug("content script received message : remove_subs");
            remove_subs();
        }
        
    });
    
    document.addEventListener("yt-navigate-finish", function () {
        console.debug("content script: 'yt-navigate-finish' event");
        remove_subs();
    });
    
}
function remove_subs() {
    var videos = document.getElementsByTagName("video");
    for (var i=0; i< videos.length; i++) {
        var video = videos[i];
    
        Array.from( video.getElementsByTagName("track") ).forEach( function(ele) {
            ele.track.mode = "hidden";
            ele.parentNode.removeChild(ele);
        });
    }
}

async function send_ytplayer() 
{
    console.debug("send_ytplayer()");
    //console.debug(document.title);
    try {
        get_ytplayer_to_body();
        await sleep(100);
        console.debug("finished get_ytplayer_to_body()")
        
        var playerResponse_json =  document.body.getAttribute('data-playerResponse')  ;
        console.debug("finished reading body attr")
        //console.debug( playerResponse_json );
        
        console.debug(document.title, window.location.href);
        console.debug(playerResponse_json.length);
        chrome.runtime.sendMessage({
            //tabid: window.tabid,
            title: document.title,
            href: window.location.href,
            playerResponse_json: playerResponse_json,
        });
        console.debug("finished runtime.sendMessage()");
    }catch(err) {
        console.debug("!!!! ERROE !!! error when sending ytplayer");
        console.warn(err);
    }
    
    
    console.debug("wait some secs then remove body attr");
    await sleep (2000);
    console.debug("now remove body attr");
    remove_page_change();

}

// var script_tag;
function get_ytplayer_to_body()
{
    execJsFileInWebScope('inline-get.js');
}

function execJsFileInWebScope(JsFileName)
{
    var script_tag = document.createElement('script');
    script_tag.src = chrome.runtime.getURL(JsFileName);
    script_tag.onload = function() {
        setTimeout( function() {
                script_tag.remove();
            }, 
            3000
        );
    };
    (document.head || document.documentElement).appendChild(script_tag);
    
/*    
    var scriptContent = `document.body.setAttribute("data-playerResponse", JSON.stringify( document.getElementsByTagName("ytd-app")[0].data.playerResponse ));`;
    script_tag = document.createElement('script');
    //script_tag.id = 'tmpScript';
    script_tag.appendChild(document.createTextNode(scriptContent));
    
    (document.body || document.head || document.documentElement).appendChild(script_tag); */
}
function remove_page_change()
{
    try {
        execJsFileInWebScope("inline-remove.js");
    }
    catch(err)
    {
        console.error(err);
    }
}

//------------------------------------------------


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
 

