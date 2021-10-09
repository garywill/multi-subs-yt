/*
 * By garywill (https://garywill.github.io)
 * All Rights Reserved
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

            var video = document.getElementsByTagName("video")[0];
            subt = document.createElement("track");

            subt.default = true;
            
            if (!message.kill_left)
                subt.src = url;
            else
            {
                var sub_data;
                await fetch(url).then(response => response.text()).then(textString => {
                    sub_data = textString;
                });
                sub_data = sub_data.replaceAll("align:start position:0%", "");
                subt.src = "data:text/vtt," + encodeURIComponent(sub_data, true);
            }
            //subt.srclang = "en";
            video.appendChild(subt);
            subt.track.mode = "showing";
            
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
            var video = document.getElementsByTagName("video")[0];
            Array.from( video.getElementsByTagName("track") ).forEach( function(ele) {
                ele.track.mode = "hidden";
                ele.parentNode.removeChild(ele);
            });
            
        }
        
    });
}

async function send_ytplayer() 
{
    
    //console.log(document.title);
    try {
        get_ytplayer_to_body();
        
        const ytplayer_json = document.body.getAttribute('data-ytplayer');
        
        browser.runtime.sendMessage({
            //tabid: window.tabid,
            title: document.title,
            href: window.location.href,
            ytplayer_json: ytplayer_json,
        });
    }catch(err) {}
    
    remove_page_change();

}

var script_tag;
function get_ytplayer_to_body()
{
    var scriptContent =`
        document.body.setAttribute("data-ytplayer", JSON.stringify(ytplayer));
    `;
    script_tag = document.createElement('script');
    //script_tag.id = 'tmpScript';
    script_tag.appendChild(document.createTextNode(scriptContent));
    
    (document.body || document.head || document.documentElement).appendChild(script_tag);
}
function remove_page_change()
{
    var scriptContent =`
        document.body.removeAttribute("data-ytplayer");
    `;
    
    script_tag = script_tag || document.createElement('script');
    
    script_tag.innerHTML="";
    script_tag.appendChild(document.createTextNode(scriptContent));
    
    script_tag.parentNode.removeChild(script_tag);
    
}

//------------------------------------------------



 

