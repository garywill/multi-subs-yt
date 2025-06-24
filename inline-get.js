console.debug("inline-get.js");

var plyRes = document.getElementsByTagName("ytd-app")[0].data.playerResponse 

console.debug("got ytd-app[0] playerResponse");

console.debug("plyRes 's type is", typeof(plyRes) );
console.debug("plyRes 's keys length is", Object.keys(plyRes).length);

document.body.setAttribute("data-playerResponse", JSON.stringify(
    plyRes
));

// TODO delete plyRes

console.debug("typeof body's attr is", 
    typeof ( document.body.getAttribute('data-playerResponse') )
);
console.debug("length of body's attr is",   document.body.getAttribute('data-playerResponse') .length );
