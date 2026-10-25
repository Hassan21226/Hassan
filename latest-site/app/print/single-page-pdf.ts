import {WHATSAPP_URL} from '../whatsapp';
// Embed the complete menu image in one PDF page. No pagination or downscaling.
export function makeImagePdf(jpeg:Uint8Array,width:number,height:number):Uint8Array{
 const encoder=new TextEncoder(),parts:Uint8Array[]=[];let size=0;
 const append=(value:string|Uint8Array)=>{const bytes=typeof value==='string'?encoder.encode(value):value;parts.push(bytes);size+=bytes.length};
 const offsets:number[]=[0];
 const pageWidth=540,pageHeight=pageWidth*height/width;
 // PDF 1.6 UserUnit keeps very long pages within the standard coordinate limit.
 const unit=Math.max(1,Math.ceil(pageHeight/14000));const w=pageWidth/unit,h=pageHeight/unit;
 const obj=(id:number,body:string)=>{offsets[id]=size;append(`${id} 0 obj\n${body}\nendobj\n`)};
 append('%PDF-1.6\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /UserUnit ${unit} /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R /Annots [6 0 R] >>`);
 offsets[4]=size;append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);append(jpeg);append('\nendstream\nendobj\n');
 const drawing=`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
 obj(5,`<< /Length ${encoder.encode(drawing).length} >>\nstream\n${drawing}endstream`);
 obj(6,`<< /Type /Annot /Subtype /Link /Rect [${90/unit} ${(height-267)*w/width} ${450/unit} ${(height-75)*w/width}] /Border [0 0 0] /A << /S /URI /URI (${WHATSAPP_URL}) >> >>`);
 const xref=size;append('xref\n0 7\n0000000000 65535 f \n');for(let i=1;i<=6;i++)append(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);
 append(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
 const result=new Uint8Array(size);let at=0;for(const bytes of parts){result.set(bytes,at);at+=bytes.length}return result;
}
export async function imageToSinglePagePdf(imageUrl:string):Promise<Blob>{
 const image=new Image();image.src=imageUrl;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('تعذر تجهيز PDF');
 ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
 const jpeg=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('تعذر تجهيز PDF على هذا الجهاز')),'image/jpeg',0.98));
 const bytes=makeImagePdf(new Uint8Array(await jpeg.arrayBuffer()),canvas.width,canvas.height);
 return new Blob([bytes as BlobPart],{type:'application/pdf'});
}
