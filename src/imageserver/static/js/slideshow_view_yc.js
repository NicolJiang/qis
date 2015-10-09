/*!
	Document:      slideshow_view.js
	Date started:  05 Feb 2013
	By:            Matt Fozard
	Purpose:       Quru Image Server image slideshow library
	Requires:      MooTools Core 1.3 (no compat)
	               MooTools More 1.3 - Assets, Element.Measure, Fx.Elements, Request.JSONP
	Copyright:     Quru Ltd (www.quru.com)
	Licence:

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published
	by the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with this program.  If not, see http://www.gnu.org/licenses/

	Last Changed:  $Date$ $Rev$ by $Author$
	
	Notable modifications:
	Date       By    Details
	=========  ====  ============================================================
	20Feb2013  Matt  Changed image centering to work across IE7 - 9
	22Feb2013  Matt  Added background colour for stack mode
	05Jul2013  Matt  Added support for adding image parameters
	29Jul2013  Matt  Added fps option
	19Feb2015  Matt  Use 1 timer for animation instead of 2
	20Feb2015  Matt  Pause on mouse hover, pause when page invisible
	23Feb2015  Matt  Add prev, next functions, arrows and dots UI controls
*/
function ImgSlideshow(a,b){this.options={controls:true,dots:true,dotColor:"#666666",dotSelectedColor:"#dddddd",mode:"slide",delay:5,pauseOnHover:true,server:"",folder:"",images:[],params:{},jsonp:true,fps:50,duration:1000,bgColor:"white",transition:Fx.Transitions.Quad.easeInOut};
if(b!=undefined){this.options=Object.merge(this.options,b);}this.options.server=this._add_slash(this.options.server);
this.options.folder=this._add_slash(this.options.folder);this.options.images.each(function(c){if(c.server){c.server=this._add_slash(c.server);
}}.bind(this));this.imageSize={width:0,height:0};this.ctrEl=document.id(a);this._hover_in_fn=this._hover_in.bind(this);
this._hover_out_fn=this._hover_out.bind(this);this._visibility_change_fn=this._visibility_change.bind(this);
this.pvAPI=(document.hidden!==undefined);this.arrowEls=[];this.imageEls=[];this.wrapEls=[];this.animTimer=null;
this.ready=false;this.running=false;this.animating=false;this.direction=1;this.imageIdx=0;this.layout();
}ImgSlideshow.prototype.init=function(){this.setMessage("Loading slideshow...");if(this.options.folder){this.addFolderImages();
}else{this.onDataReady(null);}if(this.options.controls){var c=["arrow-left.png","arrow-right.png"],b=[this.prev,this.next];
for(var a=0;a<c.length;a++){this.arrowEls[a]=new Element("a",{href:"#",html:'<img src="'+this.options.server+"static/images/slideshow/"+c[a]+'"> ',styles:{position:"absolute","z-index":"10","text-decoration":"none",border:"none"},events:{click:b[a].bind(this)}});
}}};ImgSlideshow.prototype.destroy=function(){if(this.pvAPI){document.removeEvent("visibilitychange",this._visibility_change_fn);
}if(this.options.pauseOnHover){this.ctrEl.removeEvent("mouseenter",this._hover_in_fn);this.ctrEl.removeEvent("mouseleave",this._hover_out_fn);
}this.stop();this.ready=false;this.ctrEl.empty();this.imageEls.each(function(a){a.destroy();});this.wrapEls.each(function(a){a.destroy();
});this.imageEls.empty();this.wrapEls.empty();};ImgSlideshow.prototype.layout=function(){var a=this.ctrEl.getComputedSize();
if((a.width==0)&&(a.height==0)){a={width:this.ctrEl.clientWidth,height:this.ctrEl.clientHeight};}this.imageSize.width=a.width;
this.imageSize.height=a.height;this.ctrEl.setStyles({position:"relative",overflow:"hidden","text-align":"center","line-height":a.height+"px"});
};ImgSlideshow.prototype.setMessage=function(a){this.ctrEl.innerHTML='<span style="font-size: small">'+a+"</span>";
};ImgSlideshow.prototype.addFolderImages=function(){var a=this.options.server+"api/v1/list?path="+encodeURIComponent(this.options.folder);
if(this.options.jsonp){new Request.JSONP({url:a,callbackKey:"jsonp",onComplete:function(b){this.onDataReady(b);
}.bind(this)}).send();}else{new Request.JSON({url:a,onSuccess:function(b){this.onDataReady(b);}.bind(this),onFailure:function(b){this.setMessage("");
}.bind(this)}).get();}};ImgSlideshow.prototype.onDataReady=function(f){if(f&&(f.status==200)){for(var a=0;
a<f.data.length;a++){this.options.images.push({src:this.options.folder+f.data[a].filename});}}if((this.options.images.length>0)&&(this.imageSize.width>0)&&(this.imageSize.height>0)){for(var a=0;
a<this.options.images.length;a++){var e=this.options.images[a],b={};Object.append(b,this.options.params);
Object.append(b,e);delete b.url;delete b.server;b.width=this.imageSize.width;b.height=this.imageSize.height;
b.autosizefit=1;b.strip=1;if(!b.format){b.format="jpg";}var d=e.server?e.server:this.options.server;var c=d+"image?"+Object.toQueryString(b);
this.imageEls.push(Asset.image(c,{"data-index":a,styles:{margin:"0",padding:"0","vertical-align":"top"},onLoad:this.onImageReady.bind(this)}));
}}else{this.setMessage("");}};ImgSlideshow.prototype.onImageReady=function(b){var a=Math.floor((this.imageSize.height-b.height)/2);
b.setStyle("margin-top",a+"px");if(b.get("data-index")==0){setTimeout(this.create_ui.bind(this),1);}};
ImgSlideshow.prototype.create_ui=function(){var c={border:"none",display:"block",width:this.imageSize.width+"px",height:this.imageSize.height+"px",margin:"0",padding:"0","font-size":"0","line-height":"0",position:"absolute",top:"0px",left:"0px",visibility:"hidden"};
if(this.options.mode=="stack"){c["background-color"]=this.options.bgColor;}for(var a=0;a<this.imageEls.length;
a++){if(this.options.images[a].url){var b=new Element("a",{href:this.options.images[a].url,styles:c});
}else{var b=new Element("div",{styles:c});}b.grab(this.imageEls[a]);this.wrapEls.push(b);}this.ctrEl.empty();
for(var a=0;a<this.wrapEls.length;a++){this.ctrEl.grab(this.wrapEls[a]);}if(this.arrowEls.length===2){this.arrowEls[0].setStyles({left:"10px"});
this.arrowEls[1].setStyles({right:"10px"});this.ctrEl.grab(this.arrowEls[0]);this.ctrEl.grab(this.arrowEls[1]);
}if(this.options.dots){var d=new Element("div",{styles:{position:"absolute",width:"100%",height:"20px","line-height":"20px","text-align":"center","z-index":"10","font-family":"sans-serif","font-size":"20px",left:"0px",bottom:"5px"}});
for(var a=0;a<this.wrapEls.length;a++){d.grab(new Element("a",{href:"#",html:"&#9679;","data-index":a,"class":"_sls_dot",styles:{margin:"0 8px 0 8px","text-decoration":"none",border:"none"},events:{click:function(f,e){return function(){return this.index(f);
}.bind(e);}(a,this)}}));}this.ctrEl.grab(d);}this.wrapEls[0].setStyle("visibility","visible");this._select_dot(0);
if(this.options.pauseOnHover){this.ctrEl.addEvent("mouseenter",this._hover_in_fn);this.ctrEl.addEvent("mouseleave",this._hover_out_fn);
}if(this.pvAPI){document.addEventListener("visibilitychange",this._visibility_change_fn,false);}this.ready=true;
this.start();};ImgSlideshow.prototype.start=function(){if(!this.running&&(this.wrapEls.length>1)){this.direction=1;
this.running=true;this._animate_async();}return false;};ImgSlideshow.prototype.stop=function(){if(this.animTimer!==null){clearTimeout(this.animTimer);
this.animTimer=null;}this.running=false;return false;};ImgSlideshow.prototype.prev=function(){if(this.ready&&(this.wrapEls.length>1)&&!this.animating){this.stop();
this.direction=-1;this._animate();}return false;};ImgSlideshow.prototype.next=function(){if(this.ready&&(this.wrapEls.length>1)&&!this.animating){this.stop();
this.direction=1;this._animate();}return false;};ImgSlideshow.prototype.index=function(a){a=Math.min(Math.max(a,0),this.wrapEls.length-1);
if(this.ready&&(this.wrapEls.length>1)&&!this.animating){this.stop();this.direction=(a>=this.imageIdx)?1:-1;
this._animate(a);}return false;};ImgSlideshow.prototype._animate=function(a){switch(this.options.mode){case"slide":return this._slide(a);
case"stack":return this._stack(a);case"fade":return this._xfade(a);}};ImgSlideshow.prototype._animate_async=function(){if(this.animTimer===null){this.animTimer=setTimeout(function(){this._animate();
this.animTimer=null;}.bind(this),this.options.delay*1000);}};ImgSlideshow.prototype._slide=function(a){this._do_slide(false,a);
};ImgSlideshow.prototype._stack=function(a){this._do_slide(true,a);};ImgSlideshow.prototype._do_slide=function(a,e){var c=this.imageIdx,b=this.wrapEls.length-1,d=(e!==undefined)?e:c+this.direction;
if(d<0){d=b;}else{if(d>b){d=0;}}if(d===c){return;}this.wrapEls[c].setStyle("z-index","0");this.wrapEls[d].setStyles({left:(this.imageSize.width*this.direction)+"px",visibility:"visible","z-index":"1"});
this.animating=true;new Fx.Elements([this.wrapEls[c],this.wrapEls[d]],{fps:this.options.fps,duration:this.options.duration,transition:this.options.transition,onComplete:function(){this.animating=false;
this.wrapEls[c].setStyle("visibility","hidden");if(this.running){this._animate_async();}}.bind(this)}).start({0:a?{}:{left:[0,-this.imageSize.width*this.direction]},1:{left:[this.imageSize.width*this.direction,0]}});
this.imageIdx=d;this._select_dot(this.imageIdx);};ImgSlideshow.prototype._xfade=function(d){var b=this.imageIdx,a=this.wrapEls.length-1,c=(d!==undefined)?d:b+this.direction;
if(c<0){c=a;}else{if(c>a){c=0;}}if(c===b){return;}this.wrapEls[c].setStyles({opacity:0,visibility:"visible"});
this.animating=true;new Fx.Elements([this.wrapEls[b],this.wrapEls[c]],{fps:this.options.fps,duration:this.options.duration,transition:this.options.transition,onComplete:function(){this.animating=false;
this.wrapEls[b].setStyle("visibility","hidden");if(this.running){this._animate_async();}}.bind(this)}).start({0:{opacity:[1,0]},1:{opacity:[0,1]}});
this.imageIdx=c;this._select_dot(this.imageIdx);};ImgSlideshow.prototype._select_dot=function(a){if(this.options.dots){this.ctrEl.getElements("._sls_dot").each(function(b){b.setStyle("color",(b.get("data-index")==a)?this.options.dotSelectedColor:this.options.dotColor);
}.bind(this));}};ImgSlideshow.prototype._add_slash=function(a){if(a&&a.charAt(a.length-1)!="/"){return a+"/";
}else{return a;}};ImgSlideshow.prototype._hover_in=function(){this.wasRunning=this.running;if(this.running){this.stop();
}};ImgSlideshow.prototype._hover_out=function(){if(this.wasRunning){this.start();}};ImgSlideshow.prototype._visibility_change=function(){(document.hidden?this._hover_in:this._hover_out).bind(this)();
};function slideshow_view_init(b,c){b=document.id(b);if(b){if(b._show!=undefined){b._show.destroy();}var a=new ImgSlideshow(b,c);
a.init();b._show=a;}return false;}function slideshow_view_stop(a){a=document.id(a);if(a&&a._show){return a._show.stop();
}}function slideshow_view_start(a){a=document.id(a);if(a&&a._show){return a._show.start();}}function slideshow_view_prev(a){a=document.id(a);
if(a&&a._show){return a._show.prev();}}function slideshow_view_next(a){a=document.id(a);if(a&&a._show){return a._show.next();
}}function slideshow_view_index(a,b){a=document.id(a);if(a&&a._show){return a._show.index(b);}}