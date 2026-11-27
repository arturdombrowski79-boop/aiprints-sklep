const { chromium } = require('playwright');
const fs = require('fs');
const P = '/home/claude/aiprints-sklep/public/';
const logo = fs.readFileSync(P+'img/logo-white.svg','utf8');
const img = f => 'data:image/jpeg;base64,' + fs.readFileSync(P+f).toString('base64');
const T = [
 {id:'XVX_SyQnSk8', imgs:['img/hf/wizytowki-metalowe-1.jpg','img/hf/krysztal-pupil-2.jpg','img/hf/medale-grawer-2.jpg','img/hf/moneta-pamiatkowa-1.jpg'], tag:'NOWOŚCI', h:'Z GRAWERA', sub:'wizytówki metalowe · kryształy · medale', badge:'od<br>29 zł'},
 {id:'TuYjdltZUFA', imgs:['img/site/pracownia/fine-art.jpg'], tag:'FINE ART', h:'DRUK GICLÉE', sub:'Hahnemühle · Epson P9500 · Digigraphie®', badge:''},
 {id:'i2XWFBcfqow', imgs:['img/hf/druk-3d-z-pliku-r1.jpg'], tag:'DRUK 3D', h:'Z TWOJEGO PLIKU', sub:'wgraj plik – cena od razu', badge:''},
 {id:'cUAksTQRdpo', imgs:['img/site/pracownia.jpg'], tag:'PRACOWNIA', h:'W CHORZOWIE', sub:'druk · grawer · personalizacja', badge:''},
 {id:'c_KYNIAt3MI', imgs:['img/hf/tabliczka-krzyz-pleksi-1.jpg'], tag:'PAMIĘĆ', h:'TABLICZKA NA KRZYŻ', sub:'gotowa w 24 h', badge:'79 zł'},
 {id:'OpT0XGnzcKU', imgs:['img/f/krysztal-para.jpg','img/hf/akryl-polaroid-1.jpg'], tag:'PREZENT', h:'ZE ZDJĘCIEM', sub:'kryształ 3D · akryl · grawer', badge:''},
 {id:'zxVnsHK4kgw', imgs:['img/hf/fototapeta-r1.jpg'], tag:'FOTOTAPETA', h:'Z TWOJEGO ZDJĘCIA', sub:'na wymiar · bez PCV', badge:''},
];
const html = t => {
  const n=t.imgs.length;
  const grid = n===1 ? `<div class="ph" style="inset:0;background-image:url(${img(t.imgs[0])})"></div>`
   : n===2 ? t.imgs.map((f,i)=>`<div class="ph" style="left:0;right:0;top:${i*50}%;height:50%;background-image:url(${img(f)})"></div>`).join('')
   : t.imgs.map((f,i)=>`<div class="ph" style="left:${(i%2)*50}%;top:${Math.floor(i/2)*50}%;width:50%;height:50%;background-image:url(${img(f)})"></div>`).join('');
  return `<html><head><style>
  body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#111;font-family:Montserrat,sans-serif}
  .top{position:absolute;left:0;right:0;top:0;height:1240px;overflow:hidden}
  .ph{position:absolute;background-size:cover;background-position:center;border:3px solid #111;box-sizing:border-box}
  .fade{position:absolute;left:0;right:0;top:880px;height:380px;background:linear-gradient(transparent,#111)}
  .logo{position:absolute;top:60px;left:50%;transform:translateX(-50%);width:420px;filter:drop-shadow(0 4px 18px rgba(0,0,0,.7))}
  .txt{position:absolute;left:70px;right:70px;top:1180px}
  .tag{display:inline-block;background:#E85D24;color:#fff;font-weight:900;font-size:118px;letter-spacing:2px;padding:6px 34px 10px;border-radius:18px;line-height:1.05}
  .h{color:#fff;font-weight:900;font-size:${t.h.length>15?92:108}px;line-height:1.05;margin-top:26px}
  .sub{color:#ddd;font-weight:600;font-size:46px;margin-top:30px}
  .badge{position:absolute;right:60px;top:1000px;width:250px;height:250px;border-radius:50%;background:#fff;color:#E85D24;font-weight:900;font-size:60px;line-height:1.05;display:flex;align-items:center;justify-content:center;text-align:center;transform:rotate(-8deg);box-shadow:0 10px 40px rgba(0,0,0,.5)}
  .url{position:absolute;bottom:70px;left:70px;color:#fff;font-weight:800;font-size:50px;opacity:.9}
  </style></head><body><div class="top">${grid}<div class="fade"></div></div>
  <div class="logo">${logo}</div>
  ${t.badge?`<div class="badge">${t.badge}</div>`:''}
  <div class="txt"><div class="tag">${t.tag}</div><div class="h">${t.h}</div><div class="sub">${t.sub}</div></div>
  <div class="url">aiprints.pl · Chorzów</div></body></html>`;
};
(async()=>{
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1080,height:1920}});
  for (const t of T){ await p.setContent(html(t)); await p.waitForTimeout(300); await p.screenshot({path:`${t.id}.jpg`,type:'jpeg',quality:88}); }
  await b.close();
})();
