// OW GALERÍA DE FOTOS — Apps Script independiente (Implementar > Aplicación web > Ejecutar como: yo / Acceso: cualquiera)
var CODIGO='OW2026_pool', CARPETA='OW Galería de fotos', CARPETA_P='OW Galería posters';
function carpeta_(n){var it=DriveApp.getFoldersByName(n||CARPETA);return it.hasNext()?it.next():DriveApp.createFolder(n||CARPETA);}
function meta_(f){var p=(f.getDescription()||'').split('|');if(p[0]==='v2')return {h:p[1]||'',c:parseInt(p[2],10)||0,p:p[3]||''};return {h:p[0]||'',c:0,p:''};}
function desc_(m){return 'v2|'+m.h+'|'+m.c+'|'+m.p;}
function doPost(e){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    var d=JSON.parse(e.postData.contents);
    if(d.codigo!==CODIGO)return out_({ok:false,error:'codigo'});
    if(d.accion==='borrar'){var g=DriveApp.getFileById(d.id),pm=meta_(g);if(pm.p){try{DriveApp.getFileById(pm.p).setTrashed(true);}catch(x){}}g.setTrashed(true);return out_({ok:true});}
    if(d.accion==='limpiar'){
      var it0=carpeta_().getFiles(),L=[];
      while(it0.hasNext()){var f0=it0.next(),m0=meta_(f0);L.push({f:f0,m:m0,k:m0.c||f0.getDateCreated().getTime()});}
      L.sort(function(a,b){return a.k-b.k;});
      var vistos={},borradas=[];
      L.forEach(function(x){
        var by=x.f.getBlob().getBytes(),k=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,by).join(',');
        if(vistos[k]){if(x.m.p){try{DriveApp.getFileById(x.m.p).setTrashed(true);}catch(e1){}}x.f.setTrashed(true);borradas.push(x.f.getId());}else vistos[k]=1;
      });
      return out_({ok:true,eliminadas:borradas.length});
    }
    var it=carpeta_().getFiles();
    while(it.hasNext()){var m=meta_(it.next());if(d.hash&&m.h===d.hash)return out_({ok:false,error:'repetida'});}
    var mi=d.mime||'image/jpeg',vid=mi.indexOf('video')===0,ex=vid?(mi.split('/')[1]||'mp4').replace('quicktime','mov'):'jpg';
    var b=Utilities.newBlob(Utilities.base64Decode(d.data),mi,(d.nombre||'foto')+'.'+ex);
    var f=carpeta_().createFile(b);f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    var pid='';
    if(d.poster){var pf=carpeta_(CARPETA_P).createFile(Utilities.newBlob(Utilities.base64Decode(d.poster),'image/jpeg',(d.nombre||'foto')+'-poster.jpg'));pf.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);pid=pf.getId();}
    f.setDescription(desc_({h:d.hash||'',c:d.cap||0,p:pid}));
    return out_({ok:true,id:f.getId()});
  }catch(err){return out_({ok:false,error:String(err)});}
  finally{lock.releaseLock();}
}
function doGet(){
  var it=carpeta_().getFiles(),r=[];
  while(it.hasNext()){var f=it.next(),m=meta_(f);r.push({id:f.getId(),t:f.getDateCreated().getTime(),c:m.c,v:f.getMimeType().indexOf('video')===0,h:m.h,p:m.p});}
  return out_({fotos:r.slice(0,400)});
}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
