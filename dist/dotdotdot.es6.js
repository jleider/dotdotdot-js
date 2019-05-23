/*!
 *  dotdotdot JS 4.0.9
 *
 *  dotdotdot.frebsite.nl
 *
 *  Copyright (c) Fred Heusschen
 *  www.frebsite.nl
 *
 *  License: CC-BY-NC-4.0
 *  http://creativecommons.org/licenses/by-nc/4.0/
 *
 *  Contributors: Justin Leider <github@justinleider.com>
 */
export default class Dotdotdot{constructor(t,e=Dotdotdot.options){this.container=t,this.options=e||{},this.watchTimeout=void 0,this.watchInterval=void 0,this.resizeEvent=void 0,this.options=Object.assign(Dotdotdot.options,this.options);const i=this.container.dotdotdot;i&&i.destroy(),this.API={truncate:this.truncate,restore:this.restore,destroy:this.destroy,watch:this.watch,unwatch:this.unwatch},this.container.dotdotdot=this.API,this.originalStyle=this.container.getAttribute("style")||"",this.originalContent=this._getOriginalContent(),this.ellipsis=this.options.ellipsis?document.createTextNode(this.options.ellipsis):document.createTextNode("");const o=window.getComputedStyle(this.container);"break-word"!==o.wordWrap&&(this.container.style.wordWrap="break-word"),"pre"===o.whiteSpace?this.container.style.whiteSpace="pre-wrap":"nowrap"===o.whiteSpace&&(this.container.style.whiteSpace="normal"),this.options.height=null===this.options.height?this._getMaxHeight():this.options.height,this.maxHeight=this._getMaxHeight(),this.truncate(),this.options.watch&&this.watch()}restore(){this.unwatch(),this.container.setAttribute("style",this.originalStyle),this.container.classList.remove("ddd-truncated"),this.container.innerHTML="",this.originalContent.forEach(t=>{this.container.append(t)})}destroy(){this.restore(),this.container.dotdotdot=void 0}watch(){this.unwatch();let t={width:null,height:null};const e=(e,i,o)=>{if(this.container.offsetWidth||this.container.offsetHeight||this.container.getClientRects().length){const n={width:e[i],height:e[o]};return t.width==n.width&&t.height==n.height||this.truncate(),n}return t};"window"==this.options.watch?(this.resizeEvent=i=>{this.watchTimeout&&clearTimeout(this.watchTimeout),this.watchTimeout=setTimeout(()=>{t=e(window,"innerWidth","innerHeight")},100)},window.addEventListener("resize",this.resizeEvent)):this.watchInterval=setInterval(()=>{t=e(this.container,"clientWidth","clientHeight")},1e3)}unwatch(){this.resizeEvent&&(window.removeEventListener("resize",this.resizeEvent),this.resizeEvent=void 0),this.watchInterval&&clearInterval(this.watchInterval),this.watchTimeout&&clearTimeout(this.watchTimeout)}truncate(){let t=!1;return this.container.innerHTML="",this.originalContent.forEach(t=>{this.container.append(t.cloneNode(!0))}),this.maxHeight=this._getMaxHeight(),this._fits()||(t=!0,this._truncateToNode(this.container)),this.container.classList[t?"add":"remove"]("ddd-truncated"),void 0!==this.options.callback&&this.options.callback.call(this.container,t),t}_truncateToNode(t){const e=[],i=[];if(Dotdotdot.$.contents(t).forEach(t=>{if(!Dotdotdot.isElement(t)||!t.matches(".ddd-keep")){let o=document.createComment("");t.replaceWith(o),i.push(t),e.push(o)}}),i.length){for(var o=0;o<i.length;o++){e[o].replaceWith(i[o]);let t=this.ellipsis.cloneNode(!0),n=i[o];Dotdotdot.isElement(n)?n.append(t):Dotdotdot.isText(n)&&n.after(t);let s=this._fits();if(t.parentElement&&t.parentElement.removeChild(t),!s){if("node"==this.options.truncate&&o>1)return void i[o-2].remove();break}}for(var n=o;n<e.length;n++)e[n].remove();var s=i[Math.max(0,Math.min(o,i.length-1))];if(Dotdotdot.isElement(s)){let t=document.createElement(s.nodeName);t.append(this.ellipsis),s.replaceWith(t),this._fits()?t.replaceWith(s):(t.remove(),s=i[Math.max(0,o-1)])}Dotdotdot.isElement(s)?this._truncateToNode(s):this._truncateToWord(s)}}_truncateToWord(t){const e=t.textContent,i=e?-1!==e.indexOf(" ")?" ":"　":" ",o=e?e.split(i):[];for(var n=o.length;n>=0;n--)if(t.textContent=this._addEllipsis(o.slice(0,n).join(i)),this._fits()){"letter"==this.options.truncate&&(t.textContent=o.slice(0,n+1).join(i),this._truncateToLetter(t));break}}_truncateToLetter(t){const e=t.textContent?t.textContent.split(""):[];let i="";for(let o=e.length;o>=0&&(!(i=e.slice(0,o).join("")).length||(t.textContent=this._addEllipsis(i),!this._fits()));o--);}_fits(){return this.container.scrollHeight<=this.maxHeight+(this.options.tolerance||0)}_addEllipsis(t){const e=[" ","　",",",";",".","!","?"];for(;e.indexOf(t.slice(-1))>-1;)t=t.slice(0,-1);return t+=this.ellipsis.textContent}_getOriginalContent(){let t="script, style";this.options.keep&&(t+=", "+this.options.keep),Dotdotdot.$.find(t,this.container).forEach(t=>{t.classList.add("ddd-keep")}),[this.container,...Dotdotdot.$.find("*",this.container)].forEach(t=>{t.normalize(),Dotdotdot.$.contents(t).forEach(e=>{let i=!1;if(Dotdotdot.isText(e)){if(""==(e.textContent||"").trim()){let t=e.previousSibling,o=e.nextSibling;(e.parentElement&&e.parentElement.matches("table, thead, tbody, tfoot, tr, dl, ul, ol, video")||!t||t.matches("div, p, table, td, td, dt, dd, li")||!o||o.matches("div, p, table, td, td, dt, dd, li"))&&(i=!0)}}else Dotdotdot.isComment(e)&&(i=!0);i&&t.removeChild(e)})});let e=[];return Dotdotdot.$.contents(this.container).forEach(t=>{e.push(t.cloneNode(!0))}),e}_getMaxHeight(){if("number"==typeof this.options.height)return this.options.height;const t=window.getComputedStyle(this.container);for(var e=["maxHeight","height"],i=0,o=0;o<e.length;o++){let n=t[e[o]];if("px"==n.slice(-2)){i=parseFloat(n);break}}switch(e=[],t.boxSizing){case"border-box":e.push("borderTopWidth"),e.push("borderBottomWidth");case"padding-box":e.push("paddingTop"),e.push("paddingBottom")}for(o=0;o<e.length;o++){let n=t[e[o]];"px"==n.slice(-2)&&(i-=parseFloat(n))}return Math.max(i,0)}static isElement(t){return 1===t.nodeType}static isText(t){return 3===t.nodeType}static isComment(t){return 8===t.nodeType}}Dotdotdot.version="4.0.9",Dotdotdot.options={ellipsis:"… ",callback:()=>{},truncate:"word",tolerance:0,keep:void 0,watch:"window",height:void 0},Dotdotdot.$={find:(t,e)=>(e=e||document,Array.prototype.slice.call(e.querySelectorAll(t))),contents:t=>(t=t||document,[].slice.call(t.childNodes))};