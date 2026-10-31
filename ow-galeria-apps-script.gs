// OW GALERÍA DE FOTOS — Apps Script independiente (Implementar > Aplicación web > Ejecutar como: yo / Acceso: cualquiera)
var CODIGO='OW2026_pool', CARPETA='OW Galería de fotos';
function carpeta_(){var it=DriveApp.getFoldersByName(CARPETA);return it.hasNext()?it.next():DriveApp.createFolder(CARPETA);}
function doPost(e){
  try{
    var d=JSON.parse(e.postData.contents);
    if(d.codigo!==CODIGO)return out_({ok:false,error:'codigo'});
    if(d.accion==='borrar'){DriveApp.getFileById(d.id).setTrashed(true);return out_({ok:true});}
    var b=Utilities.newBlob(Utilities.base64Decode(d.data),'image/jpeg',(d.nombre||'foto')+'.jpg');
    var f=carpeta_().createFile(b);f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return out_({ok:true,id:f.getId()});
  }catch(err){return out_({ok:false,error:String(err)});}
}
function doGet(){
  var it=carpeta_().getFiles(),r=[];
  while(it.hasNext()){var f=it.next();r.push({id:f.getId(),t:f.getDateCreated().getTime()});}
  r.sort(function(a,b){return b.t-a.t;});
  return out_({fotos:r.slice(0,120)});
}
function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
