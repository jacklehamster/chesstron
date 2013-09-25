/*
 
 Copyright (C) 2013 Vincent Le Quang
 
 This program is free software; you can redistribute it and/or modify it under the terms of the
 GNU General Public License as published by the Free Software Foundation;
 either version 2 of the License, or (at your option) any later version.
 
 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License along with this program;
 if not, write to the Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 
 Contact : vincentlequang@gmail.com
 
 */


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