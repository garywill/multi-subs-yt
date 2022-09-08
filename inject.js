/*
 * By garywill (https://garywill.github.io)
 * https://github.com/garywill/multi-subs-yt
 * 
 */

send_ytplayer();
 
//console.log(window.tabid);
if ( ! window.has_executed )
{
    first_run();
    
    window.has_executed = true;
    //console.log("first inject");
    
    
}

function first_run() {
    browser.runtime.onMessage.addListener( async function(message, sender) { 
        //console.log(message, sender);
        if ( message.action == "display_sub" )
        {
            var url = message.url;

            var videos = document.getElementsByTagName("video");
            for (var i=0; i< videos.length; i++) {
                var video = videos[i];
            
                subt = document.createElement("track");

                subt.default = true;
            

                var sub_data;
                var succ_fetch_sub = false;
                
                try {
                    await fetch(url).then(response => {
                        if (response.ok)
                        {
                            succ_fetch_sub = true;
                            console.log("Fetching subtitle file responsed ok");
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
                    sub_data = sub_data.replaceAll("align:start position:0%", "");
                
                subt.src = "data:text/vtt," + encodeURIComponent(sub_data, true);
            
                //subt.srclang = "en";
                video.appendChild(subt);
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
            remove_subs();
        }
        
    });
    
    document.addEventListener("yt-navigate-finish", function () {
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
    
    //console.log(document.title);
    try {
        get_ytplayer_to_body();
        
        const playerResponse_json = document.body.getAttribute('data-playerResponse');
        //console.log( playerResponse_json );
        
        browser.runtime.sendMessage({
            //tabid: window.tabid,
            title: document.title,
            href: window.location.href,
            playerResponse_json: playerResponse_json,
        });
    }catch(err) {}
    
    remove_page_change();

}

var script_tag;
function get_ytplayer_to_body()
{
    var scriptContent =`
        document.body.setAttribute("data-playerResponse", JSON.stringify( document.getElementsByTagName("ytd-app")[0].data.playerResponse ));
    `;
    script_tag = document.createElement('script');
    //script_tag.id = 'tmpScript';
    script_tag.appendChild(document.createTextNode(scriptContent));
    
    (document.body || document.head || document.documentElement).appendChild(script_tag);
}
function remove_page_change()
{
    var scriptContent =`
        document.body.removeAttribute("data-playerResponse");
    `;
    
    script_tag = script_tag || document.createElement('script');
    
    script_tag.innerHTML="";
    script_tag.appendChild(document.createTextNode(scriptContent));
    
    script_tag.parentNode.removeChild(script_tag);
    
}

//------------------------------------------------



 

