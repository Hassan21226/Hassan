import {priceOptions,type PriceOption} from '../price-options';
import {WHATSAPP_URL} from '../whatsapp';
import {groupProducts} from './group-products';
type Product={name:string;description:string;category:string;prices:number[];options?:PriceOption[];optionNote?:string;servings?:number;extras?:{name:string;price:number}[];media:{url:string;kind:string}[]};
export type MenuImage={url:string;name:string};
export async function exportMenuImages(menu:{name:string;products:Product[]},photos:boolean):Promise<MenuImage[]>{
 await document.fonts.ready;
 const load=async(url:string)=>{const img=new Image();img.src=url;try{await img.decode();return img}catch{return null}};
 const logo=await load('/logo.webp');
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('تعذر إنشاء الصورة');
 const c=ctx,draw:(()=>void)[]=[];let y=65;
 const font=(size:number,bold=false)=>{c.font=`${bold?700:400} ${size}px "Noto Sans Arabic",Tahoma,sans-serif`;c.direction='rtl';c.textAlign='right';c.textBaseline='top'};
 const lines=(text:string,size:number,width=900,bold=false)=>{font(size,bold);const out:string[]=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(c.measureText(line+' '+word).width>width&&line){out.push(line);line=''}if(c.measureText(word).width>width){for(const ch of word){if(c.measureText(line+ch).width>width){out.push(line);line=''}line+=ch}}else line+=(line?' ':'')+word}out.push(line)}return out};
 const line=(value:string,size:number,bold:boolean,color:string,x:number,top:number,align:CanvasTextAlign='right')=>draw.push(()=>{font(size,bold);c.fillStyle=color;c.textAlign=align;c.fillText(value,x,top)});
 const text=(value:string,size:number,bold=false,color='#703a00')=>{for(const l of lines(value,size,900,bold)){line(l,size,bold,color,990,y);y+=size*1.65}};
 const rule=(color:string)=>{const top=y;draw.push(()=>{c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(90,top);c.lineTo(990,top);c.stroke()})};
 const contactTop=y+10;draw.push(()=>{c.fillStyle='#128c4a';c.beginPath();c.roundRect(240,contactTop,600,90,30);c.fill()});line('تواصل عبر واتساب',42,true,'#ffffff',540,contactTop+12,'center');y=contactTop+112;
 line(WHATSAPP_URL.replace('https://',''),32,false,'#128c4a',540,y,'center');y+=120;
 if(logo){const top=y;draw.push(()=>c.drawImage(logo,450,top,180,218));y+=240}
 for(const l of lines(menu.name,64,900,true)){line(l,64,true,'#703a00',540,y,'center');y+=105}
 line('قائمة الطعام',48,false,'#78614e',540,y,'center');y+=110;
 for(const group of groupProducts(menu.products)){
  text(group.category,60,true);rule('#e7ab58');y+=32;
  for(const {product:p} of group.products){
   text(p.name,62,true);
   if(photos){const photo=p.media.find(m=>m.kind==='image');if(photo){const img=await load(photo.url);if(!img)throw Error('تعذر تحميل إحدى صور الأطباق. أعد المحاولة أو أوقف إظهار الصور.');const scale=Math.min(900/img.width,270/img.height),top=y;draw.push(()=>c.drawImage(img,540-img.width*scale/2,top,img.width*scale,img.height*scale));y+=290}}
   for(const option of priceOptions(p)){
    const labelLines=lines(option.name,52,550);const amount=option.price.toLocaleString('ar-SA')+' ر.س';font(52,true);
    if(c.measureText(amount).width>320){text(option.name,52);text(amount,52,true)}else{line(amount,52,true,'#703a00',90,y,'left');for(const l of labelLines){line(l,52,false,'#703a00',990,y);y+=86}}
   }
   if(p.description)text(p.description,46,false,'#78614e');
   if(p.optionNote)text(p.optionNote,46,false,'#78614e');
   if(p.servings)text('عدد الأفراد: '+p.servings,46);
   if(p.extras?.length){text('الإضافات',48,true);for(const e of p.extras)text(`${e.name} — ${e.price.toLocaleString('ar-SA')} ر.س`,46)}
   y+=24;rule('#eadbc4');y+=38;
  }
  y+=28;
 }
 if(!menu.products.length)text('تُضاف الأطباق قريباً',52);
 y+=15;for(const l of lines(menu.name,36)){line(l,36,false,'#78614e',540,y,'center');y+=60}
 canvas.height=Math.ceil(y);
 c.fillStyle='#fffaf1';c.fillRect(0,0,1080,canvas.height);c.strokeStyle='#cda368';c.lineWidth=3;c.strokeRect(30,30,1020,canvas.height-60);
 draw.forEach(render=>render());
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('تعذر حفظ الصورة الكاملة على هذا الجهاز. جرّب التنزيل من الكمبيوتر.')),'image/png'));
 return [{url:URL.createObjectURL(blob),name:'lathat-alajdad-menu.png'}];
}
