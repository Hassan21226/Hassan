'use client';
import {useEffect,useState} from 'react';
import {ImageDown,LoaderCircle,FileDown} from 'lucide-react';
import {groupProducts} from './group-products';
import './print.css';
import {WhatsAppButton,WHATSAPP_URL} from '../whatsapp';
import {imageToSinglePagePdf} from './single-page-pdf';
import {exportMenuImages,type MenuImage} from './export-images';
import {priceOptions,type PriceOption} from '../price-options';
type Product={id:string;name:string;description:string;category:string;prices:number[];options?:PriceOption[];optionNote?:string;servings?:number;extras?:{id:string;name:string;price:number}[];media:{url:string;kind:'image'|'video';name:string}[]};
type Menu={name:string;products:Product[]};
const money=(n:number)=>n.toLocaleString('ar-SA',{maximumFractionDigits:2});
async function preparePrint(){
  if(document.fonts?.ready) await document.fonts.ready;
  await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>undefined)));
}
export default function PrintMenu(){
  const [menu,setMenu]=useState<Menu|null>(null),[error,setError]=useState(''),[photos,setPhotos]=useState(false),[printing,setPrinting]=useState(false),[images,setImages]=useState<MenuImage[]>([]),[exportError,setExportError]=useState(''),[pdfUrl,setPdfUrl]=useState('');
  useEffect(()=>{let active=true;fetch('/api/menu').then(async r=>{if(!r.ok)throw Error();const j=await r.json() as {menu?:Menu};if(!j.menu||!Array.isArray(j.menu.products))throw Error();if(active)setMenu(j.menu)}).catch(()=>{if(active)setError('تعذر تحميل المنيو. حدّث الصفحة وحاول مجدداً.')});return()=>{active=false}},[]);
  useEffect(()=>()=>{images.forEach(x=>URL.revokeObjectURL(x.url))},[images]);
  async function print(){if(!menu)return;setPrinting(true);setExportError('');try{await preparePrint();setImages(await exportMenuImages(menu,photos))}catch(e){setExportError(e instanceof Error?e.message:'تعذر إنشاء الصور. حاول مجدداً.')}finally{setPrinting(false)}}
  useEffect(()=>()=>{if(pdfUrl)URL.revokeObjectURL(pdfUrl)},[pdfUrl]);
  async function savePdf(){if(!menu)return;setPrinting(true);setExportError('');let generated:MenuImage[]=[];try{generated=await exportMenuImages(menu,photos);const blob=await imageToSinglePagePdf(generated[0].url);const url=URL.createObjectURL(blob);setPdfUrl(url);const link=document.createElement('a');link.href=url;link.download='lathat-alajdad-menu.pdf';document.body.appendChild(link);link.click();link.remove()}catch(e){setExportError(e instanceof Error?e.message:'تعذر تجهيز PDF. حاول مجدداً.')}finally{generated.forEach(x=>URL.revokeObjectURL(x.url));setPrinting(false)}}
  if(error)return <main className="print-state">{error}</main>;
  if(!menu)return <main className="print-state"><LoaderCircle className="spin"/> جارٍ تجهيز المنيو…</main>;
  const groups=groupProducts(menu.products);
  return <main className="menu-print" dir="rtl">
    <div className="menu-print-tools"><label><input type="checkbox" checked={photos} onChange={e=>setPhotos(e.target.checked)}/> إظهار صور الأطباق</label><button disabled={printing} onClick={print}><ImageDown size={17}/> {printing?'جاري التجهيز…':'تجهيز صورة المنيو'}</button><button disabled={printing} onClick={savePdf}><FileDown size={17}/> تحميل PDF صفحة واحدة</button></div>
    <p className="export-hint">حمّل المنيو كاملاً كصورة واحدة أو ملف PDF من صفحة واحدة طويلة، بنفس الخط الكبير وترتيب التصنيفات.</p>
    {pdfUrl&&<div className="export-results"><a href={pdfUrl} download="lathat-alajdad-menu.pdf">ملف PDF جاهز — تحميل الصفحة كاملة</a></div>}
    {exportError&&<p className="export-error" role="alert">{exportError}</p>}
    {!!images.length&&<section className="export-results" aria-label="صورة المنيو الجاهزة"><h2>صورة المنيو جاهزة</h2><p>حمّل الصورة الكاملة لحفظها ومشاركتها.</p>{images.map((item,i)=><div key={item.url}><img src={item.url} alt={'صورة المنيو '+(i+1)}/><a href={item.url} download={item.name}>تحميل صورة المنيو كاملة</a></div>)}</section>}
    <div className="menu-print-paper">
      <header className="menu-print-header"><img src="/logo.webp" alt={'شعار '+menu.name}/><div><span className="menu-print-kicker">من مطبخنا إلى سفرتكم</span><h1>{menu.name}</h1><p>قائمة الطعام</p></div><div className="print-header-contact"><WhatsAppButton/><p className="whatsapp-address" dir="ltr">{WHATSAPP_URL.replace('https://','')}</p></div></header>
      <div className="menu-print-divider" aria-hidden="true">✦</div>
      {groups.length?groups.map(({category,products},index)=><section className="menu-print-section" key={category} aria-labelledby={'menu-section-'+index}>
        <h2 id={'menu-section-'+index}>{category}</h2>
        <div className="menu-print-items">{products.map(({product:p})=>{const photo=photos?p.media.find(m=>m.kind==='image'):null;return <article className="menu-print-item" key={p.id}>
          {photo&&<img className="menu-print-photo" src={photo.url} alt={p.name}/>}
          <div className="menu-print-copy">
            <div className="menu-print-line"><h3>{p.name}</h3><span className="menu-print-leader" aria-hidden="true"/><div className="menu-print-amounts">{priceOptions(p).map(option=><div key={option.id}><span>{option.name}</span><strong>{money(option.price)} <small>ر.س</small></strong></div>)}</div></div>
            {p.description&&<p className="menu-print-description">{p.description}</p>}{p.optionNote&&<p className="menu-print-description">{p.optionNote}</p>}
            {p.servings&&<p className="menu-print-servings">عدد الأفراد: {p.servings.toLocaleString('ar-SA')}</p>}
            {!!p.extras?.length&&<div className="menu-print-extras"><span>الإضافات</span>{p.extras.map(extra=><div key={extra.id}><span>{extra.name}</span><span className="menu-print-leader" aria-hidden="true"/><b>{money(extra.price)} ر.س</b></div>)}</div>}
          </div>
        </article>})}</div>
      </section>):<p className="menu-print-empty">تُضاف الأطباق إلى المنيو قريباً.</p>}
      <footer className="menu-print-footer"><p>{menu.name} · أصالة المذاق وكرم الضيافة</p></footer>
    </div>
  </main>;
}
