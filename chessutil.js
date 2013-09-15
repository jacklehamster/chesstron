function random() {
    return random.x = parseFloat('0.'+Math.sin(random.x).toString().substr(6));
}
random.x = 1000;

function getSearchParameters() {
    var query = document.location.search.substr(1);
    var querySplit = query.split("&");
    var obj = {};
    for(var i=0;i<querySplit.length;i++) {
        var q = querySplit[i].split("=");
        if(q[0] && q[1]) {
            obj[q[0]] = q[1];
        }
    }
    return obj;    
}