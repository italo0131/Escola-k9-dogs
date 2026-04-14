module.exports=[32698,a=>{"use strict";let b=(...a)=>a.filter((a,b,c)=>!!a&&""!==a.trim()&&c.indexOf(a)===b).join(" ").trim();a.s(["mergeClasses",()=>b])},29348,62934,a=>{"use strict";var b={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};a.s(["default",()=>b],29348);let c=a=>{for(let b in a)if(b.startsWith("aria-")||"role"===b||"title"===b)return!0;return!1};a.s(["hasA11yProp",()=>c],62934)},63359,a=>{"use strict";var b=a.i(64076),c=a.i(29348),d=a.i(62934),e=a.i(32698);let f=(0,b.createContext)({}),g=(0,b.forwardRef)(({color:a,size:g,strokeWidth:h,absoluteStrokeWidth:i,className:j="",children:k,iconNode:l,...m},n)=>{let{size:o=24,strokeWidth:p=2,absoluteStrokeWidth:q=!1,color:r="currentColor",className:s=""}=(0,b.useContext)(f)??{},t=i??q?24*Number(h??p)/Number(g??o):h??p;return(0,b.createElement)("svg",{ref:n,...c.default,width:g??o??c.default.width,height:g??o??c.default.height,stroke:a??r,strokeWidth:t,className:(0,e.mergeClasses)("lucide",s,j),...!k&&!(0,d.hasA11yProp)(m)&&{"aria-hidden":"true"},...m},[...l.map(([a,c])=>(0,b.createElement)(a,c)),...Array.isArray(k)?k:[k]])});a.s(["default",()=>g],63359)},98801,a=>{"use strict";var b=a.i(64076),c=a.i(32698);let d=a=>{let b=a.replace(/^([A-Z])|[\s-_]+(\w)/g,(a,b,c)=>c?c.toUpperCase():b.toLowerCase());return b.charAt(0).toUpperCase()+b.slice(1)};var e=a.i(63359);let f=(a,f)=>{let g=(0,b.forwardRef)(({className:g,...h},i)=>(0,b.createElement)(e.default,{ref:i,iconNode:f,className:(0,c.mergeClasses)(`lucide-${d(a).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${a}`,g),...h}));return g.displayName=d(a),g};a.s(["default",()=>f],98801)},59654,a=>{"use strict";let b=(0,a.i(98801).default)("x",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);a.s(["X",()=>b],59654)},33499,a=>{"use strict";let b,c;var d,e=a.i(90711),f=a.i(64076),g=a.i(98801);let h=(0,g.default)("circle-check",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]),i=(0,g.default)("circle-alert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]),j=(0,g.default)("info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);var k=a.i(59654);let l={data:""},m=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,o=/\n+/g,p=(a,b)=>{let c="",d="",e="";for(let f in a){let g=a[f];"@"==f[0]?"i"==f[1]?c=f+" "+g+";":d+="f"==f[1]?p(g,f):f+"{"+p(g,"k"==f[1]?"":b)+"}":"object"==typeof g?d+=p(g,b?b.replace(/([^,])+/g,a=>f.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,b=>/&/.test(b)?b.replace(/&/g,a):a?a+" "+b:b)):f):null!=g&&(f=/^--/.test(f)?f:f.replace(/[A-Z]/g,"-$&").toLowerCase(),e+=p.p?p.p(f,g):f+":"+g+";")}return c+(b&&e?b+"{"+e+"}":e)+d},q={},r=a=>{if("object"==typeof a){let b="";for(let c in a)b+=c+r(a[c]);return b}return a};function s(a){let b,c,d=this||{},e=a.call?a(d.p):a;return((a,b,c,d,e)=>{var f;let g=r(a),h=q[g]||(q[g]=(a=>{let b=0,c=11;for(;b<a.length;)c=101*c+a.charCodeAt(b++)>>>0;return"go"+c})(g));if(!q[h]){let b=g!==a?a:(a=>{let b,c,d=[{}];for(;b=m.exec(a.replace(n,""));)b[4]?d.shift():b[3]?(c=b[3].replace(o," ").trim(),d.unshift(d[0][c]=d[0][c]||{})):d[0][b[1]]=b[2].replace(o," ").trim();return d[0]})(a);q[h]=p(e?{["@keyframes "+h]:b}:b,c?"":"."+h)}let i=c&&q.g?q.g:null;return c&&(q.g=q[h]),f=q[h],i?b.data=b.data.replace(i,f):-1===b.data.indexOf(f)&&(b.data=d?f+b.data:b.data+f),h})(e.unshift?e.raw?(b=[].slice.call(arguments,1),c=d.p,e.reduce((a,d,e)=>{let f=b[e];if(f&&f.call){let a=f(c),b=a&&a.props&&a.props.className||/^go/.test(a)&&a;f=b?"."+b:a&&"object"==typeof a?a.props?"":p(a,""):!1===a?"":a}return a+d+(null==f?"":f)},"")):e.reduce((a,b)=>Object.assign(a,b&&b.call?b(d.p):b),{}):e,d.target||l,d.g,d.o,d.k)}s.bind({g:1});let t,u,v,w=s.bind({k:1});function x(a,b){let c=this||{};return function(){let d=arguments;function e(f,g){let h=Object.assign({},f),i=h.className||e.className;c.p=Object.assign({theme:u&&u()},h),c.o=/ *go\d+/.test(i),h.className=s.apply(c,d)+(i?" "+i:""),b&&(h.ref=g);let j=a;return a[0]&&(j=h.as||a,delete h.as),v&&j[0]&&v(h),t(j,h)}return b?b(e):e}}var y=(a,b)=>"function"==typeof a?a(b):a,z=(b=0,()=>(++b).toString()),A="default",B=(a,b)=>{let{toastLimit:c}=a.settings;switch(b.type){case 0:return{...a,toasts:[b.toast,...a.toasts].slice(0,c)};case 1:return{...a,toasts:a.toasts.map(a=>a.id===b.toast.id?{...a,...b.toast}:a)};case 2:let{toast:d}=b;return B(a,{type:+!!a.toasts.find(a=>a.id===d.id),toast:d});case 3:let{toastId:e}=b;return{...a,toasts:a.toasts.map(a=>a.id===e||void 0===e?{...a,dismissed:!0,visible:!1}:a)};case 4:return void 0===b.toastId?{...a,toasts:[]}:{...a,toasts:a.toasts.filter(a=>a.id!==b.toastId)};case 5:return{...a,pausedAt:b.time};case 6:let f=b.time-(a.pausedAt||0);return{...a,pausedAt:void 0,toasts:a.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+f}))}}},C=[],D={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},E={},F=(a,b=A)=>{E[b]=B(E[b]||D,a),C.forEach(([a,c])=>{a===b&&c(E[b])})},G=a=>Object.keys(E).forEach(b=>F(a,b)),H=(a=A)=>b=>{F(b,a)},I={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},J=a=>(b,c)=>{let d,e=((a,b="blank",c)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:b,ariaProps:{role:"status","aria-live":"polite"},message:a,pauseDuration:0,...c,id:(null==c?void 0:c.id)||z()}))(b,a,c);return H(e.toasterId||(d=e.id,Object.keys(E).find(a=>E[a].toasts.some(a=>a.id===d))))({type:2,toast:e}),e.id},K=(a,b)=>J("blank")(a,b);K.error=J("error"),K.success=J("success"),K.loading=J("loading"),K.custom=J("custom"),K.dismiss=(a,b)=>{let c={type:3,toastId:a};b?H(b)(c):G(c)},K.dismissAll=a=>K.dismiss(void 0,a),K.remove=(a,b)=>{let c={type:4,toastId:a};b?H(b)(c):G(c)},K.removeAll=a=>K.remove(void 0,a),K.promise=(a,b,c)=>{let d=K.loading(b.loading,{...c,...null==c?void 0:c.loading});return"function"==typeof a&&(a=a()),a.then(a=>{let e=b.success?y(b.success,a):void 0;return e?K.success(e,{id:d,...c,...null==c?void 0:c.success}):K.dismiss(d),a}).catch(a=>{let e=b.error?y(b.error,a):void 0;e?K.error(e,{id:d,...c,...null==c?void 0:c.error}):K.dismiss(d)}),a};var L=1e3,M=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,N=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,O=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,P=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${M} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${N} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${a=>a.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${O} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Q=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,R=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${a=>a.secondary||"#e0e0e0"};
  border-right-color: ${a=>a.primary||"#616161"};
  animation: ${Q} 1s linear infinite;
`,S=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,T=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,U=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${a=>a.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${S} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${T} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${a=>a.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,V=x("div")`
  position: absolute;
`,W=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,X=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Y=x("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${X} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Z=({toast:a})=>{let{icon:b,type:c,iconTheme:d}=a;return void 0!==b?"string"==typeof b?f.createElement(Y,null,b):b:"blank"===c?null:f.createElement(W,null,f.createElement(R,{...d}),"loading"!==c&&f.createElement(V,null,"error"===c?f.createElement(P,{...d}):f.createElement(U,{...d})))},$=x("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,_=x("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,aa=f.memo(({toast:a,position:b,style:d,children:e})=>{let g=a.height?((a,b)=>{let d=a.includes("top")?1:-1,[e,f]=c?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*d}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*d}%,-1px) scale(.6); opacity:0;}
`];return{animation:b?`${w(e)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(f)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(a.position||b||"top-center",a.visible):{opacity:0},h=f.createElement(Z,{toast:a}),i=f.createElement(_,{...a.ariaProps},y(a.message,a));return f.createElement($,{className:a.className,style:{...g,...d,...a.style}},"function"==typeof e?e({icon:h,message:i}):f.createElement(f.Fragment,null,h,i))});d=f.createElement,p.p=void 0,t=d,u=void 0,v=void 0;var ab=({id:a,className:b,style:c,onHeightUpdate:d,children:e})=>{let g=f.useCallback(b=>{if(b){let c=()=>{d(a,b.getBoundingClientRect().height)};c(),new MutationObserver(c).observe(b,{subtree:!0,childList:!0,characterData:!0})}},[a,d]);return f.createElement("div",{ref:g,className:b,style:c},e)},ac=s`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,ad=({reverseOrder:a,position:b="top-center",toastOptions:d,gutter:e,children:g,toasterId:h,containerStyle:i,containerClassName:j})=>{let{toasts:k,handlers:l}=((a,b="default")=>{let{toasts:c,pausedAt:d}=((a={},b=A)=>{let[c,d]=(0,f.useState)(E[b]||D),e=(0,f.useRef)(E[b]);(0,f.useEffect)(()=>(e.current!==E[b]&&d(E[b]),C.push([b,d]),()=>{let a=C.findIndex(([a])=>a===b);a>-1&&C.splice(a,1)}),[b]);let g=c.toasts.map(b=>{var c,d,e;return{...a,...a[b.type],...b,removeDelay:b.removeDelay||(null==(c=a[b.type])?void 0:c.removeDelay)||(null==a?void 0:a.removeDelay),duration:b.duration||(null==(d=a[b.type])?void 0:d.duration)||(null==a?void 0:a.duration)||I[b.type],style:{...a.style,...null==(e=a[b.type])?void 0:e.style,...b.style}}});return{...c,toasts:g}})(a,b),e=(0,f.useRef)(new Map).current,g=(0,f.useCallback)((a,b=L)=>{if(e.has(a))return;let c=setTimeout(()=>{e.delete(a),h({type:4,toastId:a})},b);e.set(a,c)},[]);(0,f.useEffect)(()=>{if(d)return;let a=Date.now(),e=c.map(c=>{if(c.duration===1/0)return;let d=(c.duration||0)+c.pauseDuration-(a-c.createdAt);if(d<0){c.visible&&K.dismiss(c.id);return}return setTimeout(()=>K.dismiss(c.id,b),d)});return()=>{e.forEach(a=>a&&clearTimeout(a))}},[c,d,b]);let h=(0,f.useCallback)(H(b),[b]),i=(0,f.useCallback)(()=>{h({type:5,time:Date.now()})},[h]),j=(0,f.useCallback)((a,b)=>{h({type:1,toast:{id:a,height:b}})},[h]),k=(0,f.useCallback)(()=>{d&&h({type:6,time:Date.now()})},[d,h]),l=(0,f.useCallback)((a,b)=>{let{reverseOrder:d=!1,gutter:e=8,defaultPosition:f}=b||{},g=c.filter(b=>(b.position||f)===(a.position||f)&&b.height),h=g.findIndex(b=>b.id===a.id),i=g.filter((a,b)=>b<h&&a.visible).length;return g.filter(a=>a.visible).slice(...d?[i+1]:[0,i]).reduce((a,b)=>a+(b.height||0)+e,0)},[c]);return(0,f.useEffect)(()=>{c.forEach(a=>{if(a.dismissed)g(a.id,a.removeDelay);else{let b=e.get(a.id);b&&(clearTimeout(b),e.delete(a.id))}})},[c,g]),{toasts:c,handlers:{updateHeight:j,startPause:i,endPause:k,calculateOffset:l}}})(d,h);return f.createElement("div",{"data-rht-toaster":h||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...i},className:j,onMouseEnter:l.startPause,onMouseLeave:l.endPause},k.map(d=>{let h,i,j=d.position||b,k=l.calculateOffset(d,{reverseOrder:a,gutter:e,defaultPosition:b}),m=(h=j.includes("top"),i=j.includes("center")?{justifyContent:"center"}:j.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:c?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${k*(h?1:-1)}px)`,...h?{top:0}:{bottom:0},...i});return f.createElement(ab,{id:d.id,key:d.id,onHeightUpdate:l.updateHeight,className:d.visible?ac:"",style:m},"custom"===d.type?y(d.message,d):g?g(d):f.createElement(aa,{toast:d,position:j}))}))};let ae=(0,f.createContext)(null),af={info:{icon:j,className:"border-cyan-300/30 bg-slate-950/95 text-cyan-50"},success:{icon:h,className:"border-emerald-300/30 bg-slate-950/95 text-emerald-50"},error:{icon:i,className:"border-rose-300/30 bg-slate-950/95 text-rose-50"}};function ag({children:a}){return(0,e.jsxs)(ae.Provider,{value:{pushToast:function({title:a,description:b,variant:c="info"}){let d=af[c],f=d.icon;K.custom(c=>(0,e.jsx)("div",{role:"status",className:`pointer-events-auto w-full max-w-md rounded-[22px] border px-4 py-3 shadow-2xl shadow-black/35 backdrop-blur transition-all duration-200 ${c.visible?"translate-y-0 opacity-100":"-translate-y-2 opacity-0"} ${d.className}`,children:(0,e.jsxs)("div",{className:"flex items-start gap-3",children:[(0,e.jsx)("span",{className:"mt-0.5 rounded-full border border-white/10 bg-white/10 p-2",children:(0,e.jsx)(f,{className:"h-4 w-4","aria-hidden":"true"})}),(0,e.jsxs)("div",{className:"min-w-0 flex-1",children:[(0,e.jsx)("p",{className:"text-sm font-semibold text-white",children:a}),b?(0,e.jsx)("p",{className:"mt-1 text-sm leading-6 opacity-90",children:b}):null]}),(0,e.jsx)("button",{type:"button",onClick:()=>K.dismiss(c.id),className:"interactive-button min-h-[44px] min-w-[44px] rounded-full border border-white/10 bg-white/10 p-2 text-white/80 transition-all duration-200 hover:bg-white/15","aria-label":"Fechar aviso",children:(0,e.jsx)(k.X,{className:"h-4 w-4","aria-hidden":"true"})})]})}),{duration:"error"===c?6500:4500})}},children:[a,(0,e.jsx)(ad,{position:"top-center",gutter:12,containerStyle:{top:16,left:16,right:16},toastOptions:{className:"!bg-transparent !shadow-none !p-0",ariaProps:{role:"status","aria-live":"polite"}}})]})}function ah(){let a=(0,f.useContext)(ae);if(!a)throw Error("useAppToast must be used within AppToastProvider");return a}a.s(["AppToastProvider",()=>ag,"useAppToast",()=>ah],33499)}];

//# sourceMappingURL=Documentos_k9-training-platform_1f7a5ef3._.js.map