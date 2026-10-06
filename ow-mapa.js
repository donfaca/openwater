/* <ow-mapa theme="summer|eclipse"> — mapa de Argentina con las localidades de los inscriptos.
   Lee la planilla publicada (CSV) del evento. Sin dependencias. Copia idéntica en sitio-openwater/. */
(function(){
var CSV={
  summer:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT507x3wpH4DTq6hUT-PkeI9P-dIe8aZXYMh0qVvM-f6SVKzeRbWpZRAGriHov5GozZLHNvZ_DA2fXp/pub?output=csv',
  eclipse:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6PpFGvP5HHCktrrDjaYKx8AxydwYwHjrume788p1RP0ptp5PgH6OZd0EmXoR6jnJo3e_ZITA-cBtr/pub?output=csv'
};
var THEME={
  summer:{land:'#0e3a52',stroke:'#2a7fa8',dot:'#f2b632',halo:'rgba(242,182,50,.28)',line:'rgba(242,182,50,.45)',text:'#e8f4fa',muted:'#9fc0d2',chip:'#0b2c40',chipb:'#1d6d93',font:"'Barlow Condensed',sans-serif"},
  eclipse:{land:'#2a1210',stroke:'#9a3a28',dot:'#F4A11B',halo:'rgba(244,161,27,.28)',line:'rgba(244,161,27,.45)',text:'#FFF8F5',muted:'#c9a99a',chip:'#1A0B08',chipb:'#5a2418',font:"'Archivo Narrow',sans-serif"}
};
/* contorno aproximado [lon,lat] */
var AR=[[-67.2,-22.8],[-66.7,-22.35],[-66.2,-22.1],[-65.5,-22.1],[-64.9,-22.1],[-64.6,-22.2],[-64.4,-22.8],[-64,-22.05],[-63,-22],[-62.5,-22.25],[-61.5,-23.2],[-60.6,-23.9],[-59.6,-24.2],[-58.7,-24.9],[-57.7,-25.3],[-57.9,-25.9],[-58.2,-26.7],[-58.65,-27.25],[-57.6,-27.35],[-56.6,-27.35],[-55.9,-27.35],[-55.4,-27],[-54.9,-26.65],[-54.65,-26.1],[-54.58,-25.6],[-54.2,-25.65],[-53.8,-26],[-53.65,-26.25],[-53.85,-27.1],[-54.5,-27.45],[-55.2,-27.85],[-55.8,-28.25],[-56.5,-29.1],[-57.1,-30],[-57.7,-30.3],[-58,-31.2],[-58.2,-32.2],[-58.2,-33],[-58.4,-33.9],[-58.4,-34.3],[-58.2,-34.6],[-57.7,-34.9],[-57.3,-35.3],[-57.1,-35.9],[-56.7,-36.35],[-56.75,-37.1],[-57.4,-37.8],[-57.55,-38.1],[-57.95,-38.4],[-58.7,-38.55],[-59.6,-38.7],[-60.4,-38.9],[-61.3,-39.1],[-62,-38.95],[-62.35,-38.85],[-62.1,-39.3],[-62.3,-39.9],[-62.2,-40.4],[-62.4,-40.9],[-62.85,-41],[-63.6,-41.15],[-64.4,-40.95],[-65.05,-40.85],[-65.1,-41.3],[-65.05,-41.9],[-64.3,-42.25],[-63.75,-42.05],[-63.6,-42.65],[-64.3,-42.5],[-65,-42.75],[-64.85,-43.25],[-65.3,-43.5],[-65.25,-44],[-65.5,-44.6],[-65.5,-44.95],[-66.5,-45.15],[-67.3,-45.7],[-67.5,-46.1],[-67.5,-46.5],[-67,-46.75],[-66.2,-47],[-65.75,-47.2],[-65.9,-47.75],[-66.8,-48.1],[-67.6,-48.9],[-67.7,-49.3],[-68.5,-50.1],[-68.9,-50.9],[-68.4,-51.6],[-68.35,-52.35],[-69.2,-52.1],[-71.9,-52],[-72.4,-51.3],[-72.3,-50.5],[-72.9,-49.6],[-72.6,-49],[-72.2,-47.5],[-71.6,-45.5],[-71.8,-44],[-71.7,-42],[-71.9,-40.5],[-71.2,-39],[-70.9,-37.5],[-70.4,-36],[-70.2,-35],[-69.9,-34],[-70,-32.6],[-69.9,-30],[-69,-29.2],[-68.5,-28.5],[-68.4,-26.9],[-68.4,-26],[-68.5,-25],[-68.3,-24.5],[-67.6,-23.5]];
var TDF=[[-68.6,-52.65],[-68.35,-53],[-67.9,-53.45],[-67.5,-53.85],[-66.5,-54.25],[-65.3,-54.65],[-65.3,-54.85],[-66.4,-54.95],[-67.5,-54.9],[-68.6,-54.9]];
var MAL1=[[-57.7,-51.7],[-58.15,-51.5],[-58.95,-51.25],[-59.1,-51.6],[-58.95,-52.05],[-58.4,-52.2],[-58.1,-51.95],[-57.85,-51.85]];
var MAL2=[[-59.3,-51.3],[-60,-51.25],[-60.8,-51.5],[-61.2,-51.85],[-60.6,-52.2],[-60,-52],[-59.4,-51.95],[-59.35,-51.6]];
var EST=[[-64.7,-54.75],[-64,-54.7],[-63,-54.75],[-62,-54.65],[-63,-54.95],[-64.2,-54.9]];
/* gazetero: nombre normalizado -> [lat, lon] */
var G={
'buenos aires':[-34.6,-58.45],'caba':[-34.6,-58.45],'capital federal':[-34.6,-58.45],'ciudad autonoma de buenos aires':[-34.6,-58.45],'ciudad de buenos aires':[-34.6,-58.45],
'carmen de patagones':[-40.8,-62.98],'patagones':[-40.8,-62.98],'viedma':[-40.81,-62.99],'san antonio oeste':[-40.73,-64.95],'las grutas':[-40.81,-65.08],'sierra grande':[-41.6,-65.36],
'general roca':[-39.03,-67.58],'cipolletti':[-38.93,-67.99],'neuquen':[-38.95,-68.06],'plottier':[-38.96,-68.23],'centenario':[-38.83,-68.13],'allen':[-38.98,-67.83],'cinco saltos':[-38.82,-68.07],'catriel':[-37.88,-67.8],
'bariloche':[-41.13,-71.31],'san carlos de bariloche':[-41.13,-71.31],'villa la angostura':[-40.76,-71.65],'san martin de los andes':[-40.16,-71.35],'junin de los andes':[-39.95,-71.07],'zapala':[-38.9,-70.06],'cutral co':[-38.94,-69.23],'plaza huincul':[-38.93,-69.21],
'choele choel':[-39.29,-65.66],'villa regina':[-39.1,-67.07],'cervantes':[-39.04,-67.38],'el bolson':[-41.96,-71.53],'ingeniero jacobacci':[-41.33,-69.55],'general conesa':[-40.1,-64.46],'guardia mitre':[-40.6,-63.43],'rio colorado':[-39.02,-64.09],'pedro luro':[-39.5,-62.68],'mayor buratovich':[-39.26,-62.62],
'bahia blanca':[-38.72,-62.27],'punta alta':[-38.88,-62.07],'monte hermoso':[-38.98,-61.29],'coronel pringles':[-37.99,-61.36],'coronel suarez':[-37.46,-61.93],'tres arroyos':[-38.38,-60.28],'necochea':[-38.55,-58.74],'mar del plata':[-38,-57.55],'miramar':[-38.27,-57.84],'villa gesell':[-37.26,-56.97],'pinamar':[-37.11,-56.86],'tandil':[-37.32,-59.13],'azul':[-36.78,-59.86],'olavarria':[-36.89,-60.32],
'la plata':[-34.92,-57.95],'quilmes':[-34.72,-58.26],'lomas de zamora':[-34.76,-58.4],'lanus':[-34.7,-58.39],'avellaneda':[-34.66,-58.37],'san isidro':[-34.47,-58.51],'tigre':[-34.43,-58.58],'vicente lopez':[-34.53,-58.48],'moron':[-34.65,-58.62],'san miguel':[-34.54,-58.71],'pilar':[-34.46,-58.91],'san justo':[-34.68,-58.56],'la matanza':[-34.68,-58.56],'ramos mejia':[-34.64,-58.56],'banfield':[-34.74,-58.4],'adrogue':[-34.8,-58.39],'berazategui':[-34.77,-58.21],'florencio varela':[-34.82,-58.28],'ezeiza':[-34.85,-58.52],'merlo':[-34.67,-58.73],'moreno':[-34.65,-58.79],'jose c paz':[-34.51,-58.77],'escobar':[-34.35,-58.79],
'zarate':[-34.1,-59.03],'campana':[-34.16,-58.96],'junin':[-34.59,-60.95],'pergamino':[-33.89,-60.57],'chivilcoy':[-34.9,-60.02],'lujan':[-34.57,-59.11],'bragado':[-35.12,-60.49],'mercedes':[-34.65,-59.43],'9 de julio':[-35.44,-60.88],'nueve de julio':[-35.44,-60.88],'san nicolas':[-33.33,-60.21],'trenque lauquen':[-35.97,-62.73],'pehuajo':[-35.84,-61.9],
'santa rosa':[-36.62,-64.29],'general pico':[-35.66,-63.76],'cordoba':[-31.42,-64.18],'villa carlos paz':[-31.42,-64.5],'rio cuarto':[-33.12,-64.35],'villa maria':[-32.41,-63.24],'san francisco':[-31.43,-62.08],'rosario':[-32.95,-60.64],'santa fe':[-31.63,-60.7],'rafaela':[-31.25,-61.49],'parana':[-31.73,-60.53],'concordia':[-31.39,-58.02],'gualeguaychu':[-33.01,-58.52],
'mendoza':[-32.89,-68.84],'san rafael':[-34.62,-68.33],'san juan':[-31.54,-68.54],'san luis':[-33.3,-66.34],'villa mercedes':[-33.68,-65.46],'la rioja':[-29.41,-66.86],'catamarca':[-28.47,-65.78],'tucuman':[-26.82,-65.22],'san miguel de tucuman':[-26.82,-65.22],'salta':[-24.79,-65.41],'jujuy':[-24.19,-65.3],'san salvador de jujuy':[-24.19,-65.3],'santiago del estero':[-27.78,-64.26],
'resistencia':[-27.45,-58.99],'corrientes':[-27.47,-58.83],'formosa':[-26.18,-58.17],'posadas':[-27.37,-55.9],'puerto iguazu':[-25.6,-54.57],'obera':[-27.49,-55.12],
'comodoro rivadavia':[-45.86,-67.48],'trelew':[-43.25,-65.31],'rawson':[-43.3,-65.1],'puerto madryn':[-42.77,-65.04],'esquel':[-42.91,-71.32],'rio gallegos':[-51.62,-69.22],'el calafate':[-50.34,-72.26],'ushuaia':[-54.8,-68.3],'rio grande':[-53.79,-67.7],'caleta olivia':[-46.44,-67.52],'puerto deseado':[-47.75,-65.89],
'senillosa':[-38.97,-68.43],'vista alegre':[-38.83,-68.15],'fernandez oro':[-39.0,-67.88],'campo grande':[-38.98,-67.72],'contralmirante cordero':[-38.97,-67.75],'balsa las perlas':[-39.0,-68.0],'lamarque':[-39.42,-65.7],'luis beltran':[-39.32,-65.77],'chimpay':[-39.16,-66.14],'darwin':[-39.2,-65.77],'valcheta':[-40.69,-66.16],'los menucos':[-40.84,-68.09],'ramos mexia':[-40.5,-66.6],'maquinchao':[-41.25,-68.73],'chos malal':[-37.38,-70.27],'rincon de los sauces':[-37.39,-68.93],'anelo':[-38.35,-68.78],'piedra del aguila':[-40.04,-70.05],'villa pehuenia':[-38.88,-71.16],'general godoy':[-39.0,-67.28],'ingeniero huergo':[-39.08,-67.23],'mainque':[-39.05,-67.4],'rosario de lerma':[-24.98,-65.58]
};
var PROV=['rio negro','buenos aires','neuquen','chubut','santa cruz','tierra del fuego','la pampa','cordoba','santa fe','mendoza','argentina','arg','bs as','bsas','gba','gran buenos aires','pcia'];
var ACC='bahía blanca|neuquén|junín|tucumán|san miguel de tucumán|córdoba|paraná|mendoza|san martín de los andes|junín de los andes|el bolsón|general conesa|río colorado|río cuarto|río gallegos|río grande|río negro|lanús|morón|luján|zárate|olavarría|villa maría|villa mercedes|oberá|puerto iguazú|puerto iguazú|santa fe|rawson|añelo|fernández oro|ramos mejía|ramos mexia|luis beltrán|lamarque|catamarca|gualeguaychú|concordia|tres arroyos|coronel suárez|chimpay|rincón de los sauces|piedra del águila|san salvador de jujuy|ezeiza|adrogué|josé c paz|general fernández oro'.split('|'); var NICE={'caba':'CABA','capital federal':'CABA','ciudad autonoma de buenos aires':'CABA','ciudad de buenos aires':'CABA','buenos aires':'CABA','nueve de julio':'9 de Julio'};
function norm(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ,\/\-\(\)]/g,' ').replace(/\s+/g,' ').trim();}
var ACCM={}; ACC.forEach(function(a){ACCM[a.normalize('NFD').replace(/[\u0300-\u036f]/g,'')]=a;});
function title(s){s=ACCM[s]||s;return s.replace(/(^|[ \-])([a-zñáéíóúü0-9])([a-zñáéíóúü0-9]*)/g,function(m,p,a,b){var w=a+b; return p+((p===''||!/^(de|del|la|las|los|el|y)$/.test(w))?a.toUpperCase()+b:w);});}
function locate(raw){
  var n=norm(raw); if(!n) return null;
  var parts=[n].concat(n.split(/[,\/\(\)\-]| - /).map(function(x){return x.trim();}).filter(Boolean));
  for(var i=0;i<parts.length;i++){ var p=parts[i].replace(/^(ciudad de|localidad de|la ciudad de)\s+/,''); if(G[p]) return {key:p,ll:G[p]}; }
  var best=null; Object.keys(G).forEach(function(k){ if(new RegExp('(^| )'+k+'( |$)').test(n) && (!best||k.length>best.length)) best=k; });
  return best?{key:best,ll:G[best]}:null;
}
function csvRows(text){
  text=String(text).replace(/\r\n/g,'\n').replace(/\r/g,'\n'); var rows=[],row=[],f='',q=false;
  for(var i=0;i<text.length;i++){var c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c==='"') q=true; else if(c===','){row.push(f);f='';} else if(c==='\n'){row.push(f);rows.push(row);row=[];f='';} else f+=c; }
  if(f.length||row.length){row.push(f);rows.push(row);} return rows;
}
function colIdx(hn,keys){for(var k=0;k<keys.length;k++)for(var j=0;j<hn.length;j++)if(hn[j].indexOf(keys[k])>=0)return j;return -1;}

class OwMapa extends HTMLElement{
  static get observedAttributes(){return ['theme','csv'];}
  connectedCallback(){
    if(this._on) return; this._on=true; this.style.display='block';
    var self=this; this._data=null;
    this._ro=new ResizeObserver(function(){ var w=Math.round(self.clientWidth); if(w&&w!==self._w){ self._w=w; self.draw(); } }); this._ro.observe(this);
    this.load();
  }
  disconnectedCallback(){ if(this._ro) this._ro.disconnect(); this._on=false; }
  attributeChangedCallback(){ if(this._on){ this.load(); } }
  th(){ return THEME[this.getAttribute('theme')]||THEME.summer; }
  load(){
    var self=this, url=this.getAttribute('csv')||CSV[this.getAttribute('theme')]||CSV.summer;
    this._data=null; this.draw();
    fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(t){
      var all=csvRows(t); if(!all.length){self._data={cities:[],lost:[],total:0};self.draw();return;}
      var hn=all[0].map(norm), oi=colIdx(hn,['ciudad','localidad','origen','procedencia','residencia','domicilio','de donde']), ni=colIdx(hn,['notas']);
      var map={}, lost={}, total=0;
      for(var i=1;i<all.length;i++){ var r=all[i]; if(!r||!r.join('').trim()) continue;
        if(ni>=0 && /NO SE PRESENT/i.test(r[ni]||'')) continue;
        total++; var raw=oi>=0?String(r[oi]||'').trim():''; if(!raw) continue;
        var m=locate(raw);
        if(m){ var c=map[m.key]||(map[m.key]={key:m.key,name:NICE[m.key]||title(m.key),lat:m.ll[0],lon:m.ll[1],n:0}); c.n++; }
        else if(PROV.indexOf(norm(raw))<0){ var k=title(norm(raw)); lost[k]=(lost[k]||0)+1; }
      }
      self._data={cities:Object.keys(map).map(function(k){return map[k];}),lost:Object.keys(lost),total:total}; self.draw();
    }).catch(function(){ self._data={error:true}; self.draw(); });
  }
  draw(){
    var T=this.th(), d=this._data, W=this._w||this.clientWidth||700;
    var wrap='color:'+T.text+';font-family:'+T.font+';';
    if(!d){ this.innerHTML='<div style="'+wrap+'text-align:center;padding:40px 0;color:'+T.muted+';">Cargando mapa…</div>'; return; }
    if(d.error){ this.innerHTML='<div style="'+wrap+'text-align:center;padding:40px 0;color:'+T.muted+';">No se pudo cargar el mapa en este momento.</div>'; return; }
    if(!d.cities.length){ this.innerHTML='<div style="'+wrap+'text-align:center;padding:40px 0;color:'+T.muted+';">Todavía no hay localidades para mostrar.</div>'; return; }
    var narrow=W<560, fs=narrow?11:14, mapW=Math.min(300,Math.round(W*(narrow?.4:.4))), colW=Math.floor((W-mapW)/2);
    var LON0=-73.8,LAT0=-21.6,LAT1=-55.2, kx=Math.cos(38*Math.PI/180);
    var ppd=mapW/(21*kx), mapH=Math.round((LAT0-LAT1)*ppd), gap=narrow?13:17, padY=12;
    function X(lon){return colW+(lon-LON0)*kx*ppd;} function Y(lat){return padY+(LAT0-lat)*ppd;}
    var cs=d.cities.map(function(c){return Object.assign({},c,{x:X(c.lon),y:Y(c.lat)});});
    var split=-65; cs.forEach(function(c){c.side=c.lon<split?'L':'R';});
    var maxN=0; ['L','R'].forEach(function(s){var k=cs.filter(function(c){return c.side===s;}).length; if(k>maxN)maxN=k;});
    var H=Math.max(mapH+padY*2, maxN*gap+padY*2);
    ['L','R'].forEach(function(s){
      var a=cs.filter(function(c){return c.side===s;}).sort(function(p,q){return p.y-q.y;});
      var prev=-1e9; a.forEach(function(c){c.ly=Math.max(c.y,prev+gap); prev=c.ly;});
      var over=prev-(H-padY); if(a.length&&over>0){ var nx=1e9; for(var i=a.length-1;i>=0;i--){ a[i].ly=Math.min(a[i].ly, i===a.length-1?H-padY:nx-gap); nx=a[i].ly; } }
    });
    var poly=function(p){return p.map(function(q){return X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1);}).join(' ');};
    var maxLbl=Math.max(6,Math.floor((colW-14)/(fs*.5)));
    var s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;max-width:'+W+'px;margin:0 auto;font-family:'+T.font+';" role="img" aria-label="Mapa de Argentina con las localidades de los inscriptos">';
    s+='<polygon points="'+poly(AR)+'" fill="'+T.land+'" stroke="'+T.stroke+'" stroke-width="1.4" stroke-linejoin="round"/>';
    [MAL1,MAL2,EST].forEach(function(p){ s+='<polygon points="'+poly(p)+'" fill="'+T.land+'" stroke="'+T.stroke+'" stroke-width="1.2" stroke-linejoin="round"/>'; });
    s+='<text x="'+X(-59.6).toFixed(1)+'" y="'+(Y(-52.55)+fs*.8).toFixed(1)+'" text-anchor="middle" font-size="'+(fs-2)+'" font-style="italic" fill="'+T.muted+'">Islas Malvinas</text>';
    s+='<polygon points="'+poly(TDF)+'" fill="'+T.land+'" stroke="'+T.stroke+'" stroke-width="1.4" stroke-linejoin="round"/>';
    cs.forEach(function(c){ var ex=c.side==='L'?colW-4:colW+mapW+4; s+='<polyline points="'+c.x.toFixed(1)+','+c.y.toFixed(1)+' '+(c.side==='L'?ex+10:ex-10)+','+c.ly.toFixed(1)+' '+ex+','+c.ly.toFixed(1)+'" fill="none" stroke="'+T.line+'" stroke-width="1"/>'; });
    cs.forEach(function(c){ var r=Math.min(9,3.4+Math.sqrt(c.n)*1.5); s+='<circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="'+(r+3.5)+'" fill="'+T.halo+'"/><circle cx="'+c.x.toFixed(1)+'" cy="'+c.y.toFixed(1)+'" r="'+r+'" fill="'+T.dot+'" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>'; });
    cs.forEach(function(c){
      var nm=c.name.length>maxLbl?c.name.slice(0,maxLbl-1)+'…':c.name, left=c.side==='L', x=left?colW-8:colW+mapW+8;
      s+='<text x="'+x+'" y="'+(c.ly+fs*.35).toFixed(1)+'" text-anchor="'+(left?'end':'start')+'" font-size="'+fs+'" font-weight="700" fill="'+T.text+'" letter-spacing=".02em">'+nm.replace(/&/g,'&amp;').replace(/</g,'&lt;')+(c.n>1?'<tspan fill="'+T.dot+'"> · '+c.n+'</tspan>':'')+'</text>';
    });
    s+='</svg>';
    var sorted=cs.slice().sort(function(a,b){return b.n-a.n||a.name.localeCompare(b.name);});
    var chips='<div style="display:flex;flex-wrap:wrap;gap:6px 8px;justify-content:center;margin-top:18px;">'+sorted.map(function(c){return '<span style="background:'+T.chip+';border:1px solid '+T.chipb+';border-radius:999px;padding:4px 11px;font-size:13px;font-weight:700;letter-spacing:.03em;">'+c.name+(c.n>1?' <b style="color:'+T.dot+';">'+c.n+'</b>':'')+'</span>';}).join('')+'</div>';
    var stat='<div style="text-align:center;margin-bottom:14px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:'+T.muted+';"><b style="color:'+T.dot+';font-size:1.25em;">'+d.total+'</b> nadadores · <b style="color:'+T.dot+';font-size:1.25em;">'+cs.length+'</b> localidades</div>';
    var lost=d.lost.length?'<div style="text-align:center;margin-top:12px;font-size:12px;color:'+T.muted+';">Sin ubicar en el mapa: '+d.lost.join(', ')+'</div>':'';
    this.innerHTML='<div style="'+wrap+'">'+stat+s+chips+lost+'</div>';
  }
}
if(!customElements.get('ow-mapa')) customElements.define('ow-mapa',OwMapa);
})();
