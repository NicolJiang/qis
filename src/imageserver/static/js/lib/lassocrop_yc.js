/*!
---

name: Lasso

description: MooTools image mask and lasso for selecting an image area

url: https://github.com/quru/lasso.crop

license: MIT-style license.

copyright: Copyright (c) 2009 [Nathan White](http://www.nwhite.net/).

authors:
  - Nathan White
  - Matt Fozard

requires: [Core]

*/
var Lasso=new Class({Implements:[Options,Events],active:false,options:{autoHide:true,cropMode:false,globalTrigger:false,min:false,max:false,ratio:false,contain:false,trigger:null,border:"#999",color:"#7389AE",opacity:0.3,zindex:100},binds:{},initialize:function(b){this.setOptions(b);
this.isTouch=(("ontouchstart" in window)&&window.Touch);this.box=new Element("div",{styles:{display:"none",position:"absolute","z-index":this.options.zindex}}).inject((this.container)?this.container:document.body);
this.overlay=new Element("div",{styles:{position:"relative",background:"transparent",height:"100%",width:"100%","z-index":this.options.zindex+1}}).inject(this.box);
this.mask=new Element("div",{styles:{position:"absolute","background-color":this.options.color,opacity:this.options.opacity,height:"100%",width:"100%","z-index":this.options.zindex-1}});
if(this.options.cropMode){this.mask.setStyle("z-index",this.options.zindex-2).inject(this.container);
this.options.trigger=this.mask;}else{this.mask.inject(this.overlay);}this.trigger=$(this.options.trigger);
var c={position:"absolute",width:1,height:1,overflow:"hidden","z-index":this.options.zindex+1};if(this.options.border.test(/\.(jpe?g|gif|png)/)){c.backgroundImage="url("+this.options.border+")";
}else{var a="1px dashed "+this.options.border;}this.marchingAnts={};["left","right","top","bottom"].each(function(e,d){var f,g=Object.clone(c);
switch(e){case"left":f=Object.merge(g,{top:0,left:-1,height:"100%"});break;case"right":f=Object.merge(g,{top:0,right:-1,height:"100%"});
break;case"top":f=Object.merge(g,{top:-1,left:0,width:"100%"});break;case"bottom":f=Object.merge(g,{bottom:-1,left:0,width:"100%"});
break;}if(a){f["border-"+e]=a;}this.marchingAnts[e]=new Element("div",{styles:f}).inject(this.overlay);
},this);this.binds.start=function(d){this.start(d);}.bind(this);this.binds.move=function(d){this.move(d);
}.bind(this);this.binds.end=function(d){this.end(d);}.bind(this);this.attach();this.removeDOMSelection=function(){if(window.getSelection){var d=window.getSelection();
if(d.empty){d.empty();}else{if(d.removeAllRanges){d.removeAllRanges();}}}else{if(document.selection&&document.selection.empty){document.selection.empty();
}}};this.resetCoords();},destroy:function(){this.detach();this.mask.destroy();this.overlay.destroy();
this.box.destroy();},attach:function(){this.trigger.addEvent(this.isTouch?"touchstart":"mousedown",this.binds.start);
},detach:function(){if(this.active){this.end();}this.trigger.removeEvent(this.isTouch?"touchstart":"mousedown",this.binds.start);
},start:function(a){if((!this.options.autoHide&&a.target==this.box)||(!this.options.globalTrigger&&(this.trigger!=a.target))){return false;
}if(this.isTouch){a.stop();}this.active=true;if(this.isTouch){document.addEvents({touchmove:this.binds.move,touchend:this.binds.end});
}else{document.addEvents({mousemove:this.binds.move,mouseup:this.binds.end});}this.resetCoords();if(this.options.contain){this.getContainCoords();
}if(this.container){this.getRelativeOffset();}this.setStartCoords(a.page);this.fireEvent("start");return true;
},move:function(h){if(!this.active){return false;}if(this.isTouch){h.stop();}this.removeDOMSelection();
var d=this.coords.start,a=h.page,g=this.coords.box={},j=this.coords.container;if(this.container){a.y-=this.offset.top;
a.x-=this.offset.left;}var i=this.flip={y:(d.y>a.y),x:(d.x>a.x)};g.y=(i.y)?[a.y,d.y]:[d.y,a.y];g.x=(i.x)?[a.x,d.x]:[d.x,a.x];
if(this.options.contain){if(g.y[0]<j.y[0]){g.y[0]=j.y[0];}if(g.y[1]>j.y[1]){g.y[1]=j.y[1];}if(g.x[0]<j.x[0]){g.x[0]=j.x[0];
}if(g.x[1]>j.x[1]){g.x[1]=j.x[1];}}if(this.options.max){if(g.x[1]-g.x[0]>this.options.max[0]){if(i.x){g.x[0]=g.x[1]-this.options.max[0];
}else{g.x[1]=g.x[0]+this.options.max[0];}}if(g.y[1]-g.y[0]>this.options.max[1]){if(i.y){g.y[0]=g.y[1]-this.options.max[1];
}else{g.y[1]=g.y[0]+this.options.max[1];}}}if(this.options.ratio){var b=this.options.ratio;var e={x:(g.x[1]-g.x[0])/b[0],y:(g.y[1]-g.y[0])/b[1]};
if(e.x>e.y){if(i.x){g.x[0]=g.x[1]-(e.y*b[0]);}else{g.x[1]=g.x[0]+(e.y*b[0]);}}else{if(e.x<e.y){if(i.y){g.y[0]=g.y[1]-(e.x*b[1]);
}else{g.y[1]=g.y[0]+(e.x*b[1]);}}}}this.refresh();return true;},refresh:function(){var d=this.coords,a=this.coords.box,b=this.coords.container;
d.w=a.x[1]-a.x[0];d.h=a.y[1]-a.y[0];d.top=a.y[0];d.left=a.x[0];this.box.setStyles({display:"block",top:d.top,left:d.left,width:d.w,height:d.h});
this.fireEvent("resize",this.getRelativeCoords());},end:function(b){if(!this.active){return false;}this.active=false;
if(this.isTouch){document.removeEvents({touchmove:this.binds.move,touchend:this.binds.end});}else{document.removeEvents({mousemove:this.binds.move,mouseup:this.binds.end});
}if(this.options.autoHide){this.resetCoords();}else{if(this.options.min){if(this.coords.w<this.options.min[0]||this.coords.h<this.options.min[1]){this.resetCoords();
}}}var a=(this.options.autoHide)?null:this.getRelativeCoords();this.fireEvent("complete",a);return true;
},setStartCoords:function(a){if(this.container){a.y-=this.offset.top;a.x-=this.offset.left;}this.coords.start=a;
this.coords.w=0;this.coords.h=0;this.box.setStyles({display:"block",top:this.coords.start.y,left:this.coords.start.x});
},resetCoords:function(){this.coords={start:{x:0,y:0},move:{x:0,y:0},end:{x:0,y:0},w:0,h:0};this.box.setStyles({display:"none",top:0,left:0,width:0,height:0});
this.getContainCoords();},getRelativeCoords:function(){var a=this.coords.box,d=Object.clone(this.coords.container),b=this.coords;
if(!this.options.contain){d={x:[0,0],y:[0,0]};}return{x:(a.x[0]-d.x[0]).toInt(),y:(a.y[0]-d.y[0]).toInt(),w:(b.w).toInt(),h:(b.h).toInt()};
},getContainCoords:function(){var a=this.trigger.getCoordinates(this.container);this.coords.container={y:[a.top,a.top+a.height],x:[a.left,a.left+a.width]};
},getRelativeOffset:function(){this.offset=this.container.getCoordinates();},reset:function(){this.detach();
}});Lasso.Crop=new Class({Extends:Lasso,options:{autoHide:false,cropMode:true,contain:true,handleSize:8,preset:false,handleStyle:{border:"1px solid #000","background-color":"#ccc",opacity:0.75}},initialize:function(a,b){this.img=$(a);
if(this.img.get("tag")!="img"){return false;}var c=this.img.getCoordinates();this.container=new Element("div",{styles:{position:"relative",width:c.width,height:c.height,background:"url("+this.img.get("src")+") no-repeat"}}).inject(this.img,"after");
this.img.setStyle("display","none");b.p=this.container;this.crop=new Element("img",{src:this.img.get("src"),styles:{position:"absolute",top:0,left:0,width:c.width,height:c.height,padding:0,margin:0,"z-index":this.options.zindex-1}}).inject(this.container);
this.parent(b);this.binds.handleMove=this.handleMove.bind(this);this.binds.handleEnd=this.handleEnd.bind(this);
this.binds.handles={};this.handles={};this.handlesGrid={NW:[0,0],N:[0,1],NE:[0,2],W:[1,0],E:[1,2],SW:[2,0],S:[2,1],SE:[2,2]};
["NW","N","NE","W","E","SW","S","SE"].each(function(e){var d=this.handlesGrid[e];this.binds.handles[e]=function(f){this.handleStart(f,e,d[0],d[1]);
}.bind(this);this.handles[e]=new Element("div",{styles:Object.merge({position:"absolute",display:"block",visibility:"hidden",width:this.options.handleSize,height:this.options.handleSize,overflow:"hidden",cursor:(e.toLowerCase()+"-resize"),"z-index":this.options.zindex+2},this.options.handleStyle)});
this.handles[e].addEvent(this.isTouch?"touchstart":"mousedown",this.binds.handles[e]);this.handles[e].inject(this.box,"bottom");
},this);this.binds.drag=function(d){this.handleStart(d,"DRAG",1,1);}.bind(this);this.overlay.addEvent(this.isTouch?"touchstart":"mousedown",this.binds.drag);
this.setDefault();},destroy:function(){this.container.destroy();this.img.setStyle("display","");this.parent();
},setDefault:function(){if(!this.options.preset){return this.resetCoords();}this.getContainCoords();this.getRelativeOffset();
var b=this.coords.container,a=this.options.preset;this.coords.start={x:a[0],y:a[1]};this.active=true;
this.move({page:{x:a[2]+this.offset.left,y:a[3]+this.offset.top}});this.active=false;},handleStart:function(b,c,d,a){if(this.isTouch){b.stop();
}this.currentHandle={handle:c,row:d,col:a};if(this.isTouch){document.addEvents({touchmove:this.binds.handleMove,touchend:this.binds.handleEnd});
}else{document.addEvents({mousemove:this.binds.handleMove,mouseup:this.binds.handleEnd});}b.page.y-=this.offset.top;
b.page.x-=this.offset.left;this.coords.hs={s:b.page,b:Object.clone(this.coords.box)};this.active=true;
},handleMove:function(a){if(this.isTouch){a.stop();}var e=this.coords.box,g=this.coords.container,d=a.page,j=this.currentHandle,k=this.coords.start;
d.y-=this.offset.top;d.x-=this.offset.left;if(j.handle=="DRAG"){var i=this.coords.hs,f=d.x-i.s.x,b=d.y-i.s.y,h;
e.y[0]=i.b.y[0]+b;e.y[1]=i.b.y[1]+b;e.x[0]=i.b.x[0]+f;e.x[1]=i.b.x[1]+f;if((h=e.y[0]-g.y[0])<0){e.y[0]-=h;
e.y[1]-=h;}if((h=e.y[1]-g.y[1])>0){e.y[0]-=h;e.y[1]-=h;}if((h=e.x[0]-g.x[0])<0){e.x[0]-=h;e.x[1]-=h;}if((h=e.x[1]-g.x[1])>0){e.x[0]-=h;
e.x[1]-=h;}return this.refresh();}if(j.row==0&&e.y[1]<d.y){j.row=2;}if(j.row==2&&e.y[0]>d.y){j.row=0;
}if(j.col==0&&e.x[1]<d.x){j.col=2;}if(j.col==2&&e.x[0]>d.x){j.col=0;}if(j.row==0||j.row==2){k.y=(j.row)?e.y[0]:e.y[1];
if(j.col==0){k.x=e.x[1];}if(j.col==1){k.x=e.x[0];d.x=e.x[1];}if(j.col==2){k.x=e.x[0];}}if(!this.options.ratio){if(j.row==1){if(j.col==0){k.y=e.y[0];
d.y=e.y[1];k.x=e.x[1];}else{if(j.col==2){k.y=e.y[0];d.y=e.y[1];k.x=e.x[0];}}}}d.y+=this.offset.top;d.x+=this.offset.left;
this.move(a);},handleEnd:function(a){if(this.isTouch){document.removeEvents({touchmove:this.binds.handleMove,touchend:this.binds.handleEnd});
}else{document.removeEvents({mousemove:this.binds.handleMove,mouseup:this.binds.handleEnd});}this.end(a);
this.active=false;this.currentHandle=false;if(this.options.min&&(this.coords.w<this.options.min[0]||this.coords.h<this.options.min[1])){if(this.options.preset){this.setDefault();
}else{this.resetCoords();}}},resetCoords:function(){this.parent();this.coords.box={x:[0,0],y:[0,0]};this.hideHandlers();
this.crop.setStyle("clip","rect(0px 0px 0px 0px)");},showHandlers:function(){var c=this.coords.box;if(this.options.min&&(this.coords.w<this.options.min[0]||this.coords.h<this.options.min[1])){this.hideHandlers();
}else{var h=[],b=[],f=(this.options.handleSize/2)+1;for(var g=0,i=2;g<=i;g++){h[g]=((g==0)?0:((g==2)?c.y[1]-c.y[0]:(c.y[1]-c.y[0])/2))-f;
b[g]=((g==0)?0:((g==2)?c.x[1]-c.x[0]:(c.x[1]-c.x[0])/2))-f;}for(var e in this.handlesGrid){var a=this.handlesGrid[e],d=this.handles[e];
if(!this.options.ratio||(a[0]!=1&&a[1]!=1)){if(this.options.min&&this.options.max){if((this.options.min[0]==this.options.max[0])&&(a[1]%2)==0){continue;
}if(this.options.min[1]==this.options.max[1]&&(a[0]%2)==0){continue;}}d.setStyles({visibility:"visible",top:h[a[0]],left:b[a[1]]});
}}}},hideHandlers:function(){for(handle in this.handles){this.handles[handle].setStyle("visibility","hidden");
}},refresh:function(){this.parent();var a=this.coords.box,b=this.coords.container;this.crop.setStyle("clip","rect("+(a.y[0])+"px "+(a.x[1])+"px "+(a.y[1])+"px "+(a.x[0])+"px )");
this.showHandlers();}});