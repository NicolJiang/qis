/*! Javascript plotting library for jQuery, v0.6
 *
 * Released under the MIT license by IOLA, December 2007.
 * 
 * Ported to MooTools 1.3 by Jacob Thornton (@fat)
 * http://mootools.net/forge/profile/fat
 * https://github.com/fat/Mootools-Flot
 * 
 * Bug fixes to selection plugin port by Matt Fozard, Quru Ltd.
 * http://www.quru.com/
 */
var flot={};
(function(c){function b(N,z,A,e){var p=[],J={colors:["#edc240","#afd8f8","#cb4b4b","#4da74d","#9440ed"],legend:{show:true,noColumns:1,labelFormatter:null,labelBoxBorderColor:"#ccc",container:null,position:"ne",margin:5,backgroundColor:null,backgroundOpacity:0.85},xaxis:{position:"bottom",mode:null,color:null,tickColor:null,transform:null,inverseTransform:null,min:null,max:null,autoscaleMargin:null,ticks:null,tickFormatter:null,labelWidth:null,labelHeight:null,tickLength:null,alignTicksWithAxis:null,tickDecimals:null,tickSize:null,minTickSize:null,monthNames:null,timeformat:null,twelveHourClock:false},yaxis:{autoscaleMargin:0.02,position:"left"},xaxes:[],yaxes:[],series:{points:{show:false,radius:3,lineWidth:2,fill:true,fillColor:"#ffffff",symbol:"circle"},lines:{lineWidth:2,fill:false,fillColor:null,steps:false},bars:{show:false,lineWidth:2,barWidth:1,fill:true,fillColor:null,align:"left",horizontal:false},shadowSize:3},grid:{show:true,aboveData:false,color:"#545454",backgroundColor:null,borderColor:null,tickColor:null,labelMargin:5,axisMargin:8,borderWidth:2,markings:null,markingsColor:"#f4f4f4",markingsLineWidth:2,clickable:false,hoverable:false,autoHighlight:true,mouseActiveRadius:10},hooks:{}},q=null,al=null,am=null,B=null,av=null,ao=[],T=[],H={left:0,right:0,top:0,bottom:0},ah=0,s=0,h=0,aa=0,m={processOptions:[],processRawData:[],processDatapoints:[],drawSeries:[],draw:[],bindEvents:[],drawOverlay:[]},f=this;
f.setData=I;f.setupGrid=M;f.draw=at;f.getPlaceholder=function(){return N;};f.getCanvas=function(){return q;
};f.getPlotOffset=function(){return H;};f.width=function(){return h;};f.height=function(){return aa;};
f.offset=function(){var aw=am[0].getCoordinates();aw.left+=H.left;aw.top+=H.top;return aw;};f.getData=function(){return p;
};f.getAxis=function(ax,ay){var aw=(ax==x?ao:T)[ay-1];if(aw&&!aw.used){aw=null;}return aw;};f.getAxes=function(){var ax={},aw;
for(aw=0;aw<ao.length;++aw){ax["x"+(aw?(aw+1):"")+"axis"]=ao[aw]||{};}for(aw=0;aw<T.length;++aw){ax["y"+(aw?(aw+1):"")+"axis"]=T[aw]||{};
}if(!ax.x2axis){ax.x2axis={n:2};}if(!ax.y2axis){ax.y2axis={n:2};}return ax;};f.getXAxes=function(){return ao;
};f.getYAxes=function(){return T;};f.getUsedAxes=Y;f.c2p=V;f.p2c=O;f.getOptions=function(){return J;};
f.highlight=an;f.unhighlight=ag;f.triggerRedrawOverlay=U;f.pointOffset=function(aw){return{left:parseInt(ao[v(aw,"x")-1].p2c(+aw.x)+H.left),top:parseInt(T[v(aw,"y")-1].p2c(+aw.y)+H.top)};
};f.hooks=m;E(f);X(A);F();I(z);M();at();ar();function C(ay,aw){aw=[f].concat(aw);for(var ax=0;ax<ay.length;
++ax){ay[ax].apply(this,aw);}}function E(){for(var aw=0;aw<e.length;++aw){var ax=e[aw];ax.init(f);if(ax.options){Object.merge(J,ax.options);
}}}function X(ax){var aw;Object.merge(J,ax);if(J.xaxis.color==null){J.xaxis.color=J.grid.color;}if(J.yaxis.color==null){J.yaxis.color=J.grid.color;
}if(J.xaxis.tickColor==null){J.xaxis.tickColor=J.grid.tickColor;}if(J.yaxis.tickColor==null){J.yaxis.tickColor=J.grid.tickColor;
}if(J.grid.borderColor==null){J.grid.borderColor=J.grid.color;}if(J.grid.tickColor==null){J.grid.tickColor="rgba("+new Color("#fff")+",.22)";
}for(aw=0;aw<Math.max(1,J.xaxes.length);++aw){J.xaxes[aw]=Object.merge({},J.xaxis,J.xaxes[aw]);}for(aw=0;
aw<Math.max(1,J.yaxes.length);++aw){J.yaxes[aw]=Object.merge({},J.yaxis,J.yaxes[aw]);}if(J.xaxis.noTicks&&J.xaxis.ticks==null){J.xaxis.ticks=J.xaxis.noTicks;
}if(J.yaxis.noTicks&&J.yaxis.ticks==null){J.yaxis.ticks=J.yaxis.noTicks;}if(J.x2axis){J.x2axis.position="top";
J.xaxes[1]=J.x2axis;}if(J.y2axis){if(J.y2axis.autoscaleMargin===undefined){J.y2axis.autoscaleMargin=0.02;
}J.y2axis.position="right";J.yaxes[1]=J.y2axis;}if(J.grid.coloredAreas){J.grid.markings=J.grid.coloredAreas;
}if(J.grid.coloredAreasColor){J.grid.markingsColor=J.grid.coloredAreasColor;}if(J.lines){Object.merge(J.series.lines,J.lines);
}if(J.points){Object.merge(J.series.points,J.points);}if(J.bars){Object.extend(J.series.bars,J.bars);
}if(J.shadowSize){J.series.shadowSize=J.shadowSize;}for(aw=0;aw<J.xaxes.length;++aw){K(ao,aw+1).options=J.xaxes[aw];
}for(aw=0;aw<J.yaxes.length;++aw){K(T,aw+1).options=J.yaxes[aw];}for(var ay in m){if(J.hooks[ay]&&J.hooks[ay].length){m[ay]=m[ay].concat(J.hooks[ay]);
}}C(m.processOptions,[J]);}function I(aw){p=n(aw);w();P();}function n(az){var ax=[];for(var aw=0;aw<az.length;
++aw){var ay=Object.merge({},J.series);if(az[aw].data){ay.data=az[aw].data;delete az[aw].data;Object.merge(ay,az[aw]);
az[aw].data=ay.data;}else{ay.data=az[aw];}ax.push(ay);}return ax;}function v(ax,ay){var aw=ax[ay+"axis"];
if(typeof aw=="object"){aw=aw.n;}if(typeof aw!="number"){aw=1;}return aw;}function V(az){var ax={},aw,ay;
for(aw=0;aw<ao.length;++aw){ay=ao[aw];if(ay&&ay.used){ax["x"+ay.n]=ay.c2p(az.left);}}for(aw=0;aw<T.length;
++aw){ay=T[aw];if(ay&&ay.used){ax["y"+ay.n]=ay.c2p(az.top);}}if(ax.x1!==undefined){ax.x=ax.x1;}if(ax.y1!==undefined){ax.y=ax.y1;
}return ax;}function O(aA){var ay={},ax,az,aw;for(ax=0;ax<ao.length;++ax){az=ao[ax];if(az&&az.used){aw="x"+az.n;
if(aA[aw]==null&&az.n==1){aw="x";}if(aA[aw]!=null){ay.left=az.p2c(aA[aw]);break;}}}for(ax=0;ax<T.length;
++ax){az=T[ax];if(az&&az.used){aw="y"+az.n;if(aA[aw]==null&&az.n==1){aw="y";}if(aA[aw]!=null){ay.top=az.p2c(aA[aw]);
break;}}}return ay;}function Y(){var ax=[],aw,ay;for(aw=0;aw<ao.length;++aw){ay=ao[aw];if(ay&&ay.used){ax.push(ay);
}}for(aw=0;aw<T.length;++aw){ay=T[aw];if(ay&&ay.used){ax.push(ay);}}return ax;}function K(ax,aw){if(!ax[aw-1]){ax[aw-1]={n:aw,direction:ax==ao?"x":"y",options:Object.merge({},ax==ao?J.xaxis:J.yaxis)};
}return ax[aw-1];}function w(){var aB;var aH=p.length,aw=[],az=[];for(aB=0;aB<p.length;++aB){var aE=p[aB].color;
if(aE!=null){--aH;if(typeof aE=="number"){az.push(aE);}else{aw.push("rgb("+new Color(p[aB].color)+")");
}}}for(aB=0;aB<az.length;++aB){aH=Math.max(aH,az[aB]+1);}var ax=[],aA=0;aB=0;while(ax.length<aH){var aD;
if(J.colors.length==aB){aD=new Color([100,100,100]);}else{aD=new Color(J.colors[aB]);}var ay=aA%2==1?-1:1;
aD.setSaturation(1+ay*Math.ceil(aA/2)*0.2);ax.push("rgb("+aD+")");++aB;if(aB>=J.colors.length){aB=0;++aA;
}}var aC=0,aI;for(aB=0;aB<p.length;++aB){aI=p[aB];if(aI.color==null){aI.color=ax[aC].toString();++aC;
}else{if(typeof aI.color=="number"){aI.color=ax[aI.color].toString();}}if(aI.lines.show==null){var aG,aF=true;
for(aG in aI){if(aI[aG]&&aI[aG].show){aF=false;break;}}if(aF){aI.lines.show=true;}}aI.xaxis=K(ao,v(aI,"x"));
aI.yaxis=K(T,v(aI,"y"));}}function P(){var aJ=Number.POSITIVE_INFINITY,aD=Number.NEGATIVE_INFINITY,aP,aN,aM,aI,ay,aE,aO,aK,aC,aB,ax,aV,aS,aG;
function aw(aW,aX){if(!aW){return;}aW.datamin=aJ;aW.datamax=aD;aW.used=false;}function aA(aY,aX,aW){if(aX<aY.datamin){aY.datamin=aX;
}if(aW>aY.datamax){aY.datamax=aW;}}for(aP=0;aP<ao.length;++aP){aw(ao[aP]);}for(aP=0;aP<T.length;++aP){aw(T[aP]);
}for(aP=0;aP<p.length;++aP){aE=p[aP];aE.datapoints={points:[]};C(m.processRawData,[aE,aE.data,aE.datapoints]);
}for(aP=0;aP<p.length;++aP){aE=p[aP];var aU=aE.data,aR=aE.datapoints.format;if(!aR){aR=[];aR.push({x:true,number:true,required:true});
aR.push({y:true,number:true,required:true});if(aE.bars.show||(aE.lines.show&&aE.lines.fill)){aR.push({y:true,number:true,required:false,defaultValue:0});
if(aE.bars.horizontal){delete aR[aR.length-1].y;aR[aR.length-1].x=true;}}aE.datapoints.format=aR;}if(aE.datapoints.pointsize!=null){continue;
}aE.datapoints.pointsize=aR.length;aK=aE.datapoints.pointsize;aO=aE.datapoints.points;insertSteps=aE.lines.show&&aE.lines.steps;
aE.xaxis.used=aE.yaxis.used=true;for(aN=aM=0;aN<aU.length;++aN,aM+=aK){aG=aU[aN];var az=aG==null;if(!az){for(aI=0;
aI<aK;++aI){aV=aG[aI];aS=aR[aI];if(aS){if(aS.number&&aV!=null){aV=+aV;if(isNaN(aV)){aV=null;}}if(aV==null){if(aS.required){az=true;
}if(aS.defaultValue!=null){aV=aS.defaultValue;}}}aO[aM+aI]=aV;}}if(az){for(aI=0;aI<aK;++aI){aV=aO[aM+aI];
if(aV!=null){aS=aR[aI];if(aS.x){aA(aE.xaxis,aV,aV);}if(aS.y){aA(aE.yaxis,aV,aV);}}aO[aM+aI]=null;}}else{if(insertSteps&&aM>0&&aO[aM-aK]!=null&&aO[aM-aK]!=aO[aM]&&aO[aM-aK+1]!=aO[aM+1]){for(aI=0;
aI<aK;++aI){aO[aM+aK+aI]=aO[aM+aI];}aO[aM+1]=aO[aM-aK+1];aM+=aK;}}}}for(aP=0;aP<p.length;++aP){aE=p[aP];
C(m.processDatapoints,[aE,aE.datapoints]);}for(aP=0;aP<p.length;++aP){aE=p[aP];aO=aE.datapoints.points,aK=aE.datapoints.pointsize;
var aF=aJ,aL=aJ,aH=aD,aQ=aD;for(aN=0;aN<aO.length;aN+=aK){if(aO[aN]==null){continue;}for(aI=0;aI<aK;++aI){aV=aO[aN+aI];
aS=aR[aI];if(!aS){continue;}if(aS.x){if(aV<aF){aF=aV;}if(aV>aH){aH=aV;}}if(aS.y){if(aV<aL){aL=aV;}if(aV>aQ){aQ=aV;
}}}}if(aE.bars.show){var aT=aE.bars.align=="left"?0:-aE.bars.barWidth/2;if(aE.bars.horizontal){aL+=aT;
aQ+=aT+aE.bars.barWidth;}else{aF+=aT;aH+=aT+aE.bars.barWidth;}}aA(aE.xaxis,aF,aH);aA(aE.yaxis,aL,aQ);
}Y().each(function(aX,aW){if(aX.datamin==aJ){aX.datamin=null;}if(aX.datamax==aD){aX.datamax=null;}});
}function F(){function aw(ay,ax){var az=document.createElement("canvas");az.width=ay;az.height=ax;if(!az.getContext){az=window.G_vmlCanvasManager.initElement(az);
}return az;}ah=N.getSize().x||parseInt(N.getStyle("width"));s=N.getSize().y||parseInt(N.getStyle("height"));
N.set("html","");if(N.getStyle("position")=="static"){N.getStyle("position","relative");}if(ah<=0||s<=0){throw"Invalid dimensions for plot, width = "+ah+", height = "+s;
}if(window.G_vmlCanvasManager){window.G_vmlCanvasManager.init_(document);}q=aw(ah,s).inject(N);B=q.getContext("2d");
al=aw(ah,s).setStyles({position:"absolute",left:0,top:0}).inject(N);av=al.getContext("2d");av.stroke();
}function ar(){am=$$([al,q]);if(J.grid.hoverable){N.addEvent("mousemove",d);}if(J.grid.clickable){N.addEvent("click",G);
}C(m.bindEvents,[am]);}function l(aB){function ax(aC){return aC;}var aA,aw,ay=aB.options.transform||ax,az=aB.options.inverseTransform;
if(aB.direction=="x"){aA=aB.scale=h/(ay(aB.max)-ay(aB.min));aw=ay(aB.min);if(ay==ax){aB.p2c=function(aC){return(aC-aw)*aA;
};}else{aB.p2c=function(aC){return(ay(aC)-aw)*aA;};}if(!az){aB.c2p=function(aC){return aw+aC/aA;};}else{aB.c2p=function(aC){return az(aw+aC/aA);
};}}else{aA=aB.scale=aa/(ay(aB.max)-ay(aB.min));aw=ay(aB.max);if(ay==ax){aB.p2c=function(aC){return(aw-aC)*aA;
};}else{aB.p2c=function(aC){return(aw-ay(aC))*aA;};}if(!az){aB.c2p=function(aC){return aw-aC/aA;};}else{aB.c2p=function(aC){return az(aw-aC/aA);
};}}}function W(ay){if(!ay){return;}var aw=ay.options,aA,aE=ay.ticks||[],aD=[],az,aF=aw.labelWidth,aB=aw.labelHeight,ax;
function aC(aH,aG){return new Element("div",{styles:{position:"absolute",top:-10000,width:aG,"font-size":"smaller"}}).adopt(new Element("div."+ay.direction+"Axis "+ay.direction+ay.n+"Axis",{html:aH.join("")})).inject(N);
}if(ay.direction=="x"){if(aF==null){aF=Math.floor(ah/(aE.length>0?aE.length:1));}if(aB==null){aD=[];for(aA=0;
aA<aE.length;++aA){az=aE[aA].label;if(az){aD.push('<div class="tickLabel" style="float:left;width:'+aF+'px">'+az+"</div>");
}}if(aD.length>0){aD.push('<div style="clear:left"></div>');ax=aC(aD,10000);aB=ax.getSize().y||parseInt(ax.getStyle("height"));
ax.destroy();}}}else{if(aF==null||aB==null){for(aA=0;aA<aE.length;++aA){az=aE[aA].label;if(az){aD.push('<div class="tickLabel">'+az+"</div>");
}}if(aD.length>0){ax=aC(aD);if(aF==null){aF=ax.getChildren()[0].getSize().x;}if(aB==null){aB=ax.getElement("div.tickLabel").getSize().y;
}ax.destroy();}}}if(aF==null){aF=0;}if(aB==null){aB=0;}ay.labelWidth=aF;ay.labelHeight=aB;}function Z(ay){if(!ay||(!ay.used&&!(ay.labelWidth||ay.labelHeight))){return;
}var ax=ay.labelWidth,aG=ay.labelHeight,aC=ay.options.position,aA=ay.options.tickLength,aB=J.grid.axisMargin,aE=J.grid.labelMargin,aF=ay.direction=="x"?ao:T,az;
var aw=aF.filter(function(aI){return aI&&aI.options.position==aC&&(aI.labelHeight||aI.labelWidth);});
if(aw.indexOf(ay)==aw.length-1){aB=0;}if(aA==null){aA="full";}var aD=aF.filter(function(aI){return aI&&(aI.labelHeight||aI.labelWidth);
});var aH=aD.indexOf(ay)===0;if(!aH&&aA=="full"){aA=5;}if(!isNaN(+aA)){aE+=+aA;}if(ay.direction=="x"){aG+=aE;
if(aC=="bottom"){H.bottom+=aG+aB;ay.box={top:s-H.bottom,height:aG};}else{ay.box={top:H.top+aB,height:aG};
H.top+=aG+aB;}}else{ax+=aE;if(aC=="left"){ay.box={left:H.left+aB,width:ax};H.left+=ax+aB;}else{H.right+=ax+aB;
ay.box={left:ah-H.right,width:ax};}}ay.position=aC;ay.tickLength=aA;ay.box.padding=aE;ay.innermost=aH;
}function ab(aw){if(aw.direction=="x"){aw.box.left=H.left;aw.box.width=h;}else{aw.box.top=H.top;aw.box.height=aa;
}}function M(){var aB=Y(),ay,ax;for(ax=0;ax<aB.length;++ax){k(aB[ax]);}H.left=H.right=H.top=H.bottom=0;
if(J.grid.show){for(ax=0;ax<aB.length;++ax){aq(aB[ax]);S(aB[ax]);r(aB[ax],aB[ax].ticks);}for(ay=0;ay<ao.length;
++ay){W(ao[ay]);}for(ay=0;ay<T.length;++ay){W(T[ay]);}for(ay=ao.length-1;ay>=0;--ay){Z(ao[ay]);}for(ay=T.length-1;
ay>=0;--ay){Z(T[ay]);}var aA=0;for(var az=0;az<p.length;++az){aA=Math.max(aA,2*(p[az].points.radius+p[az].points.lineWidth/2));
}for(var aw in H){H[aw]+=J.grid.borderWidth;H[aw]=Math.max(aA,H[aw]);}}h=ah-H.left-H.right;aa=s-H.bottom-H.top;
for(ax=0;ax<aB.length;++ax){l(aB[ax]);}if(J.grid.show){for(ax=0;ax<aB.length;++ax){ab(aB[ax]);}ae();}au();
}function k(az){var aA=az.options,ay=+(aA.min!=null?aA.min:az.datamin),aw=+(aA.max!=null?aA.max:az.datamax),aC=aw-ay;
if(aC==0){var ax=aw==0?1:0.01;if(aA.min==null){ay-=ax;}if(aA.max==null||aA.min!=null){aw+=ax;}}else{var aB=aA.autoscaleMargin;
if(aB!=null){if(aA.min==null){ay-=aC*aB;if(ay<0&&az.datamin!=null&&az.datamin>=0){ay=0;}}if(aA.max==null){aw+=aC*aB;
if(aw>0&&az.datamax!=null&&az.datamax<=0){aw=0;}}}}az.min=ay;az.max=aw;}function aq(aB){var aH=aB.options;
var aC;if(typeof aH.ticks=="number"&&aH.ticks>0){aC=aH.ticks;}else{if(aB.direction=="x"){aC=0.3*Math.sqrt(ah);
}else{aC=0.3*Math.sqrt(s);}}var aO=(aB.max-aB.min)/aC,aJ,aw,aI,aM,aN,aL,aD;if(aH.mode=="time"){var aE={second:1000,minute:60*1000,hour:60*60*1000,day:24*60*60*1000,month:30*24*60*60*1000,year:365.2425*24*60*60*1000};
var aF=[[1,"second"],[2,"second"],[5,"second"],[10,"second"],[30,"second"],[1,"minute"],[2,"minute"],[5,"minute"],[10,"minute"],[30,"minute"],[1,"hour"],[2,"hour"],[4,"hour"],[8,"hour"],[12,"hour"],[1,"day"],[2,"day"],[3,"day"],[0.25,"month"],[0.5,"month"],[1,"month"],[2,"month"],[3,"month"],[6,"month"],[1,"year"]];
var ax=0;if(aH.minTickSize!=null){if(typeof aH.tickSize=="number"){ax=aH.tickSize;}else{ax=aH.minTickSize[0]*aE[aH.minTickSize[1]];
}}for(var aN=0;aN<aF.length-1;++aN){if(aO<(aF[aN][0]*aE[aF[aN][1]]+aF[aN+1][0]*aE[aF[aN+1][1]])/2&&aF[aN][0]*aE[aF[aN][1]]>=ax){break;
}}aJ=aF[aN][0];aI=aF[aN][1];if(aI=="year"){aL=Math.pow(10,Math.floor(Math.log(aO/aE.year)/Math.LN10));
aD=(aO/aE.year)/aL;if(aD<1.5){aJ=1;}else{if(aD<3){aJ=2;}else{if(aD<7.5){aJ=5;}else{aJ=10;}}}aJ*=aL;}aB.tickSize=aH.tickSize||[aJ,aI];
aw=function(aS){var aX=[],aV=aS.tickSize[0],aY=aS.tickSize[1],aW=new Date(aS.min);var aR=aV*aE[aY];if(aY=="second"){aW.setUTCSeconds(a(aW.getUTCSeconds(),aV));
}if(aY=="minute"){aW.setUTCMinutes(a(aW.getUTCMinutes(),aV));}if(aY=="hour"){aW.setUTCHours(a(aW.getUTCHours(),aV));
}if(aY=="month"){aW.setUTCMonth(a(aW.getUTCMonth(),aV));}if(aY=="year"){aW.setUTCFullYear(a(aW.getUTCFullYear(),aV));
}aW.setUTCMilliseconds(0);if(aR>=aE.minute){aW.setUTCSeconds(0);}if(aR>=aE.hour){aW.setUTCMinutes(0);
}if(aR>=aE.day){aW.setUTCHours(0);}if(aR>=aE.day*4){aW.setUTCDate(1);}if(aR>=aE.year){aW.setUTCMonth(0);
}var a0=0,aZ=Number.NaN,aT;do{aT=aZ;aZ=aW.getTime();aX.push(aZ);if(aY=="month"){if(aV<1){aW.setUTCDate(1);
var aQ=aW.getTime();aW.setUTCMonth(aW.getUTCMonth()+1);var aU=aW.getTime();aW.setTime(aZ+a0*aE.hour+(aU-aQ)*aV);
a0=aW.getUTCHours();aW.setUTCHours(0);}else{aW.setUTCMonth(aW.getUTCMonth()+aV);}}else{if(aY=="year"){aW.setUTCFullYear(aW.getUTCFullYear()+aV);
}else{aW.setTime(aZ+aR);}}}while(aZ<aS.max&&aZ!=aT);return aX;};aM=function(aQ,aT){var aV=new Date(aQ);
if(aH.timeformat!=null){return c.plot.formatDate(aV,aH.timeformat,aH.monthNames);}var aR=aT.tickSize[0]*aE[aT.tickSize[1]];
var aS=aT.max-aT.min;var aU=(aH.twelveHourClock)?" %p":"";if(aR<aE.minute){fmt="%h:%M:%S"+aU;}else{if(aR<aE.day){if(aS<2*aE.day){fmt="%h:%M"+aU;
}else{fmt="%b %d %h:%M"+aU;}}else{if(aR<aE.month){fmt="%b %d";}else{if(aR<aE.year){if(aS<aE.year){fmt="%b";
}else{fmt="%b %y";}}else{fmt="%y";}}}}return c.plot.formatDate(aV,fmt,aH.monthNames);};}else{var aP=aH.tickDecimals;
var aK=-Math.floor(Math.log(aO)/Math.LN10);if(aP!=null&&aK>aP){aK=aP;}aL=Math.pow(10,-aK);aD=aO/aL;if(aD<1.5){aJ=1;
}else{if(aD<3){aJ=2;if(aD>2.25&&(aP==null||aK+1<=aP)){aJ=2.5;++aK;}}else{if(aD<7.5){aJ=5;}else{aJ=10;
}}}aJ*=aL;if(aH.minTickSize!=null&&aJ<aH.minTickSize){aJ=aH.minTickSize;}aB.tickDecimals=Math.max(0,aP!=null?aP:aK);
aB.tickSize=aH.tickSize||aJ;aw=function(aS){var aU=[];var aV=a(aS.min,aS.tickSize),aR=0,aQ=Number.NaN,aT;
do{aT=aQ;aQ=aV+aR*aS.tickSize;aU.push(aQ);++aR;}while(aQ<aS.max&&aQ!=aT);return aU;};aM=function(aQ,aR){return aQ.toFixed(aR.tickDecimals);
};}if(aH.alignTicksWithAxis!=null){var aA=(aB.direction=="x"?ao:T)[aH.alignTicksWithAxis-1];if(aA&&aA.used&&aA!=aB){var aG=aw(aB);
if(aG.length>0){if(aH.min==null){aB.min=Math.min(aB.min,aG[0]);}if(aH.max==null&&aG.length>1){aB.max=Math.max(aB.max,aG[aG.length-1]);
}}aw=function(aS){var aT=[],aQ,aR;for(aR=0;aR<aA.ticks.length;++aR){aQ=(aA.ticks[aR].v-aA.min)/(aA.max-aA.min);
aQ=aS.min+aQ*(aS.max-aS.min);aT.push(aQ);}return aT;};if(aB.mode!="time"&&aH.tickDecimals==null){var az=Math.max(0,-Math.floor(Math.log(aO)/Math.LN10)+1),ay=aw(aB);
if(!(ay.length>1&&/\..*0$/.test((ay[1]-ay[0]).toFixed(az)))){aB.tickDecimals=az;}}}}aB.tickGenerator=aw;
if(typeOf(aH.tickFormatter)=="function"){aB.tickFormatter=function(aQ,aR){return""+aH.tickFormatter(aQ,aR);
};}else{aB.tickFormatter=aM;}}function S(aA){aA.ticks=[];var aC=aA.options.ticks,aB=null;if(aC==null||(typeof aC=="number"&&aC>0)){aB=aA.tickGenerator(aA);
}else{if(aC){if(typeOf(aC)=="function"){aB=aC({min:aA.min,max:aA.max});}else{aB=aC;}}}var az,aw;for(az=0;
az<aB.length;++az){var ax=null;var ay=aB[az];if(typeof ay=="object"){aw=ay[0];if(ay.length>1){ax=ay[1];
}}else{aw=ay;}if(ax==null){ax=aA.tickFormatter(aw,aA);}aA.ticks[az]={v:aw,label:ax};}}function r(aw,ax){if(aw.options.autoscaleMargin!=null&&ax.length>0){if(aw.options.min==null){aw.min=Math.min(aw.min,ax[0].v);
}if(aw.options.max==null&&ax.length>1){aw.max=Math.max(aw.max,ax[ax.length-1].v);}}}function at(){B.clearRect(0,0,ah,s);
var ax=J.grid;if(ax.show&&!ax.aboveData){u();}for(var aw=0;aw<p.length;++aw){C(m.drawSeries,[B,p[aw]]);
aj(p[aw]);}C(m.draw,[B]);if(ax.show&&ax.aboveData){u();}}function o(aw,aD){var az,aC,aB,aA,ay;aA=Y();
for(i=0;i<aA.length;++i){az=aA[i];if(az.direction==aD){ay=aD+az.n+"axis";if(!aw[ay]&&az.n==1){ay=aD+"axis";
}if(aw[ay]){aC=aw[ay].from;aB=aw[ay].to;break;}}}if(!aw[ay]){az=aD=="x"?ao[0]:T[0];aC=aw[aD+"1"];aB=aw[aD+"2"];
}if(aC!=null&&aB!=null&&aC>aB){var ax=aC;aC=aB;aB=ax;}return{from:aC,to:aB,axis:az};}function u(){var aA;
B.save();B.translate(H.left,H.top);if(J.grid.backgroundColor){B.fillStyle=t(J.grid.backgroundColor,aa,0,"rgba(255, 255, 255, 0)");
B.fillRect(0,0,h,aa);}var aC=J.grid.markings;if(aC){if(typeOf(aC)=="function"){var aF=f.getAxes();aF.xmin=aF.xaxis.min;
aF.xmax=aF.xaxis.max;aF.ymin=aF.yaxis.min;aF.ymax=aF.yaxis.max;aC=aC(aF);}for(aA=0;aA<aC.length;++aA){var ay=aC[aA],ax=o(ay,"x"),aD=o(ay,"y");
if(ax.from==null){ax.from=ax.axis.min;}if(ax.to==null){ax.to=ax.axis.max;}if(aD.from==null){aD.from=aD.axis.min;
}if(aD.to==null){aD.to=aD.axis.max;}if(ax.to<ax.axis.min||ax.from>ax.axis.max||aD.to<aD.axis.min||aD.from>aD.axis.max){continue;
}ax.from=Math.max(ax.from,ax.axis.min);ax.to=Math.min(ax.to,ax.axis.max);aD.from=Math.max(aD.from,aD.axis.min);
aD.to=Math.min(aD.to,aD.axis.max);if(ax.from==ax.to&&aD.from==aD.to){continue;}ax.from=ax.axis.p2c(ax.from);
ax.to=ax.axis.p2c(ax.to);aD.from=aD.axis.p2c(aD.from);aD.to=aD.axis.p2c(aD.to);if(ax.from==ax.to||aD.from==aD.to){B.beginPath();
B.strokeStyle=ay.color||J.grid.markingsColor;B.lineWidth=ay.lineWidth||J.grid.markingsLineWidth;B.moveTo(ax.from,aD.from);
B.lineTo(ax.to,aD.to);B.stroke();}else{B.fillStyle=ay.color||J.grid.markingsColor;B.fillRect(ax.from,aD.to,ax.to-ax.from,aD.from-aD.to);
}}}var aF=Y(),aH=J.grid.borderWidth;for(var az=0;az<aF.length;++az){var aw=aF[az],aB=aw.box,aL=aw.tickLength,aI,aG,aK,aE;
B.strokeStyle=aw.options.tickColor||"rgba("+new Color(aw.options.color)+",.22)";B.lineWidth=1;if(aw.direction=="x"){aI=0;
if(aL=="full"){aG=(aw.position=="top"?0:aa);}else{aG=aB.top-H.top+(aw.position=="top"?aB.height:0);}}else{aG=0;
if(aL=="full"){aI=(aw.position=="left"?0:h);}else{aI=aB.left-H.left+(aw.position=="left"?aB.width:0);
}}if(!aw.innermost){B.beginPath();aK=aE=0;if(aw.direction=="x"){aK=h;}else{aE=aa;}if(B.lineWidth==1){aI=Math.floor(aI)+0.5;
aG=Math.floor(aG)+0.5;}B.moveTo(aI,aG);B.lineTo(aI+aK,aG+aE);B.stroke();}B.beginPath();for(aA=0;aA<aw.ticks.length;
++aA){var aJ=aw.ticks[aA].v;aK=aE=0;if(aJ<aw.min||aJ>aw.max||(aL=="full"&&aH>0&&(aJ==aw.min||aJ==aw.max))){continue;
}if(aw.direction=="x"){aI=aw.p2c(aJ);aE=aL=="full"?-aa:aL;if(aw.position=="top"){aE=-aE;}}else{aG=aw.p2c(aJ);
aK=aL=="full"?-h:aL;if(aw.position=="left"){aK=-aK;}}if(B.lineWidth==1){if(aw.direction=="x"){aI=Math.floor(aI)+0.5;
}else{aG=Math.floor(aG)+0.5;}}B.moveTo(aI,aG);B.lineTo(aI+aK,aG+aE);}B.stroke();}if(aH){B.lineWidth=aH;
B.strokeStyle=J.grid.borderColor;B.strokeRect(-aH/2,-aH/2,h+aH,aa+aH);}B.restore();}function ae(){N.getElement(".tickLabels")&&N.getElement(".tickLabels").destroy();
var ax=new Element("div.tickLabels",{style:"font-size:smaller"});var aC=[];var aF=Y();for(var az=0;az<aF.length;
++az){var ay=aF[az],aB=ay.box;aC.push('<div class="'+ay.direction+"Axis "+ay.direction+ay.n+'Axis" style="color:'+ay.options.color+'">');
for(var aA=0;aA<ay.ticks.length;++aA){var aD=ay.ticks[aA];if(!aD.label||aD.v<ay.min||aD.v>ay.max){continue;
}var aG={},aE;if(ay.direction=="x"){aE="center";aG.left=Math.round(H.left+ay.p2c(aD.v)-ay.labelWidth/2);
if(ay.position=="bottom"){aG.top=aB.top+aB.padding;}else{aG.bottom=s-(aB.top+aB.height-aB.padding);}}else{aG.top=Math.round(H.top+ay.p2c(aD.v)-ay.labelHeight/2);
if(ay.position=="left"){aG.right=ah-(aB.left+aB.width-aB.padding);aE="right";}else{aG.left=aB.left+aB.padding;
aE="left";}}aG.width=ay.labelWidth;var aw=["position:absolute","text-align:"+aE];for(var aH in aG){aw.push(aH+":"+aG[aH]+"px");
}aC.push('<div class="tickLabel" style="'+aw.join(";")+'">'+aD.label+"</div>");}aC.push("</div>");}N.adopt(ax.set("html",aC.join("")));
}function aj(aw){if(aw.lines.show){D(aw);}if(aw.bars.show){Q(aw);}if(aw.points.show){R(aw);}}function D(az){function ay(aK,aL,aD,aP,aO){var aQ=aK.points,aE=aK.pointsize,aI=null,aH=null;
B.beginPath();for(var aJ=aE;aJ<aQ.length;aJ+=aE){var aG=aQ[aJ-aE],aN=aQ[aJ-aE+1],aF=aQ[aJ],aM=aQ[aJ+1];
if(aG==null||aF==null){continue;}if(aN<=aM&&aN<aO.min){if(aM<aO.min){continue;}aG=(aO.min-aN)/(aM-aN)*(aF-aG)+aG;
aN=aO.min;}else{if(aM<=aN&&aM<aO.min){if(aN<aO.min){continue;}aF=(aO.min-aN)/(aM-aN)*(aF-aG)+aG;aM=aO.min;
}}if(aN>=aM&&aN>aO.max){if(aM>aO.max){continue;}aG=(aO.max-aN)/(aM-aN)*(aF-aG)+aG;aN=aO.max;}else{if(aM>=aN&&aM>aO.max){if(aN>aO.max){continue;
}aF=(aO.max-aN)/(aM-aN)*(aF-aG)+aG;aM=aO.max;}}if(aG<=aF&&aG<aP.min){if(aF<aP.min){continue;}aN=(aP.min-aG)/(aF-aG)*(aM-aN)+aN;
aG=aP.min;}else{if(aF<=aG&&aF<aP.min){if(aG<aP.min){continue;}aM=(aP.min-aG)/(aF-aG)*(aM-aN)+aN;aF=aP.min;
}}if(aG>=aF&&aG>aP.max){if(aF>aP.max){continue;}aN=(aP.max-aG)/(aF-aG)*(aM-aN)+aN;aG=aP.max;}else{if(aF>=aG&&aF>aP.max){if(aG>aP.max){continue;
}aM=(aP.max-aG)/(aF-aG)*(aM-aN)+aN;aF=aP.max;}}if(aG!=aI||aN!=aH){B.moveTo(aP.p2c(aG)+aL,aO.p2c(aN)+aD);
}aI=aF;aH=aM;B.lineTo(aP.p2c(aF)+aL,aO.p2c(aM)+aD);}B.stroke();}function aA(aD,aL,aK){var aR=aD.points,aQ=aD.pointsize,aI=Math.min(Math.max(0,aK.min),aK.max),aS=0,aP,aO=false,aH=1,aG=0,aM=0;
while(true){if(aQ>0&&aS>aR.length+aQ){break;}aS+=aQ;var aU=aR[aS-aQ],aF=aR[aS-aQ+aH],aT=aR[aS],aE=aR[aS+aH];
if(aO){if(aQ>0&&aU!=null&&aT==null){aM=aS;aQ=-aQ;aH=2;continue;}if(aQ<0&&aS==aG+aQ){B.fill();aO=false;
aQ=-aQ;aH=1;aS=aG=aM+aQ;continue;}}if(aU==null||aT==null){continue;}if(aU<=aT&&aU<aL.min){if(aT<aL.min){continue;
}aF=(aL.min-aU)/(aT-aU)*(aE-aF)+aF;aU=aL.min;}else{if(aT<=aU&&aT<aL.min){if(aU<aL.min){continue;}aE=(aL.min-aU)/(aT-aU)*(aE-aF)+aF;
aT=aL.min;}}if(aU>=aT&&aU>aL.max){if(aT>aL.max){continue;}aF=(aL.max-aU)/(aT-aU)*(aE-aF)+aF;aU=aL.max;
}else{if(aT>=aU&&aT>aL.max){if(aU>aL.max){continue;}aE=(aL.max-aU)/(aT-aU)*(aE-aF)+aF;aT=aL.max;}}if(!aO){B.beginPath();
B.moveTo(aL.p2c(aU),aK.p2c(aI));aO=true;}if(aF>=aK.max&&aE>=aK.max){B.lineTo(aL.p2c(aU),aK.p2c(aK.max));
B.lineTo(aL.p2c(aT),aK.p2c(aK.max));continue;}else{if(aF<=aK.min&&aE<=aK.min){B.lineTo(aL.p2c(aU),aK.p2c(aK.min));
B.lineTo(aL.p2c(aT),aK.p2c(aK.min));continue;}}var aJ=aU,aN=aT;if(aF<=aE&&aF<aK.min&&aE>=aK.min){aU=(aK.min-aF)/(aE-aF)*(aT-aU)+aU;
aF=aK.min;}else{if(aE<=aF&&aE<aK.min&&aF>=aK.min){aT=(aK.min-aF)/(aE-aF)*(aT-aU)+aU;aE=aK.min;}}if(aF>=aE&&aF>aK.max&&aE<=aK.max){aU=(aK.max-aF)/(aE-aF)*(aT-aU)+aU;
aF=aK.max;}else{if(aE>=aF&&aE>aK.max&&aF<=aK.max){aT=(aK.max-aF)/(aE-aF)*(aT-aU)+aU;aE=aK.max;}}if(aU!=aJ){B.lineTo(aL.p2c(aJ),aK.p2c(aF));
}B.lineTo(aL.p2c(aU),aK.p2c(aF));B.lineTo(aL.p2c(aT),aK.p2c(aE));if(aT!=aN){B.lineTo(aL.p2c(aT),aK.p2c(aE));
B.lineTo(aL.p2c(aN),aK.p2c(aE));}}}B.save();B.translate(H.left,H.top);B.lineJoin="round";var aB=az.lines.lineWidth,aw=az.shadowSize;
if(aB>0&&aw>0){B.lineWidth=aw;B.strokeStyle="rgba(0,0,0,0.1)";var aC=Math.PI/18;ay(az.datapoints,Math.sin(aC)*(aB/2+aw/2),Math.cos(aC)*(aB/2+aw/2),az.xaxis,az.yaxis);
B.lineWidth=aw/2;ay(az.datapoints,Math.sin(aC)*(aB/2+aw/4),Math.cos(aC)*(aB/2+aw/4),az.xaxis,az.yaxis);
}B.lineWidth=aB;B.strokeStyle=az.color;var ax=y(az.lines,az.color,0,aa);if(ax){B.fillStyle=ax;aA(az.datapoints,az.xaxis,az.yaxis);
}if(aB>0){ay(az.datapoints,0,0,az.xaxis,az.yaxis);}B.restore();}function R(az){function aC(aI,aH,aP,aF,aN,aO,aL,aE){var aM=aI.points,aD=aI.pointsize;
for(var aG=0;aG<aM.length;aG+=aD){var aK=aM[aG],aJ=aM[aG+1];if(aK==null||aK<aO.min||aK>aO.max||aJ<aL.min||aJ>aL.max){continue;
}B.beginPath();aK=aO.p2c(aK);aJ=aL.p2c(aJ)+aF;if(aE=="circle"){B.arc(aK,aJ,aH,0,aN?Math.PI:Math.PI*2,false);
}else{aE(B,aK,aJ,aH,aN);}B.closePath();if(aP){B.fillStyle=aP;B.fill();}B.stroke();}}B.save();B.translate(H.left,H.top);
var aB=az.points.lineWidth,ax=az.shadowSize,aw=az.points.radius,aA=az.points.symbol;if(aB>0&&ax>0){var ay=ax/2;
B.lineWidth=ay;B.strokeStyle="rgba(0,0,0,0.1)";aC(az.datapoints,aw,null,ay+ay/2,true,az.xaxis,az.yaxis,aA);
B.strokeStyle="rgba(0,0,0,0.2)";aC(az.datapoints,aw,null,ay/2,true,az.xaxis,az.yaxis,aA);}B.lineWidth=aB;
B.strokeStyle=az.color;aC(az.datapoints,aw,y(az.points,az.color),0,false,az.xaxis,az.yaxis,aA);B.restore();
}function ak(aI,aH,aQ,aD,aL,aA,ay,aG,aF,aP,aM,ax){var az,aO,aE,aK,aB,aw,aJ,aC,aN;if(aM){aC=aw=aJ=true;
aB=false;az=aQ;aO=aI;aK=aH+aD;aE=aH+aL;if(aO<az){aN=aO;aO=az;az=aN;aB=true;aw=false;}}else{aB=aw=aJ=true;
aC=false;az=aI+aD;aO=aI+aL;aE=aQ;aK=aH;if(aK<aE){aN=aK;aK=aE;aE=aN;aC=true;aJ=false;}}if(aO<aG.min||az>aG.max||aK<aF.min||aE>aF.max){return;
}if(az<aG.min){az=aG.min;aB=false;}if(aO>aG.max){aO=aG.max;aw=false;}if(aE<aF.min){aE=aF.min;aC=false;
}if(aK>aF.max){aK=aF.max;aJ=false;}az=aG.p2c(az);aE=aF.p2c(aE);aO=aG.p2c(aO);aK=aF.p2c(aK);if(ay){aP.beginPath();
aP.moveTo(az,aE);aP.lineTo(az,aK);aP.lineTo(aO,aK);aP.lineTo(aO,aE);aP.fillStyle=ay(aE,aK);aP.fill();
}if(ax>0&&(aB||aw||aJ||aC)){aP.beginPath();aP.moveTo(az,aE+aA);if(aB){aP.lineTo(az,aK+aA);}else{aP.moveTo(az,aK+aA);
}if(aJ){aP.lineTo(aO,aK+aA);}else{aP.moveTo(aO,aK+aA);}if(aw){aP.lineTo(aO,aE+aA);}else{aP.moveTo(aO,aE+aA);
}if(aC){aP.lineTo(az,aE+aA);}else{aP.moveTo(az,aE+aA);}aP.stroke();}}function Q(ay){function ax(aE,aD,aG,aB,aF,aI,aH){var aJ=aE.points,aA=aE.pointsize;
for(var aC=0;aC<aJ.length;aC+=aA){if(aJ[aC]==null){continue;}ak(aJ[aC],aJ[aC+1],aJ[aC+2],aD,aG,aB,aF,aI,aH,B,ay.bars.horizontal,ay.bars.lineWidth);
}}B.save();B.translate(H.left,H.top);B.lineWidth=ay.bars.lineWidth;B.strokeStyle=ay.color;var aw=ay.bars.align=="left"?0:-ay.bars.barWidth/2;
var az=ay.bars.fill?function(aA,aB){return y(ay.bars,ay.color,aA,aB);}:null;ax(ay.datapoints,aw,aw+ay.bars.barWidth,0,az,ay.xaxis,ay.yaxis);
B.restore();}function y(ay,aw,ax,aA){var az=ay.fill;if(!az){return null;}if(ay.fillColor){return t(ay.fillColor,ax,aA,aw);
}return"rgba("+new Color(aw)+","+(typeof az=="number"?az:0.4)+")";}function au(){N.getElement(".legend")&&N.getElement(".legend").destroy();
if(!J.legend.show){return;}var aC=[],aA=false,aI=J.legend.labelFormatter,aH,aE;for(var az=0;az<p.length;
++az){aH=p[az];aE=aH.label;if(!aE){continue;}if(az%J.legend.noColumns==0){if(aA){aC.push("</tr>");}aC.push("<tr>");
aA=true;}if(aI){aE=aI(aE,aH);}aC.push('<td class="legendColorBox"><div style="border:1px solid '+J.legend.labelBoxBorderColor+';padding:1px"><div style="width:4px;height:0;border:5px solid '+aH.color+';overflow:hidden"></div></div></td><td class="legendLabel">'+aE+"</td>");
}if(aA){aC.push("</tr>");}if(aC.length==0){return;}var aG='<table style="font-size:smaller;color:'+J.grid.color+'">'+aC.join("")+"</table>";
if(J.legend.container!=null){J.legend.container.set("html",aG);}else{var aD="",ax=J.legend.position,ay=J.legend.margin;
if(ay[0]==null){ay=[ay,ay];}if(ax.charAt(0)=="n"){aD+="top:"+(ay[1]+H.top)+"px;";}else{if(ax.charAt(0)=="s"){aD+="bottom:"+(ay[1]+H.bottom)+"px;";
}}if(ax.charAt(1)=="e"){aD+="right:"+(ay[0]+H.right)+"px;";}else{if(ax.charAt(1)=="w"){aD+="left:"+(ay[0]+H.left)+"px;";
}}var aF=new Element("div.legend",{html:aG.replace('style="','style="position:absolute;'+aD+";")}).inject(N);
if(J.legend.backgroundOpacity!=0){var aB=J.legend.backgroundColor;if(aB==null){aB=J.grid.backgroundColor;
if(aB&&typeof aB=="string"){aB="rgb("+new Color(aB)+")";}else{aB="rgb("+new Color("#ffffff")+")";}aB.a=1;
aB=aB.toString();}var aw=aF.getElement("table");new Element("div",{style:"position:absolute;width:"+aw.getSize().x+"px;height:"+aw.getSize().y+"px;"+aD+"background-color:"+aB+";"}).inject(aF,"top").setStyle("opacity",J.legend.backgroundOpacity);
}}}var af=[],j=null;function ap(aD,aB,ay){var aJ=J.grid.mouseActiveRadius,aV=aJ*aJ+1,aT=null,aM=false,aR,aP;
for(aR=p.length-1;aR>=0;--aR){if(!ay(p[aR])){continue;}var aK=p[aR],aC=aK.xaxis,aA=aK.yaxis,aQ=aK.datapoints.points,aO=aK.datapoints.pointsize,aL=aC.c2p(aD),aI=aA.c2p(aB),ax=aJ/aC.scale,aw=aJ/aA.scale;
if(aK.lines.show||aK.points.show){for(aP=0;aP<aQ.length;aP+=aO){var aF=aQ[aP],aE=aQ[aP+1];if(aF==null){continue;
}if(aF-aL>ax||aF-aL<-ax||aE-aI>aw||aE-aI<-aw){continue;}var aH=Math.abs(aC.p2c(aF)-aD),aG=Math.abs(aA.p2c(aE)-aB),aN=aH*aH+aG*aG;
if(aN<aV){aV=aN;aT=[aR,aP/aO];}}}if(aK.bars.show&&!aT){var az=aK.bars.align=="left"?0:-aK.bars.barWidth/2,aS=az+aK.bars.barWidth;
for(aP=0;aP<aQ.length;aP+=aO){var aF=aQ[aP],aE=aQ[aP+1],aU=aQ[aP+2];if(aF==null){continue;}if(p[aR].bars.horizontal?(aL<=Math.max(aU,aF)&&aL>=Math.min(aU,aF)&&aI>=aE+az&&aI<=aE+aS):(aL>=aF+az&&aL<=aF+aS&&aI>=Math.min(aU,aE)&&aI<=Math.max(aU,aE))){aT=[aR,aP/aO];
}}}}if(aT){aR=aT[0];aP=aT[1];aO=p[aR].datapoints.pointsize;return{datapoint:p[aR].datapoints.points.slice(aP*aO,(aP+1)*aO),dataIndex:aP,series:p[aR],seriesIndex:aR};
}return null;}function d(aw){if(J.grid.hoverable){g("plothover",aw,function(ax){return ax.hoverable!=false;
});}}function G(aw){g("plotclick",aw,function(ax){return ax.clickable!=false;});}function g(ax,aw,ay){var az=am[0].getCoordinates(),aC=aw.page.x-az.left-H.left,aA=aw.page.y-az.top-H.top,aE=V({left:aC,top:aA});
aE.pageX=aw.page.x;aE.pageY=aw.page.y;var aF=ap(aC,aA,ay);if(aF){aF.pageX=parseInt(aF.series.xaxis.p2c(aF.datapoint[0])+az.left+H.left);
aF.pageY=parseInt(aF.series.yaxis.p2c(aF.datapoint[1])+az.top+H.top);}if(J.grid.autoHighlight){for(var aB=0;
aB<af.length;++aB){var aD=af[aB];if(aD.auto==ax&&!(aF&&aD.series==aF.series&&aD.point==aF.datapoint)){ag(aD.series,aD.point);
}}if(aF){an(aF.series,aF.datapoint,ax);}}N.fireEvent(ax,[aw,aE,aF]);}function U(){if(!j){j=setTimeout(ad,30);
}}function ad(){j=null;av.save();av.clearRect(0,0,ah,s);av.translate(H.left,H.top);var ax,aw;for(ax=0;
ax<af.length;++ax){aw=af[ax];if(aw.series.bars.show){ai(aw.series,aw.point);}else{ac(aw.series,aw.point);
}}av.restore();C(m.drawOverlay,[av]);}function an(ay,aw,aA){if(typeof ay=="number"){ay=p[ay];}if(typeof aw=="number"){var az=ay.datapoints.pointsize;
aw=ay.datapoints.points.slice(az*aw,az*(aw+1));}var ax=L(ay,aw);if(ax==-1){af.push({series:ay,point:aw,auto:aA});
U();}else{if(!aA){af[ax].auto=false;}}}function ag(ay,aw){if(ay==null&&aw==null){af=[];U();}if(typeof ay=="number"){ay=p[ay];
}if(typeof aw=="number"){aw=ay.data[aw];}var ax=L(ay,aw);if(ax!=-1){af.splice(ax,1);U();}}function L(ay,az){for(var aw=0;
aw<af.length;++aw){var ax=af[aw];if(ax.series==ay&&ax.point[0]==az[0]&&ax.point[1]==az[1]){return aw;
}}return -1;}function ac(az,ay){var ax=ay[0],aD=ay[1],aC=az.xaxis,aB=az.yaxis;if(ax<aC.min||ax>aC.max||aD<aB.min||aD>aB.max){return;
}var aA=az.points.radius+az.points.lineWidth/2;av.lineWidth=aA;av.strokeStyle="rgba("+new Color(az.color)+",.5)";
var aw=1.5*aA,ax=aC.p2c(ax),aD=aB.p2c(aD);av.beginPath();if(az.points.symbol=="circle"){av.arc(ax,aD,aw,0,2*Math.PI,false);
}else{az.points.symbol(av,ax,aD,aw,false);}av.closePath();av.stroke();}function ai(az,aw){av.lineWidth=az.bars.lineWidth;
var ay=av.strokeStyle="rgba("+new Color(az.color)+",.5)";var ax=az.bars.align=="left"?0:-az.bars.barWidth/2;
ak(aw[0],aw[1],aw[2]||0,ax,ax+az.bars.barWidth,0,function(){return ay;},az.xaxis,az.yaxis,av,az.bars.horizontal,az.bars.lineWidth);
}function t(ay,ax,aC,aA){if(typeof ay=="string"){return ay;}else{var aB=B.createLinearGradient(0,aC,0,ax);
for(var az=0,aw=ay.colors.length;az<aw;++az){var aD=ay.colors[az];if(typeof aD!="string"){aD="rgba("+new Color(aA)+","+aD.opacity||"1)";
}aB.addColorStop(az/(aw-1),aD);}return aB;}}}c.plot=function(g,e,d){var f=new b(g,e,d,c.plot.plugins);
return f;};c.plot.plugins=[];c.plot.formatDate=function(l,f,h){var o=function(d){d=""+d;return d.length==1?"0"+d:d;
};var e=[];var p=false,j=false;var n=l.getUTCHours();var k=n<12;if(h==null){h=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
}if(f.search(/%p|%P/)!=-1){if(n>12){n=n-12;}else{if(n==0){n=12;}}}for(var g=0;g<f.length;++g){var m=f.charAt(g);
if(p){switch(m){case"h":m=""+n;break;case"H":m=o(n);break;case"M":m=o(l.getUTCMinutes());break;case"S":m=o(l.getUTCSeconds());
break;case"d":m=""+l.getUTCDate();break;case"m":m=""+(l.getUTCMonth()+1);break;case"y":m=""+l.getUTCFullYear();
break;case"b":m=""+h[l.getUTCMonth()];break;case"p":m=(k)?("am"):("pm");break;case"P":m=(k)?("AM"):("PM");
break;case"0":m="";j=true;break;}if(m&&j){m=o(m);j=false;}e.push(m);if(!j){p=false;}}else{if(m=="%"){p=true;
}else{e.push(m);}}}return e.join("");};function a(e,d){return d*Math.floor(e/d);}})(flot);(function(a){function b(k){var q={first:{x:-1,y:-1},second:{x:-1,y:-1},show:false,active:false};
var m={};function d(s){if(q.active){k.getPlaceholder().fireEvent("plotselecting",[s,f()]);l(s);}}function o(s){if(s.rightClick){return;
}document.body.focus();if(document.onselectstart!==undefined&&m.onselectstart==null){m.onselectstart=document.onselectstart;
document.onselectstart=function(){return false;};}if(document.ondrag!==undefined&&m.ondrag==null){m.ondrag=document.ondrag;
document.ondrag=function(){return false;};}c(q.first,s);q.active=true;document.addEvent("mouseup",j);
}function j(s){document.removeEvent("mouseup",j);if(document.onselectstart!==undefined){document.onselectstart=m.onselectstart;
}if(document.ondrag!==undefined){document.ondrag=m.ondrag;}q.active=false;l(s);if(e()){h();}else{k.getPlaceholder().fireEvent("plotunselected",[s]);
k.getPlaceholder().fireEvent("plotselecting",[s,null]);}return false;}function f(){if(!e()){return null;
}var t=Math.min(q.first.x,q.second.x),s=Math.max(q.first.x,q.second.x),v=Math.max(q.first.y,q.second.y),u=Math.min(q.first.y,q.second.y);
var w={};var y=k.getAxes();if(y.xaxis.used){w.xaxis={from:y.xaxis.c2p(t),to:y.xaxis.c2p(s)};}if(y.x2axis.used){w.x2axis={from:y.x2axis.c2p(t),to:y.x2axis.c2p(s)};
}if(y.yaxis.used){w.yaxis={from:y.yaxis.c2p(v),to:y.yaxis.c2p(u)};}if(y.y2axis.used){w.y2axis={from:y.y2axis.c2p(v),to:y.y2axis.c2p(u)};
}return w;}function h(){var s=f();k.getPlaceholder().fireEvent("plotselected",[{},s]);var t=k.getAxes();
if(t.xaxis.used&&t.yaxis.used){k.getPlaceholder().fireEvent("selected",[{},{x1:s.xaxis.from,y1:s.yaxis.from,x2:s.xaxis.to,y2:s.yaxis.to}]);
}}function g(t,u,s){return u<t?t:(u>s?s:u);}function c(w,t){var v=k.getOptions();var u=k.getPlaceholder().getCoordinates();
var s=k.getPlotOffset();w.x=g(0,t.page.x-u.left-s.left,k.width());w.y=g(0,t.page.y-u.top-s.top,k.height());
if(v.selection.mode=="y"){w.x=w==q.first?0:k.width();}if(v.selection.mode=="x"){w.y=w==q.first?0:k.height();
}}function l(s){if(s.page.x==null){return;}c(q.second,s);if(e()){q.show=true;k.triggerRedrawOverlay();
}else{r(true);}}function r(s){if(q.show){q.show=false;k.triggerRedrawOverlay();if(!s){k.getPlaceholder().fireEvent("plotunselected",[{}]);
}}}function n(t,s){var v,u,w=k.getAxes();var y=k.getOptions();if(y.selection.mode=="y"){q.first.x=0;q.second.x=k.width();
}else{v=t.xaxis?w.xaxis:(t.x2axis?w.x2axis:w.xaxis);u=t.xaxis||t.x2axis||{from:t.x1,to:t.x2};q.first.x=v.p2c(Math.min(u.from,u.to));
q.second.x=v.p2c(Math.max(u.from,u.to));}if(y.selection.mode=="y"){v=t.yaxis?w.yaxis:(t.y2axis?w.y2axis:w.yaxis);
u=t.yaxis||t.y2axis||{from:t.y1,to:t.y2};q.first.y=v.p2c(Math.min(u.from,u.to));q.second.y=v.p2c(Math.max(u.from,u.to));
}else{q.first.y=0;q.second.y=k.height();}return q;}function p(t,s){var v,u,w=k.getAxes();var y=k.getOptions();
if(y.selection.mode=="y"){q.first.x=0;q.second.x=k.width();}else{v=t.xaxis?w.xaxis:(t.x2axis?w.x2axis:w.xaxis);
u=t.xaxis||t.x2axis||{from:t.x1,to:t.x2};q.first.x=v.p2c(Math.min(u.from,u.to));q.second.x=v.p2c(Math.max(u.from,u.to));
}if(y.selection.mode=="y"){v=t.yaxis?w.yaxis:(t.y2axis?w.y2axis:w.yaxis);u=t.yaxis||t.y2axis||{from:t.y1,to:t.y2};
q.first.y=v.p2c(Math.min(u.from,u.to));q.second.y=v.p2c(Math.max(u.from,u.to));}else{q.first.y=0;q.second.y=k.height();
}q.show=true;k.triggerRedrawOverlay();if(!s){h();}}function e(){var s=5;return Math.abs(q.second.x-q.first.x)>=s&&Math.abs(q.second.y-q.first.y)>=s;
}k.clearSelection=r;k.setSelection=p;k.getSelection=f;k.getSelectionCoords=n;k.hooks.bindEvents.push(function(t,s){var u=t.getOptions();
if(u.selection.mode!=null){s.addEvent("mousemove",d);}if(u.selection.mode!=null){s.addEvent("mousedown",o);
}});k.hooks.drawOverlay.push(function(v,D){if(q.show&&e()){var t=v.getPlotOffset();var s=v.getOptions();
D.save();D.translate(t.left,t.top);var z="rgba("+new Color(s.selection.color).setSaturation("95");D.strokeStyle=z+",1)";
D.lineWidth=1;D.lineJoin="round";D.fillStyle=z+",.2)";var B=Math.min(q.first.x,q.second.x),A=Math.min(q.first.y,q.second.y),C=Math.abs(q.second.x-q.first.x),u=Math.abs(q.second.y-q.first.y);
D.fillRect(B,A,C,u);D.strokeRect(B,A,C,u);D.restore();}});}a.plot.plugins.push({init:b,options:{selection:{mode:null,color:"#e8cfac"}},name:"selection",version:"1.0"});
})(flot);