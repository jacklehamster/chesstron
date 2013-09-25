<?php

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
    
    
   define("MEMDIR", "memoku");
   $action = $_REQUEST['action'];

   switch($action) {
      case "destroy":
          $room = $_REQUEST['room'];
          if($room) {
             $channel = md5($room);
             $channeldir = MEMDIR."/$channel";
             destroy($channeldir,true);
          }
          break;
      case "enter":
         $room = $_REQUEST['room'];
         $channel = md5($room);
         $memdir = MEMDIR;
         $channeldir = "$memdir/$channel";
         $javascript = $_REQUEST['javascript'];         

         if(!file_exists($channeldir) || !file_exists("$channeldir/data.json")) {
                if(!file_exists(MEMDIR)) {
                    mkdir(MEMDIR);
                }
                if(!file_exists($channeldir)) {
                    mkdir($channeldir);
                }
                if(!file_exists("$channeldir/1.json"))
                    file_put_contents("$channeldir/1.json","");
                if(!file_exists("$channeldir/data.json"))  {
                    $data = "1,{\"room\":\"$room\"}";
                    file_put_contents("$channeldir/data.json",$data);
                }
         }
         else {
             $data = file_get_contents("$channeldir/data.json");
         }
         $server = $_SERVER["HTTP_HOST"];
         $urlaccess = "http://$server/cosmo.php";
         $info = "{\"server\":\"$server\",\"room\":\"$room\",\"channel\":\"$channel\",\"memdir\":\"$memdir\",\"data\":[$data],\"url\":\"$urlaccess\"}";
         if(!$javascript) {
              header("Content-Type:text/plain");
              echo $info;
         }
         else { 
              header("Content-type: text/javascript");
              echo "var info=$info;";
?>

if(!window.cosmo) {

   function Cosmo(url) {
       this.spots = {};
       this.url = url;
   }
   Cosmo.prototype = {
       getSpot : function(roomname) {
           return this.spots[roomname] ? this.spots[roomname] : this.spots[roomname] = new Spot(this,roomname);
       }
   };

   function Spot(cosmo,roomname) {
      this.cosmo = cosmo;
      this.roomname = roomname;
   }

   Spot.prototype = {
      setInfo : function(channel,data,count) {
          this.channel = channel;
          this.data = data;
          this.count = count;
      },
      getNewScript : function() {
         var js = document.getElementById("script_"+this.roomname);
         if(js)
            document.head.removeChild(js);
         js = document.createElement("script");
         js.id = "script_"+this.roomname;
         js.type = "text/javascript";
         document.head.appendChild(js);
         return js;
      },
      loadScript : function() {
         var js = this.getNewScript();
         js.src = this.cosmo.url + "?" +
	      "action=get" +
              "&callback=cosmo.getSpot('" + this.roomname + "').update" +
	      "&channel=" + this.channel +
	      "&count=" + this.count +
              "&timestamp=" + new Date().getTime();
      },
      setProperty : function(property,value) {
         var js = this.getNewScript();
         js.src = this.cosmo.url + "?" +
              "action=post" +
              "&channel=" + this.channel +
              "&data=" + JSON.stringify([property,value]) +
              "&count=" + (this.count+1) +
              "&timestamp=" + new Date().getTime();
      },
      sync : function(update) {
            if(onCosmo) {
                 onCosmo(update);
            }
      },
      update : function(update) {
         if(update) {
            this.count++;
            this.sync(update);
         }
         this.loadScript();
      }
   };

   window.cosmo = new Cosmo(info.url);
}
var spot = cosmo.getSpot(info.room);
spot.setInfo(info.channel,info.data[1],info.data[0]);
setTimeout(
   function() {
       spot.loadScript();
   },100);

<?
         }
         break;
      case "get":
         $channel = $_REQUEST['channel'];
         $count = $_REQUEST['count'];
         $callback = stripslashes($_REQUEST['callback']);
         $channeldir = MEMDIR."/$channel";

         $next = max(2,$count+1);
         $now = time();
         $timeout = false;
         while(!file_exists("$channeldir/$next.json")) {
            usleep(50);
            if(time()-$now>10) {
                $timeout = true;
                break;
            }
         }
         $update = $timeout ? "" : file_get_contents("$channeldir/$count.json",stripslashes($data));
         if($callback) {
                header("Content-type: text/javascript");
                echo "$callback($update);";
         }
         else {
                header("Content-Type:text/plain");
                echo $update;
         }
         break;
      case "post":
         $channel = $_REQUEST['channel'];
         if($channel && ctype_alnum($channel)) {
             $data = $_REQUEST['data'];
             $count = $_REQUEST['count'];
             $channeldir = MEMDIR."/$channel";
             $filename = "$channeldir/data.json";
             if($data) {
                if(!file_exists("$channeldir/$count.json")) {
                  $fp = fopen($filename,"c+");
                  $size = filesize($filename);
                  $consolidate = flock($fp, LOCK_EX | LOCK_NB);
                  $str = $size ? fread($fp, filesize($filename)) : "";
                  if($str=="") {
                     $str = "1,{}";
                  }
                  $countstart =  substr($str,0,strpos($str,","));
                  $count = $countstart;
                }

                $next = max(2,$count+1);
                while(file_exists("$channeldir/$next.json")) {
                   $next++;
                }
                $count = $next-1;
                if($_REQUEST["timestamp"]) {
                   $array = explode("%TIMESTAMP%",$data);
                   $now = number_format(microtime(true)*1000,0,'.','');
                   $data = implode("$now",$array);
                }
                file_put_contents("$channeldir/$count.json",stripslashes($data));
                file_put_contents("$channeldir/$next.json","");
                echo $count;
             }
             
             if(!$fp) {
                 $fp = fopen($filename,"c+");
                 $consolidate = flock($fp, LOCK_EX | LOCK_NB);
             }

             if($consolidate) {
                if(!$str) {
                    $size = filesize($filename);
                    $str = $size ? fread($fp, filesize($filename)) : "";
                    if($str=="") {
                        $str = "1,{}";
                    }
                    $countstart =  substr($str,0,strpos($str,","));
                }
                ob_start();
                echo "[$str";
                for($i = $countstart; file_exists("$channeldir/$i.json"); $i++) {
                    $content = file_get_contents("$channeldir/$i.json");
                    if($content != "") {
                        echo ",$content";
                        if(!$fileage && file_exists("$channeldir/".($i-1).".json")) {
                             $fileage = time()-filemtime("$channeldir/".($i-1).".json");
                        }
                    }
                }
                echo "]";
                $topcount = $i-1;
                $str = ob_get_contents(); // get the complete string
                ob_end_clean();
                $obj = json_decode($str,true);
                $start = $obj[0];
                $len = count($obj);
                for($i = 2;$i<$len;$i++) {
                   if($obj[$i]) {
                     list($access,$value) = $obj[$i];
                     $access = explode('.',$access);
                     $leaf = &$obj[1];
                     $accesslen = count($access);
                     for($p=0;$p<$accesslen;$p++) {
                          $leafname = $access[$p];
                          if($p<$accesslen-1) {
                               if(!is_array($leaf[$leafname])) {
                                    $leaf[$leafname] = array();
                               }
                               $leaf = &$leaf[$leafname];
                          }
                     }
                     if(is_null($value)) {
                          if(isset($leaf[$leafname])) {
                               if(array_values($leaf) === $leaf)
                                    array_splice($leaf,$leafname,1);
                               else
                                    unset($leaf[$leafname]);
                          }
                     }
                     else {
                          if($leafname=="" && array_values($leaf) === $leaf)
                               $leaf[] = $value;
                          else
                               $leaf[$leafname] = $value;
                     }
                   }
                }
                $obj = $obj[1];
                $str = "$topcount,".json_encode($obj);
                fseek($fp,0);
                fwrite($fp,$str);
                fflush($fp);
                ftruncate($fp, ftell($fp));
                flock($fp, LOCK_UN);
                if($fileage>60) { //delete files older than 1 min
                    for($i = $countstart-1; $i>0 && file_exists("$channeldir/$i.json"); $i--) {
                        if(file_exists("$channeldir/$i.json"))
                           unlink("$channeldir/$i.json");
                    }
                }
            }
            fclose($fp);

         }
         break;
         default:
            echo "Cosmo - Real time communication in space";
   }
   

   function timeslot() {
       $now = microtime(true);
       return (int)($now*10) % 1000;
   }

   function destroy($folder,$destroyself) {
       if(!file_exists($folder)) {
           return;
       }
       foreach(scandir($folder) as $file) {
          if (is_dir("$folder/$file")) {
             if($file!='..' && $file!='.')
                destroy("$folder/$file",true);
          }
          else {
             unlink("$folder/$file");
          }
       }
       if($destroyself)
          rmdir ($folder);
   }
   exit();
?>