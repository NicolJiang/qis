/*!
	Document:      canvas_view.js
	Date started:  22 Aug 2011
	By:            Matt Fozard
	Purpose:       Quru Image Server HTML 5 viewer client
	Requires:      MooTools Core 1.3 (no compat)
	               MooTools More 1.3 - Assets, Element.Measure, Fx.Slide, Mask, Request.JSONP, String.QueryString
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
	22Sep2011  Matt  Perform zooming based on click position
	23Sep2011  Matt  Constrain panning to image area, auto-centre borders on zoom
	27Sep2011  Matt  Tweaks to add compatibility with excanvas
	10Oct2011  Matt  Added selectable animation easing functions
	12Oct2011  Matt  Re-write! Add ImgGrid class, conversion to display tiled images
	27Oct2011  Matt  Changed image/tile loading to run from a configurable queue
	02Nov2011  Matt  Added animated panning to a stop on mouse/touch release
	03Nov2011  Matt  Added loading progress bar
	15Dec2011  Matt  Added API call to get image information, pre-calculate grids
	16Jan2012  Matt  Added touch events for iOS compatibility
	24Jan2012  Matt  Added built-in UI panel with zoom controls, help
	07Feb2012  Matt  Added full-screen mode
	28Feb2012  Matt  Improved grid size choices for better zooming tile alignment
	02May2012  Matt  Changed public APIs to take options object
	03May2012  Matt  Implement destroy fns to free canvas memory on Firefox 12
	12Jun2012  Matt  Changed image info load to use JSONP transport by default
	18Sep2012  Matt  Improved touch support, add pinch to zoom
	28Feb2013  Matt  Bug fix to show control panel on top of floated page items
	03Jun2013  Matt  Set a minimum tile size
	04Jul2013  Matt  Allow the init_image methods to work with non-IMG
	                 elements that have a CSS background-image
	11Oct2013  Matt  Strip halign and valign in full-screen modes by default
	25Oct2013  Matt  Bug fix to take into account rotation before cropping,
	                 parse rotation as float not int
	11Nov2013  Matt  Add events interface and image download function
	01Apr2015  Matt  Move full-screen close button top-right to match gallery
	15Jun2015  Matt  Use standardised zoom levels + grid sizes
*/
Math.parseInt=function(b,a){if(!b||!(/^[-]*[\d]+$/.test(b))){return a;
}else{return parseInt(b,10);}};Math.parseFloat=function(b,a){if(!b||!(/^[-]*[.|\d]+$/.test(b))){return a;
}else{return parseFloat(b);}};Math.round1=function(a){return Math.round(a*10)/10;};Math.round8=function(a){return Math.round(a*Math.pow(10,8))/Math.pow(10,8);
};Math.limit=function(b,c,a){return Math.min(Math.max(b,c),a);};Math.roundToMultiple=function(b,a,d){var c=b%a;
if(c!=0){if((c<(a/2))||d){c=-c;}else{c=(a-c);}}return Math.round(b+c);};Math.linearTween=function(e,a,g,f){return g*e/f+a;
};Math.easeOutQuad=function(e,a,g,f){return -g*(e/=f)*(e-2)+a;};Math.easeInOutQuad=function(e,a,g,f){if((e/=f/2)<1){return g/2*e*e+a;
}return -g/2*((--e)*(e-2)-1)+a;};Math.easeOutSine=function(e,a,g,f){return g*Math.sin(e/f*(Math.PI/2))+a;
};Math.easeInOutSine=function(e,a,g,f){return -g/2*(Math.cos(Math.PI*e/f)-1)+a;};Math.easeOutBack=function(e,a,h,g,f){if(f==undefined){f=1.70158;
}return h*((e=e/g-1)*e*((f+1)*e+f)+1)+a;};Math.easeInOutBack=function(e,a,h,g,f){if(f==undefined){f=1.70158;
}if((e/=g/2)<1){return h/2*(e*e*(((f*=(1.525))+1)*e-f))+a;}return h/2*((e-=2)*e*(((f*=(1.525))+1)*e+f)+2)+a;
};function ImgGrid(b,j,d,k,c,a,f,g,i){this.initialised=false;this.destroyed=false;this.useJSONP=g;this.onInitialisedFn=i;
this.animating=false;this.excanvas=(Browser.ie&&window.G_vmlCanvasManager);this.g2d={ctx:c,origin:{x:0,y:0}};
var e=Math.linearTween;switch(a.toLowerCase()){case"in-out-back":e=Math.easeInOutBack;break;case"in-out-quadratic":e=Math.easeInOutQuad;
break;case"in-out-sine":e=Math.easeInOutSine;break;case"out-back":e=Math.easeOutBack;break;case"out-quadratic":e=Math.easeOutQuad;
break;case"out-sine":e=Math.easeOutSine;break;}this.zoom={level:1,nextLevel:1,maxLevel:10,drawZoom:{x:1,y:1},fps:50,animateFn:e};
this.gridOpts={maxTiles:f,maxWidth:0,maxHeight:0,minWidth:0,minHeight:0,aspect:1,showGrid:false};this.viewport={origWidth:b,origHeight:j,origAspect:b/j,width:b,height:j,aspect:b/j};
this.grids=new Array();this.grid=null;this.requests={queue:new Array(),active:0,limit:2,enforceLimit:true,requested:0,showProgress:false};
d=_clean_url(d);var h=d.indexOf("?");this.urlParams=d.substring(h+1).parseQueryString();if(k){delete this.urlParams.halign;
delete this.urlParams.valign;}d=d.substring(0,h);h=d.lastIndexOf("/");this.urlBase=d.substring(0,h+1);
this.urlCommand=d.substring(h+1);this.loadingText="Loading image...";this.drawText(this.loadingText);
this.loadImageInfo();}ImgGrid.prototype.destroy=function(){this.initialised=false;this.destroyed=true;
this.cancelPendingImages();this.g2d.ctx=null;};ImgGrid.prototype.reset=function(){if(!this.initialised||this.destroyed){return;
}this.animating=false;this.cancelPendingImages();this.g2d.ctx.translate(-this.g2d.origin.x,-this.g2d.origin.y);
this.g2d.origin.x=this.g2d.origin.y=0;this.zoom.level=this.zoom.nextLevel=1;this.zoom.drawZoom.x=this.zoom.drawZoom.y=1;
this.setGrid(1,true);};ImgGrid.prototype.setViewportSize=function(b,a){this.viewport.width=b;this.viewport.height=a;
this.viewport.aspect=b/a;if(!this.excanvas){this.g2d.ctx.translate(this.g2d.origin.x,this.g2d.origin.y);
}if(this.initialised){this.centreGrid(true,true,false);this.setGrid(this.zoom.level,true);this.cancelPendingHiddenImages();
}else{if(!this.destroyed){this.drawText(this.loadingText);if(this.grids.length>0){this.centreGrid(true,true,false);
this.setGrid(this.zoom.level,false);}}}};ImgGrid.prototype.loadImageInfo=function(){var a=this.urlBase+"api/v1/details?src="+encodeURIComponent(this.urlParams.src);
if(this.useJSONP){new Request.JSONP({url:a,callbackKey:"jsonp",onComplete:function(b){this.onImageInfoLoaded(b);
}.bind(this)}).send();}else{new Request.JSON({url:a,onSuccess:function(b){this.onImageInfoLoaded(b);}.bind(this),onFailure:function(b){this.onImageInfoFailure(b);
}.bind(this)}).get();}};ImgGrid.prototype.onImageInfoLoaded=function(i){if(this.destroyed){return;}if((i.status>=300)||(i.data.width<=0)||(i.data.height<=0)){this.onImageInfoFailure(null);
}else{var g=i.data.width,f=i.data.height;if(this.urlParams.angle){var d=Math.abs(Math.parseFloat(this.urlParams.angle,0));
if((d==90)||(d==270)){var b=g;g=f;f=b;}}if(this.urlParams.top||this.urlParams.left||this.urlParams.right||this.urlParams.bottom){var e=Math.limit(Math.parseFloat(this.urlParams.top,0),0,1),c=Math.limit(Math.parseFloat(this.urlParams.left,0),0,1),h=Math.limit(Math.parseFloat(this.urlParams.right,1),0,1),a=Math.limit(Math.parseFloat(this.urlParams.bottom,1),0,1);
if((e<a)&&(c<h)){g=Math.round(g*(h-c));f=Math.round(f*(a-e));}}this.imageInfo=i.data;this.initialise(g,f);
}};ImgGrid.prototype.onImageInfoFailure=function(a){if(!this.destroyed){this.drawText("X");}};ImgGrid.prototype.initialise=function(d,c){this.gridOpts.maxWidth=d;
this.gridOpts.maxHeight=c;this.gridOpts.aspect=d/c;if(this.gridOpts.aspect>=this.viewport.origAspect){this.gridOpts.minWidth=Math.min(d,this.viewport.origWidth);
this.gridOpts.minHeight=Math.round(this.gridOpts.minWidth/this.gridOpts.aspect);}else{this.gridOpts.minHeight=Math.min(c,this.viewport.origHeight);
this.gridOpts.minWidth=Math.round(this.gridOpts.minHeight*this.gridOpts.aspect);}for(var b=1;b<=this.zoom.maxLevel;
b++){var a=this.calcGridSize(b);var e=this.calcGridTiles(a.width,a.height,a.length);this.grids[b]={images:[],grid:e,length:a.length,axis:a.axis,origWidth:a.width,origHeight:a.height,width:a.width,height:a.height};
if(a.max){this.zoom.maxLevel=b;break;}}this.setGrid(1,false);this.requestImage(1,1);};ImgGrid.prototype.closestRatioMultiples=function(b,m,n,j,h){var d=Math.roundToMultiple(b,h),l=Math.roundToMultiple(Math.round(d/j),h),a=Math.round8(j);
if((Math.round8(d/l)==a)&&(d>=m)&&(d<=n)){return{a:d,b:l};}else{var g=Math.roundToMultiple(m,h),f=Math.roundToMultiple(n,h),i=new Array();
if(g<m){g+=h;}if(f>n){f-=h;}for(var c=d+h;c<=f;c+=h){var k=Math.roundToMultiple(Math.round(c/j),h),e=c/k;
if(Math.round8(e)==a){return{a:c,b:k};}else{i.push({a:c,b:k,diff:Math.abs(j-e)});}}for(var c=d-h;c>=g;
c-=h){var k=Math.roundToMultiple(Math.round(c/j),h),e=c/k;if(Math.round8(e)==a){return{a:c,b:k};}else{i.push({a:c,b:k,diff:Math.abs(j-e)});
}}if(i.length==0){return{a:d,b:l};}else{i.sort(function(p,o){return p.diff-o.diff;});return i[0];}}};
ImgGrid.prototype.calcGridSize=function(e){var h=[[500,1],[960,1],[1728,16],[3120,64],[5600,64],[10240,256],[18432,1024],[33024,1024],[59392,4096],[107008,16384]];
if(e==1){var b=this.gridOpts.minWidth,q=this.gridOpts.minHeight,p=1,m=1,l=(Math.max(b,q)>=h[h.length-1][0])||(b>=this.gridOpts.maxWidth)||(q>=this.gridOpts.maxHeight);
}else{var c=(this.gridOpts.aspect>=this.viewport.origAspect)?this.gridOpts.minWidth:this.gridOpts.minHeight,j=0;
for(var g=0;g<h.length;g++){if(h[g][0]>=c){j=g;break;}}var f=Math.min(j+e-1,h.length-1);if(this.gridOpts.aspect>=1){var b=h[f][0],q=Math.round(b/this.gridOpts.aspect);
}else{var q=h[f][0],b=Math.round(q*this.gridOpts.aspect);}var p=Math.min(h[f][1],this.gridOpts.maxTiles),m=Math.round(Math.sqrt(p)),l=(f==(h.length-1));
if(((b/this.gridOpts.maxWidth)>0.85)||((q/this.gridOpts.maxHeight)>0.85)){b=this.gridOpts.maxWidth;q=this.gridOpts.maxHeight;
l=true;}if(p>1){var d=Math.max(m,4),o=10,a=Math.max(this.gridOpts.minWidth,b-(o*d)),n=Math.min(this.gridOpts.maxWidth,b+(o*d));
var k=this.closestRatioMultiples(b,a,n,this.gridOpts.aspect,d);b=k.a;q=k.b;}}return{width:b,height:q,length:p,axis:m,max:l};
};ImgGrid.prototype.calcGridTiles=function(b,o,d){var j=new Array();if(d==1){j[1]={tile:1,x1:0,y1:0,x2:(b-1),y2:(o-1),width:b,height:o};
}else{var c=Math.round(Math.sqrt(d));var p=Math.floor(b/c),n=Math.floor(o/c),m=b%c,k=o%c;for(var g=1;
g<=d;g++){var l=this.tileToXY(g,c);var f=l.x*p,e=l.y*n;var h=(l.x==(c-1))?(p+m):p,a=(l.y==(c-1))?(n+k):n;
j[g]={tile:g,x1:f,y1:e,x2:(f+h-1),y2:(e+a-1),width:h,height:a};}}return j;};ImgGrid.prototype.setGrid=function(b,a){this.grid=this.grids[b];
this.grid.width=this.grid.origWidth;this.grid.height=this.grid.origHeight;var c=this.fillsViewport(this.grid);
this.centreGrid(!c.x,!c.y,false);this.alignGrid(false);if(a){this.paint();}};ImgGrid.prototype.getVisibleGridTiles=function(){var c=new Array();
if(this.grid.length==1){c[0]=1;}else{var e=-this.g2d.origin.x,h=-this.g2d.origin.y,b=e+this.viewport.width-1,g=h+this.viewport.height-1;
for(var d=1;d<=this.grid.length;d++){var f=this.grid.grid[d];var a=((f.x1*this.zoom.drawZoom.x)>b||(f.x2*this.zoom.drawZoom.x)<e||(f.y1*this.zoom.drawZoom.y)>g||(f.y2*this.zoom.drawZoom.y)<h);
if(!a){c[c.length]=d;}}}return c;};ImgGrid.prototype.tileToXY=function(d,b){var f=Math.floor(d/b),e=d%b,a=(e!=0)?(e-1):(b-1),c=(e!=0)?f:(f-1);
return{x:a,y:c};};ImgGrid.prototype.xyToTile=function(a,c,b){return(c*b)+a+1;};ImgGrid.prototype.getFallbackTile=function(b,d){var u=this.zoom.level,c=u;
var a=this.tileToXY(b,this.grid.axis),s=d.x1/this.grid.origWidth,r=d.y1/this.grid.origHeight,t=d.width/this.grid.origWidth,e=d.height/this.grid.origHeight;
while(--c>=1){var m=this.grids[c],q=Math.round(this.grid.axis/m.axis),k=Math.floor(a.x/q),h=Math.floor(a.y/q),n=this.xyToTile(k,h,m.axis),o=m.images[n];
if((o!=undefined)&&o._loaded){var v=m.grid[n],j=v.x1/m.origWidth,g=v.y1/m.origHeight;var i=Math.limit(Math.round((s-j)*m.origWidth),0,o.width-1),f=Math.limit(Math.round((r-g)*m.origHeight),0,o.height-1),l=Math.limit(Math.round(t*m.origWidth),1,o.width-i),p=Math.limit(Math.round(e*m.origHeight),1,o.height-f);
return{img:o,srcx:i,srcy:f,srcw:l,srch:p};}}};ImgGrid.prototype.getImageURL=function(a,b){this.urlParams.format="jpg";
this.urlParams.autosizefit="0";this.urlParams.strip="1";this.urlParams.stats=(a>1)?"0":"1";this.urlParams.width=this.grids[a].origWidth;
this.urlParams.height=this.grids[a].origHeight;if(this.grids[a].length>1){this.urlParams.tile=b+":"+this.grids[a].length;
}else{delete this.urlParams.tile;}return this.urlBase+this.urlCommand+"?"+Object.toQueryString(this.urlParams);
};ImgGrid.prototype.getBestFitLevel=function(){if(!this.initialised){return 1;}var c=new Array();for(var b=1;
b<=this.zoom.maxLevel;b++){var a=Math.abs(this.viewport.width-this.grids[b].origWidth),e=Math.abs(this.viewport.height-this.grids[b].origHeight),d=a+e;
c.push({level:b,diff:d});}c.sort(function(g,f){return g.diff-f.diff;});return c[0].level;};ImgGrid.prototype.requestImage=function(c,d){if(this.grids[c].images[d]!=undefined){return;
}for(var b,a=0;a<this.requests.queue.length;a++){b=this.requests.queue[a];if((b.zLevel==c)&&(b.tileNo==d)){return;
}}this.requests.queue.push({zLevel:c,tileNo:d,url:this.getImageURL(c,d),onLoad:function(){this.requests.active=Math.max(this.requests.active-1,0);
this.onImageLoaded(c,d);this.pollImageQueue();}.bind(this),onAbort:function(){this.requests.active=Math.max(this.requests.active-1,0);
this.pollImageQueue();}.bind(this),onError:function(){this.requests.active=Math.max(this.requests.active-1,0);
this.pollImageQueue();}.bind(this)});this.requests.requested++;if(this.requests.requested==1){setTimeout(function(){if(this.requests.requested>0){this.requests.showProgress=true;
this.paint();}}.bind(this),500);}this.pollImageQueue();};ImgGrid.prototype.pollImageQueue=function(){while((this.requests.queue.length>0)&&(this.requests.active<this.requests.limit)){this.requests.active++;
var a=this.requests.queue.splice(0,1)[0];this.grids[a.zLevel].images[a.tileNo]=Asset.image(a.url,{onLoad:a.onLoad,onAbort:a.onAbort,onError:a.onError});
}if((this.requests.queue.length==0)&&(this.requests.active==0)){this.requests.requested=0;this.requests.showProgress=false;
this.paint();}};ImgGrid.prototype.onImageLoaded=function(a,c){var b=this.grids[a].images[c];b._loaded=true;
if(!this.initialised&&(a==1)){this.initialised=true;if(this.onInitialisedFn){setTimeout(function(){this.onInitialisedFn(this.imageInfo);
}.bind(this),1);}}if((a==this.zoom.level)&&!this.animating){this.paint();}};ImgGrid.prototype.cancelPendingHiddenImages=function(){var a=this.getVisibleGridTiles();
for(var b=0;b<this.requests.queue.length;b++){var c=this.requests.queue[b];if((c.zLevel!=this.zoom.level)||!a.contains(c.tileNo)){this.requests.queue.splice(b,1);
this.requests.requested--;b--;}}};ImgGrid.prototype.cancelPendingImages=function(){this.requests.queue.empty();
if(!this.requests.enforceLimit){this.requests.active=0;}};ImgGrid.prototype.fillsViewport=function(a){return{x:(a.width>=this.viewport.width),y:(a.height>=this.viewport.height)};
};ImgGrid.prototype.centreGrid=function(d,f,c){var a=(this.viewport.width-this.grid.width)/2,g=(this.viewport.height-this.grid.height)/2;
var e=d?(a-this.g2d.origin.x):0,b=f?(g-this.g2d.origin.y):0;if((e!=0)||(b!=0)){this.g2d.ctx.translate(e,b);
this.g2d.origin.x+=e;this.g2d.origin.y+=b;}if(c){this.paint();}};ImgGrid.prototype.panGrid=function(c,b,a,d){if(!this.initialised){return false;
}if(a||d){if(a&&(this.grid.width>=this.viewport.width)){if(this.g2d.origin.x+c>0){c=-this.g2d.origin.x;
}else{if(this.g2d.origin.x+this.grid.width+c<this.viewport.width){c=-((this.grid.width-this.viewport.width)+this.g2d.origin.x);
}}}else{c=0;}if(d&&(this.grid.height>=this.viewport.height)){if(this.g2d.origin.y+b>0){b=-this.g2d.origin.y;
}else{if(this.g2d.origin.y+this.grid.height+b<this.viewport.height){b=-((this.grid.height-this.viewport.height)+this.g2d.origin.y);
}}}else{b=0;}}if((c!=0)||(b!=0)){this.g2d.ctx.translate(c,b);this.g2d.origin.x+=c;this.g2d.origin.y+=b;
this.paint();return true;}return false;};ImgGrid.prototype.autoPanGrid=function(b,a){if(!this.initialised||this.animating){return;
}if((this.grid.width<=this.viewport.width)&&(this.grid.height<=this.viewport.height)){return;}var c=this.fillsViewport(this.grid);
if(!c.x){b=0;}if(!c.y){a=0;}this.animating=true;setTimeout(function(){this.animatePan(1,20,b,a,Math.easeOutQuad,this.zoom.fps);
}.bind(this),1);};ImgGrid.prototype.alignGrid=function(b){var c=this.g2d.origin.x-Math.round(this.g2d.origin.x),a=this.g2d.origin.y-Math.round(this.g2d.origin.y);
if((c!=0)||(a!=0)){this.g2d.ctx.translate(-c,-a);this.g2d.origin.x=Math.round(this.g2d.origin.x);this.g2d.origin.y=Math.round(this.g2d.origin.y);
}if(b){this.paint();}};ImgGrid.prototype.zoomFit=function(){if(!this.initialised||this.animating){return;
}var a=this.getBestFitLevel(),b=a-this.zoom.level;if(b!=0){this.zoomGrid(b,{x:0.5,y:0.5});}};ImgGrid.prototype.zoomGrid=function(d,c){if(!this.initialised||this.animating){return;
}var a=Math.limit(this.zoom.level+d,1,this.zoom.maxLevel);if(a!=this.zoom.level){this.cancelPendingImages();
this.zoom.nextLevel=a;var b={width:this.grids[a].origWidth,height:this.grids[a].origHeight};this.animating=true;
setTimeout(function(){this.animateZoom(1,20,this.grid.width,this.grid.height,b.width-this.grid.width,b.height-this.grid.height,(b.width/b.height)-(this.grid.width/this.grid.height),c,this.zoom.animateFn,this.zoom.fps);
}.bind(this),1);}};ImgGrid.prototype.animateZoom=function(j,g,k,l,q,c,a,p,m,b){if(!this.animating){return;
}var n=this.grid.width,h=this.grid.height,f=m(j,k,q,g),o=m(j,l,c,g),i=f-n,r=o-h;this.grid.width=f;this.grid.height=o;
this.zoom.drawZoom.x=f/k;this.zoom.drawZoom.y=o/l;var s=this.fillsViewport(this.grid);if(!s.x&&!s.y){this.centreGrid(true,true);
this.paint();}else{if(!s.x||!s.y){var e=s.x?-(i*p.x):0,d=s.y?-(r*p.y):0;this.centreGrid(!s.x,!s.y);if(!this.panGrid(e,d,s.x,s.y)){this.paint();
}}else{if(!this.panGrid(-(i*p.x),-(r*p.y),true,true)){this.paint();}}}if(++j<=g){setTimeout(function(){this.animateZoom(j,g,k,l,q,c,a,p,m,b);
}.bind(this),(1000/b));return;}this.onAnimateZoomComplete();};ImgGrid.prototype.onAnimateZoomComplete=function(){this.animating=false;
this.zoom.level=this.zoom.nextLevel;this.zoom.drawZoom.x=this.zoom.drawZoom.y=1;this.setGrid(this.zoom.level,true);
this.cancelPendingHiddenImages();};ImgGrid.prototype.animatePan=function(h,g,d,b,e,f){if(!this.animating){return;
}var c=e(h,0,d,g),a=e(h,0,b,g);if(this.panGrid(d-c,b-a,true,true)){if(++h<=g){setTimeout(function(){this.animatePan(h,g,d,b,e,f);
}.bind(this),(1000/f));return;}}this.onAnimatePanComplete();};ImgGrid.prototype.onAnimatePanComplete=function(){this.animating=false;
this.alignGrid(true);this.cancelPendingHiddenImages();};ImgGrid.prototype.drawText=function(c){var b=Math.min(28,(this.viewport.width/c.length)*0.66);
var a=this.g2d.ctx;a.save();a.font=b+"pt Arial";a.fillStyle="#aaaaaa";a.textAlign="center";a.textBaseline="middle";
this.clear();a.fillText(c,this.viewport.width/2,this.viewport.height/2);a.restore();};ImgGrid.prototype.clear=function(){if(this.g2d.ctx){this.g2d.ctx.clearRect(-this.g2d.origin.x,-this.g2d.origin.y,this.viewport.width,this.viewport.height);
}};ImgGrid.prototype.paint=function(){if(!this.initialised){return;}var d=[],b=0,a=this.getVisibleGridTiles(),g=this.fillsViewport(this.grid);
if(this.excanvas||!g.x||!g.y){this.clear();}for(b=0;b<a.length;b++){var c=this.grid.grid[a[b]],f=this.grid.images[a[b]],e=(this.zoom.drawZoom.x<1?0.5:0);
if((f!=undefined)&&f._loaded){this.g2d.ctx.drawImage(f,c.x1*this.zoom.drawZoom.x,c.y1*this.zoom.drawZoom.y,c.width*this.zoom.drawZoom.x+e,c.height*this.zoom.drawZoom.y+e);
}else{if(f==undefined){d[d.length]=a[b];}f=this.getFallbackTile(a[b],c);this.g2d.ctx.drawImage(f.img,f.srcx,f.srcy,f.srcw,f.srch,c.x1*this.zoom.drawZoom.x,c.y1*this.zoom.drawZoom.y,c.width*this.zoom.drawZoom.x+e,c.height*this.zoom.drawZoom.y+e);
}}if((d.length>0)&&(this.zoom.level==this.zoom.nextLevel)){for(b=0;b<d.length;b++){this.requestImage(this.zoom.level,d[b]);
}}if(this.gridOpts.showGrid){this.paintgrid();}if((this.requests.requested>0)&&this.requests.showProgress){this.paintprogress();
}};ImgGrid.prototype.paintprogress=function(){var f=this.requests.queue.length+this.requests.active,d=(this.requests.requested-f)/this.requests.requested,e=Math.limit(this.viewport.width/2,100,300),c=((this.viewport.width-e)/2)-this.g2d.origin.x,b=(this.viewport.height-15)-this.g2d.origin.y,a=this.g2d.ctx;
a.save();a.lineWidth=10;a.lineCap="round";a.beginPath();a.moveTo(c,b);a.strokeStyle="rgba(0,0,0,0.5)";
a.lineTo(c+e,b);a.stroke();if(d>0){a.beginPath();a.moveTo(c,b);a.strokeStyle="rgba(255,255,255,0.7)";
a.lineTo(c+(e*d),b);a.stroke();}a.restore();};ImgGrid.prototype.paintgrid=function(){var a=this.g2d.ctx;
a.save();a.strokeStyle="#ff0000";a.fillStyle="#ff0000";a.font=((this.grid.width/10)/(this.grid.axis/2))+"pt Arial";
a.textAlign="center";a.textBaseline="middle";for(var b=1;b<=this.grid.length;b++){var c=this.grid.grid[b];
a.beginPath();a.moveTo(c.x1*this.zoom.drawZoom.x,c.y2*this.zoom.drawZoom.y);a.lineTo(c.x2*this.zoom.drawZoom.x,c.y2*this.zoom.drawZoom.y);
a.lineTo(c.x2*this.zoom.drawZoom.x,c.y1*this.zoom.drawZoom.y);a.stroke();a.fillText(""+b,(c.x1*this.zoom.drawZoom.x)+(c.width*this.zoom.drawZoom.x/2),(c.y1*this.zoom.drawZoom.y)+(c.height*this.zoom.drawZoom.y/2));
}a.restore();};function ImgCanvasView(a,c,d,b){this.options={title:null,description:null,showcontrols:"auto",quality:true,animation:"out-quadratic",maxtiles:256,jsonp:true,stripaligns:false,doubleclickreset:true,controls:{download:false,title:true,help:true,reset:true,fullscreen:!Browser.ie6,zoomin:true,zoomout:true},fullScreenFixed:true,fullScreenCloseOnClick:true};
if(d){this.options=Object.merge(this.options,d);}this.events=b;this.uiAttrs={controlsSlider:null,alertVisible:false,alertEl:null,fullScreen:false,fullMaskEl:null,fullSwapEl:null,fullCloseEl:null,fullKeydownFn:null,fullResizeFn:null,animating:false};
this.mouseAttrs={down:false,dragged:false,downTime:0,down_x:0,down_y:0,last_x:0,last_y:0};this.touchAttrs={last1:{x:0,y:0},last2:{x:0,y:0}};
this.imageInfo=null;this.ctrEl=document.id(a);this.ctrEl.empty();this.ctrEl.addClass("imageviewer");this.canvas=new Element("canvas",{width:1,height:1,styles:{"-webkit-user-select":"none","-khtml-user-select":"none","-moz-user-select":"none","-o-user-select":"none","user-select":"none","-webkit-tap-highlight-color":"rgba(0,0,0,0)","-webkit-touch-callout":"none"}});
this.ctrEl.grab(this.canvas);if(Browser.ie&&window.G_vmlCanvasManager){G_vmlCanvasManager.initElement(this.canvas);
}this.layout();this.canvasContext=this.canvas.getContext("2d");if(!this.options.quality){this.canvas.setStyle("-ms-interpolation-mode","nearest-neighbor");
this.canvas.setStyle("image-rendering","-webkit-optimize-contrast");if(context.mozImageSmoothingEnabled!=undefined){context.mozImageSmoothingEnabled=false;
}}this.content=new ImgGrid(this.canvas.width,this.canvas.height,c,this.options.stripaligns,this.canvasContext,this.options.animation,this.options.maxtiles,this.options.jsonp,function(e){this.onContentReady(e);
}.bind(this));this.imageSrc=this.content.urlParams.src;this.imageServer=this.content.urlBase;if(this.options.showcontrols!="no"){this.createControls();
}}ImgCanvasView.prototype.destroy=function(){this.events=null;this.content.destroy();this.content=null;
this.canvas.destroy();this.canvas=null;this.canvasContext=null;};ImgCanvasView.prototype.init=function(){this.canvas.removeEvents();
if("ontouchstart" in window&&window.Touch){this.canvas.addEvent("touchstart",function(a){this.onTouchStart(a);
}.bind(this));this.canvas.addEvent("touchmove",function(a){this.onTouchMove(a);}.bind(this));this.canvas.addEvent("touchend",function(a){this.onTouchEnd(a);
}.bind(this));this.canvas.addEvent("touchcancel",function(a){this.onTouchCancel(a);}.bind(this));}else{this.canvas.addEvent("mousedown",function(a){this.onMouseDown(a);
}.bind(this));this.canvas.addEvent("mousemove",function(a){this.onMouseMove(a);}.bind(this));this.canvas.addEvent("mouseup",function(a){this.onMouseUp(a);
}.bind(this));this.canvas.addEvent("mouseleave",function(a){this.onMouseUp(a);}.bind(this));}this.canvas.addEvent("selectstart",function(a){return false;
});this.canvas.addEvent("dragstart",function(a){return false;});};ImgCanvasView.prototype.layout=function(){if(!this.canvas){return;
}this.ctrOuterPos=this.ctrEl.getCoordinates();this.ctrInnerPos=this.ctrEl.getComputedSize();if((this.ctrInnerPos.width==0)&&(this.ctrInnerPos.height==0)){this.ctrInnerPos={width:this.ctrEl.clientWidth,height:this.ctrEl.clientHeight};
}if(this.ctrInnerPos.computedTop==undefined){this.ctrInnerPos.computedTop=Math.round((this.ctrOuterPos.height-this.ctrInnerPos.height)/2);
}if(this.ctrInnerPos.computedLeft==undefined){this.ctrInnerPos.computedLeft=Math.round((this.ctrOuterPos.width-this.ctrInnerPos.width)/2);
}this.canvas.width=this.ctrInnerPos.width;this.canvas.height=this.ctrInnerPos.height;if(this.content){this.content.setViewportSize(this.canvas.width,this.canvas.height);
}};ImgCanvasView.prototype.reset=function(){if(!this.content){return;}this.content.reset();this.refreshZoomControls();
};ImgCanvasView.prototype.onMouseDown=function(a){if(!a.rightClick){if((a.api_event==undefined)&&this.options.doubleclickreset&&(Date.now()-this.mouseAttrs.downTime<300)){this.reset();
}else{this.mouseAttrs.down=true;this.mouseAttrs.downTime=Date.now();this.mouseAttrs.down_x=this.mouseAttrs.last_x=a.page.x;
this.mouseAttrs.down_y=this.mouseAttrs.last_y=a.page.y;this.mouseAttrs.dragged=false;this.canvas.addClass("panning");
}}};ImgCanvasView.prototype.onMouseMove=function(a){if(this.mouseAttrs.down){this.mouseAttrs.dragged=true;
if(this.content&&this.content.initialised&&!this.content.animating){setTimeout(function(){var c=(a.page.x-this.mouseAttrs.down_x);
var b=(a.page.y-this.mouseAttrs.down_y);this.content.panGrid(c,b,true,true);this.mouseAttrs.last_x=this.mouseAttrs.down_x;
this.mouseAttrs.last_y=this.mouseAttrs.down_y;this.mouseAttrs.down_x=a.page.x;this.mouseAttrs.down_y=a.page.y;
}.bind(this),1);}}};ImgCanvasView.prototype.onMouseUp=function(d){if(this.mouseAttrs.down){this.mouseAttrs.down=false;
this.canvas.removeClass("panning");if(!this.mouseAttrs.dragged&&(this.uiAttrs.fullMaskEl!=null)&&this.options.fullScreenCloseOnClick){var c=this.getClickPosition(d,true);
if(c.x<0||c.x>1||c.y<0||c.y>1){this.uiAttrs.fullMaskEl.fireEvent("click");return;}}if(this.content&&this.content.initialised&&!this.content.animating){if(!this.mouseAttrs.dragged){var c=this.getClickPosition(d,true);
this.content.zoomGrid((d.shift?-1:1),c);this.refreshZoomControls();}else{var b=(d.page.x-this.mouseAttrs.last_x);
var a=(d.page.y-this.mouseAttrs.last_y);if(Math.abs(b)>3||Math.abs(a)>3){this.content.autoPanGrid(b,a);
}}}}};ImgCanvasView.prototype.onTouchStart=function(a){a.preventDefault();if(a.touches.length==1){this.onMouseDown({page:{x:a.touches[0].pageX,y:a.touches[0].pageY},rightClick:false});
}this.touchPosReset();};ImgCanvasView.prototype.onTouchMove=function(h){h.preventDefault();if(h.touches.length==1){this.onMouseMove({page:{x:h.touches[0].pageX,y:h.touches[0].pageY}});
}else{if(h.touches.length==2){this.mouseAttrs.downTime=0;if((this.touchAttrs.last1.x!=0)||(this.touchAttrs.last1.y!=0)||(this.touchAttrs.last2.x!=0)||(this.touchAttrs.last2.y!=0)){var i=Math.abs(this.touchAttrs.last1.x-this.touchAttrs.last2.x),d=Math.abs(this.touchAttrs.last1.y-this.touchAttrs.last2.y),g=Math.sqrt((i*i)+(d*d)),j=Math.abs(h.touches[0].pageX-h.touches[1].pageX),f=Math.abs(h.touches[0].pageY-h.touches[1].pageY),k=Math.sqrt((j*j)+(f*f)),c=(k>g),a=(Math.abs(k-g)>20);
if(a){var b={page:{x:Math.round(this.touchAttrs.last1.x+((this.touchAttrs.last2.x-this.touchAttrs.last1.x)/2)),y:Math.round(this.touchAttrs.last1.y+((this.touchAttrs.last2.y-this.touchAttrs.last1.y)/2))},rightClick:false,shift:!c,api_event:true};
this.onMouseDown(b);this.onMouseUp(b);this.touchPosReset();}}else{this.touchAttrs={last1:{x:h.touches[0].pageX,y:h.touches[0].pageY},last2:{x:h.touches[1].pageX,y:h.touches[1].pageY}};
}}}};ImgCanvasView.prototype.onTouchEnd=function(a){a.preventDefault();this.onMouseUp({page:{x:a.changedTouches[0].pageX,y:a.changedTouches[0].pageY},shift:false});
this.touchPosReset();};ImgCanvasView.prototype.onTouchCancel=function(a){this.onMouseUp({page:{x:a.changedTouches[0].pageX,y:a.changedTouches[0].pageY},shift:false});
this.touchPosReset();};ImgCanvasView.prototype.touchPosReset=function(){this.touchAttrs={last1:{x:0,y:0},last2:{x:0,y:0}};
};ImgCanvasView.prototype.onContentReady=function(a){if(!this.content){return;}if(this.options.title!=null){a.title=this.options.title;
}if(this.options.description!=null){a.description=this.options.description;}this.imageInfo=a;this.setImageTitle(a.title);
this.enableDownload(a.download);this.refreshZoomControls();if(this.uiAttrs.fullScreen){this.autoZoomFit();
}if(this.events){_fire_event(this.events.onload,this,[this.imageSrc]);}};ImgCanvasView.prototype.autoZoomFit=function(){if(this.content&&this.content.initialised){this.content.zoomFit();
this.refreshZoomControls();}};ImgCanvasView.prototype.autoZoom=function(c){var b={page:{x:Math.round(this.ctrOuterPos.left+this.ctrInnerPos.computedLeft+(this.canvas.width/2)),y:Math.round(this.ctrOuterPos.top+this.ctrInnerPos.computedTop+(this.canvas.height/2))},rightClick:false,shift:!c,api_event:true};
if(this.uiAttrs.fullScreen&&this.options.fullScreenFixed){var a=window.getScroll();b.page.x+=a.x;b.page.y+=a.y;
}this.onMouseDown(b);this.onMouseUp(b);};ImgCanvasView.prototype.stripTags=function(c,a){a=a||"";var b=new RegExp("</?"+a+"([^>]+)?>","gi");
return c.replace(b," ");};ImgCanvasView.prototype.getViewportPosition=function(){var c=-this.content.g2d.origin.x,b=-this.content.g2d.origin.y,d=this.canvas.width,a=this.canvas.height;
return{left:Math.round8(c/this.content.grid.width),top:Math.round8(b/this.content.grid.height),right:Math.round8((c+d)/this.content.grid.width),bottom:Math.round8((b+a)/this.content.grid.height)};
};ImgCanvasView.prototype.getClickPosition=function(d,c){var g=d.page.x-this.ctrOuterPos.left;var f=d.page.y-this.ctrOuterPos.top;
if(this.uiAttrs.fullScreen&&this.options.fullScreenFixed){var a=window.getScroll();g-=a.x;f-=a.y;}g-=this.ctrInnerPos.computedLeft;
f-=this.ctrInnerPos.computedTop;var e={x:Math.round8(g/this.canvas.width),y:Math.round8(f/this.canvas.height)};
if(c){var b=this.getViewportPosition();return{x:Math.round8(b.left+((b.right-b.left)*e.x)),y:Math.round8(b.top+((b.bottom-b.top)*e.y))};
}else{return e;}};ImgCanvasView.prototype.createControls=function(){if(this.options.showcontrols=="auto"){var i=new Element("div",{"class":"controltoggle panelbg",html:"&nbsp;",styles:{position:"relative"}});
i.addEvent("mousedown",this.toggleControls.bind(this));this.ctrEl.grab(i);}var j=new Element("div",{styles:{position:"relative",width:"100%","line-height":"normal","text-align":"center",cursor:"default",visibility:(this.options.showcontrols=="auto")?"hidden":"visible"},events:{click:function(l){if(this.uiAttrs.fullMaskEl!=null){this.uiAttrs.fullMaskEl.fireEvent("click");
}}.bind(this)}});var k=new Element("span",{"class":"controlpanel panelbg",events:{click:function(l){l.stopPropagation();
}}});j.grab(k);if(this.options.controls.title){var d=new Element("span",{"class":"controltitle",html:"Loading..."});
k.grab(d);}if(this.options.controls.download){var f=new Element("span",{"class":"icon download disabled",title:"Download",html:"&nbsp;"});
f.addEvent("mousedown",this.downloadImage.bind(this));k.grab(f);var g=new Element("span",{"class":"separator",html:"&nbsp;"});
k.grab(g);}if(this.options.controls.help){var a=new Element("span",{"class":"icon help",title:"Help",html:"&nbsp;"});
a.addEvent("mousedown",this.toggleHelp.bind(this));k.grab(a);}if(this.options.controls.reset){var e=new Element("span",{"class":"icon reset",title:"Reset zoom",html:"&nbsp;"});
e.addEvent("mousedown",this.reset.bind(this));k.grab(e);}if(this.options.controls.zoomin){var h=new Element("span",{"class":"icon zoomin",title:"Zoom in",html:"&nbsp;"});
h.addEvent("mousedown",function(){this.autoZoom(true);}.bind(this));k.grab(h);}if(this.options.controls.zoomout){var c=new Element("span",{"class":"icon zoomout",title:"Zoom out",html:"&nbsp;"});
c.addEvent("mousedown",function(){this.autoZoom(false);}.bind(this));k.grab(c);}if(this.options.controls.fullscreen){var b=new Element("span",{"class":"icon fulltoggle",title:"Toggle full screen mode",html:"&nbsp;"});
b.addEvent("mousedown",this.toggleFullscreen.bind(this));k.grab(b);}this.controlpanel=j;this.ctrEl.grab(this.controlpanel);
this.controlpanel.getElements(".icon").each(function(l){l.addEvent("mouseover",function(){l.addClass("rollover");
});l.addEvent("mouseout",function(){l.removeClass("rollover");});});if(this.options.showcontrols=="auto"){this.uiAttrs.controlsSlider=new Fx.Slide(j,{onComplete:function(){var l=this.uiAttrs.controlsSlider.open;
if(i){l?i.removeClass("up"):i.addClass("up");}}.bind(this)});this.uiAttrs.controlsSlider.hide();j.setStyle("visibility","visible");
}};ImgCanvasView.prototype.clearRollovers=function(){if(this.controlpanel){this.controlpanel.getElements(".icon").each(function(a){a.removeClass("rollover");
});}};ImgCanvasView.prototype.refreshZoomControls=function(){if(this.content&&this.content.initialised&&this.controlpanel){var e=this.controlpanel.getElement(".zoomin"),a=this.controlpanel.getElement(".zoomout"),d=this.controlpanel.getElement(".reset"),c=(this.content.zoom.nextLevel<this.content.zoom.maxLevel),b=(this.content.zoom.nextLevel>1),f=b;
if(e){c?e.removeClass("disabled"):e.addClass("disabled");}if(a){b?a.removeClass("disabled"):a.addClass("disabled");
}if(d){f?d.removeClass("disabled"):d.addClass("disabled");}}};ImgCanvasView.prototype.enableDownload=function(b){if(this.controlpanel){var a=this.controlpanel.getElement(".download");
if(a){b?a.removeClass("disabled"):a.addClass("disabled");a.set("title",b?"Download full image":"Image download not permitted");
}}};ImgCanvasView.prototype.setImageTitle=function(c){if(this.controlpanel){var a=this.controlpanel.getElement(".controltitle");
if(a){var d=24,e=this.stripTags(c);if(e.length>d){var b=e.indexOf(" ",d-5);if((b==-1)||(b>d)){b=e.indexOf(".",d-5);
}if((b==-1)||(b>d)){b=e.indexOf(",",d-5);}if((b==-1)||(b>d)){b=e.indexOf(";",d-5);}if((b==-1)||(b>d)){b=e.indexOf("-",d-5);
}if((b==-1)||(b>d)){b=e.indexOf("\n",d-5);}if((b==-1)||(b>d)){b=d;}e=e.substring(0,b)+"...";}a.innerHTML=e;
a.removeEvents("click");a.addEvent("click",this.toggleImageInfo.bind(this));}}};ImgCanvasView.prototype.toggleControls=function(){if(this.controlpanel&&this.uiAttrs.controlsSlider){this.clearRollovers();
this.refreshZoomControls();this.uiAttrs.controlsSlider.toggle();}};ImgCanvasView.prototype.downloadImage=function(){if(this.imageInfo&&this.imageInfo.download){if(this.events){_fire_event(this.events.ondownload,this,[this.imageSrc]);
}window.location.href=this.imageServer+"original?src="+encodeURIComponent(this.imageSrc)+"&attach=1";
}};ImgCanvasView.prototype.toggleAlert=function(d){if(this.uiAttrs.alertVisible){this.uiAttrs.alertEl.destroy();
this.uiAttrs.alertEl=null;this.uiAttrs.alertVisible=false;}else{d=d.replace(/\r\n?/g,"\n");d=d.replace(/\n/g,"<br/>");
this.uiAttrs.alertEl=new Element("div",{styles:{position:"absolute",width:"0px",height:"0px","z-index":"1102"}});
var c=new Element("div",{"class":"alertpanel panelbg",html:this.stripTags(d,"(?!br)"),styles:{position:"absolute","z-index":"1102","line-height":"normal",overflow:"auto",visibility:"hidden"},events:{mousedown:function(){this.toggleAlert();
}.bind(this),touchmove:function(){return false;}}});this.ctrEl.grab(this.uiAttrs.alertEl,"top");this.uiAttrs.alertEl.grab(c);
c.setStyle("left",Math.round((this.canvas.width-c.offsetWidth)/2)+"px");c.setStyle("top",Math.max(0,Math.round((this.canvas.height-c.offsetHeight)/2))+"px");
if(c.offsetHeight>this.ctrInnerPos.height){var e=c.getComputedSize(),b=e.totalHeight-e.height,a=Math.max(20,(this.ctrInnerPos.height-b));
c.setStyle("height",a+"px");}c.setStyle("visibility","visible");this.uiAttrs.alertVisible=true;}};ImgCanvasView.prototype.toggleHelp=function(){var a="Desktop users: &nbsp;Click to zoom in, shift-click to zoom out, click and hold to pan the image"+(this.options.doubleclickreset?", and double-click to reset the zoom.":".")+"<br/><br/>Tablet users: &nbsp;Tap to zoom in, or pinch with 2 fingers to zoom in and out, tap and hold to pan the image"+(this.options.doubleclickreset?", and tap twice to reset the zoom.":".");
this.toggleAlert(a);};ImgCanvasView.prototype.toggleImageInfo=function(){if(this.imageInfo){var a=this.imageInfo.title;
if((this.imageInfo.title.length>0)&&(this.imageInfo.description.length>0)){a+="<br/><br/>";}a+=this.imageInfo.description;
}else{var a="No information available";}this.toggleAlert(a);if(this.events&&this.uiAttrs.alertVisible){_fire_event(this.events.oninfo,this,[this.imageSrc]);
}};ImgCanvasView.prototype.toggleFullscreen=function(){if(Browser.ie6){return;}if(this.uiAttrs.animating){return;
}if(this.content.animating){return;}if(this.uiAttrs.alertVisible){this.toggleAlert();}if(this.uiAttrs.fullResizeFn==null){this.uiAttrs.fullKeydownFn=function(b){this.fullscreenKeydown(b);
}.bind(this);this.uiAttrs.fullResizeFn=function(b){this.fullscreenResize();}.bind(this);}if(this.uiAttrs.fullScreen){this.uiAttrs.animating=true;
new Fx.Tween(this.ctrEl,{duration:300,onComplete:function(){window.removeEvent("resize",this.uiAttrs.fullResizeFn);
window.removeEvent("keydown",this.uiAttrs.fullKeydownFn);this.uiAttrs.fullCloseEl.destroy();this.uiAttrs.fullCloseEl=null;
this.ctrEl.dispose();this.ctrEl.setStyles(this.uiAttrs.containerStyles);this.ctrEl.removeClass("fullscreen");
this.ctrEl.replaces(this.uiAttrs.fullSwapEl);this.uiAttrs.fullSwapEl.destroy();this.uiAttrs.fullSwapEl=null;
this.uiAttrs.fullMaskEl.destroy();this.uiAttrs.fullMaskEl=null;this.layout();this.clearRollovers();this.reset();
this.uiAttrs.animating=false;this.uiAttrs.fullScreen=false;if(this.events){_fire_event(this.events.onfullscreen,this,[this.imageSrc,false]);
}}.bind(this)}).start("opacity",1,0);}else{var a=this.fullscreenGetCoords();this.uiAttrs.containerStyles=this.ctrEl.getStyles("position","z-index","opacity","left","top","width","height","margin");
this.uiAttrs.fullMaskEl=new Mask(document.body,{hideOnClick:false,"class":"fullscreen_mask",style:{"z-index":"1100"},onClick:this.toggleFullscreen.bind(this)});
this.uiAttrs.fullMaskEl.show();this.uiAttrs.fullSwapEl=this.ctrEl.clone(false,true);this.uiAttrs.fullSwapEl.replaces(this.ctrEl);
this.ctrEl.setStyles({position:this.options.fullScreenFixed?"fixed":"absolute","z-index":"1101",opacity:"0",left:a.left+"px",top:a.top+"px",width:a.width+"px",height:a.height+"px",margin:"0"});
this.ctrEl.addClass("fullscreen");document.id(document.body).grab(this.ctrEl,"top");this.layout();this.clearRollovers();
this.uiAttrs.fullCloseEl=new Element("a",{"class":"close_button",styles:{display:"block",position:"absolute","z-index":"1102",top:"0px",right:"0px",width:"33px",height:"33px"},events:{click:this.toggleFullscreen.bind(this)}});
this.ctrEl.grab(this.uiAttrs.fullCloseEl,"top");window.addEvent("keydown",this.uiAttrs.fullKeydownFn);
window.addEvent("resize",this.uiAttrs.fullResizeFn);new Fx.Tween(this.ctrEl,{duration:500,onComplete:this.autoZoomFit.bind(this)}).start("opacity",0,1);
this.uiAttrs.fullScreen=true;if(this.events){_fire_event(this.events.onfullscreen,this,[this.imageSrc,true]);
}}};ImgCanvasView.prototype.fullscreenGetCoords=function(){var c=window.getSize(),a=this.options.fullScreenFixed?{x:0,y:0}:window.getScroll(),f=Math.min(Math.round(c.x/20),Math.round(c.y/20));
var d=(a.x+f),e=(a.y+f),b=(c.x-((2*f)+(this.ctrOuterPos.width-this.ctrInnerPos.width))),g=(c.y-((2*f)+(this.ctrOuterPos.height-this.ctrInnerPos.height)));
if(this.controlpanel){if(f<this.controlpanel.offsetHeight){g-=(this.controlpanel.offsetHeight-f);}}return{left:d,top:e,width:Math.max(b,100),height:Math.max(g,100)};
};ImgCanvasView.prototype.fullscreenKeydown=function(a){if(a.code==27){setTimeout(this.toggleFullscreen.bind(this),1);
}};ImgCanvasView.prototype.fullscreenResize=function(){var a=this.fullscreenGetCoords();this.ctrEl.setStyles({left:a.left+"px",top:a.top+"px",width:a.width+"px",height:a.height+"px"});
this.layout();};function _fire_event(c,a,b){if(c&&typeof(c)==="function"){setTimeout(function(){c.apply(this,b);
}.bind(a),1);}}function _get_image_src(a){if(a.src){return a.src;}var b=a.getStyle("background-image");
if(b&&(b.length>5)&&(b.indexOf("url(")===0)){b=b.substring(4);if((b.charAt(0)=="'")||(b.charAt(0)=='"')){return b.substring(1,b.length-2);
}else{return b.substring(0,b.length-1);}}return null;}function _clean_url(a){return a?a.cleanQueryString().replace(/\+/g," "):a;
}function _img_fs_zoom_click(e,b,d){if(Browser.ie6){return;}var c=_get_image_src(e);if(!c){return;}var a=document.id("_img_fs_zoom_click_el");
if(!a){a=new Element("div",{id:"_img_fs_zoom_click_el",styles:{position:"absolute",display:"block",width:"500px",height:"500px",left:"-1000px"}});
document.id(document.body).grab(a,"top");}canvas_view_init(a,c,b,d);canvas_view_toggle_fullscreen(a);
}function _get_ct_viewer(a){a=document.id(a);return(a&&a._viewer)?a._viewer:null;}var _hcvs=null;function haveCanvasSupport(){if(_hcvs==null){var a=new Element("canvas");
if(Browser.ie&&window.G_vmlCanvasManager){G_vmlCanvasManager.initElement(a);}_hcvs=(a&&a.getContext);
}return _hcvs;}function canvas_view_init(a,d,b,c){a=document.id(a);if(a){if(haveCanvasSupport()){if(a._viewer!=undefined){a._viewer.destroy();
}var e=new ImgCanvasView(a,d,b,c);e.init();a._viewer=e;}else{a.innerHTML="Sorry, this control is unsupported. Try upgrading your web browser.";
}}return false;}function canvas_view_zoom_in(a){var b=_get_ct_viewer(a);if(b){b.autoZoom(true);}return false;
}function canvas_view_zoom_out(a){var b=_get_ct_viewer(a);if(b){b.autoZoom(false);}return false;}function canvas_view_toggle_help(a){var b=_get_ct_viewer(a);
if(b){b.toggleHelp();}return false;}function canvas_view_toggle_image_info(a){var b=_get_ct_viewer(a);
if(b){b.toggleImageInfo();}return false;}function canvas_view_toggle_fullscreen(a){var b=_get_ct_viewer(a);
if(b){b.toggleFullscreen();}return false;}function canvas_view_reset(a){var b=_get_ct_viewer(a);if(b){b.reset();
}return false;}function canvas_view_resize(a){var b=_get_ct_viewer(a);if(b){b.layout();}return false;
}function canvas_view_init_image(e,b,c){e=document.id(e);if(e){var d=b?Object.clone(b):{};var a=e.title||e.alt;
if(a){if(d.title==undefined){d.title=a;}}if(d.stripaligns===undefined){d.stripaligns=true;}e.removeEvents("click");
e.addEvent("click",function(){_img_fs_zoom_click(e,d,c);});}return false;}function canvas_view_init_all_images(c,a,b){$$("."+c).each(function(d){canvas_view_init_image(d,a,b);
});return false;}