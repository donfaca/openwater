// OW EQUIPO — fotos y notas técnicas de nadadores (Implementar > Aplicación web > Ejecutar como: yo / Acceso: cualquiera)
var CODIGO='owteam', CARPETA='OW Equipo fotos', NOTAS='ow-notas-equipo.json';
function carpeta_(){var it=DriveApp.getFoldersByName(CARPETA);return it.hasNext()?it.next():DriveApp.createFolder(CARPETA);}
function notas_(){var it=carpeta_().getFilesByName(NOTAS);if(!it.hasNext())return {};try{return JSON.parse(it.next().getBlob().getDataAsString())||{};}catch(e){return {};}}
function guardarNotas_(o){var c=carpeta_(),it=c.getFilesByName(NOTAS),s=JSON.stringify(o);if(it.hasNext())it.next().setContent(s);else c.createFile(NOTAS,s,'application/json');}
function doPost(e){
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    var d=JSON.parse(e.postData.contents);
    if(String(d.codigo).toLowerCase()!==CODIGO)return out_({ok:false,error:'codigo'});
    var s=String(d.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'');if(!s)return out_({ok:false,error:'slug'});
    if(d.accion==='nota'){var n=notas_();n[s]={txt:String(d.texto||'').slice(0,20000),t:Date.now()};guardarNotas_(n);return out_({ok:true,t:n[s].t});}
    var c=carpeta_(),old=c.getFilesByName(s+'.jpg');while(old.hasNext())old.next().setTrashed(true);
    var f=c.createFile(Utilities.newBlob(Utilities.base64Decode(d.data),'image/jpeg',s+'.jpg'));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return out_({ok:true,id:f.getId()});
  }catch(err){return out_({ok:false,error:String(err)});}
  finally{lock.releaseLock();}
}
function doGet(){
  var it=carpeta_().getFiles(),r=[];
  while(it.hasNext()){var f=it.next(),nm=f.getName();if(/\.jpg$/.test(nm))r.push({s:nm.replace(/\.jpg$/,''),id:f.getId(),t:f.getLastUpdated().getTime()});}
  return out_({fotos:r,notas:notas_()});
}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
