const defaultProducts = [
  {id:1,name:"عريكة",description:"عريكة جنوبية",category:"أكل شعبي",sizes:[{name:"وسط",price:120},{name:"كبير",price:150}],details:"نكهة جنوبية أصيلة، تُحضّر بعناية."},
  {id:2,name:"طبق شعبي",description:"من أطباق تراثنا",category:"أكل شعبي",sizes:[{name:"وسط",price:null},{name:"كبير",price:null}],details:"طبق محضّر بكل حب."}
];
function getProducts(){try{const x=JSON.parse(localStorage.getItem("lathatProducts"));return Array.isArray(x)&&x.length?x:defaultProducts}catch{return defaultProducts}}
function money(price){return price==null||price===""?"السعر غير محدد":Number(price).toLocaleString("ar-SA")+" ر.س"}
let category="الكل";
const grid=document.querySelector("#products");
function render(){
 const query=(document.querySelector("#search")?.value||"").trim().toLowerCase();
 const items=getProducts().filter(p=>(category==="الكل"||p.category===category)&&(`${p.name} ${p.description} ${p.category}`).toLowerCase().includes(query));
 grid.innerHTML="";
 items.forEach((p,i)=>{
   const selected=p.sizes?.[0]||{name:"غير محدد",price:null};
   const card=document.createElement("article");card.className="product-card";
   card.innerHTML=`<div class="food-photo"><span class="food-tag">${esc(p.category||"أطباقنا")}</span><span class="date"></span><span class="food-emoji">✦</span></div>
   <div class="product-body"><div class="product-top"><div><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p></div><span class="item-number">${String(i+1).padStart(2,"0")}</span></div>
   <div class="size-area"><div class="size-label">اختر الحجم</div><div class="size-options">${(p.sizes||[]).map((s,j)=>`<button class="size-btn ${j===0?"selected":""}" data-index="${j}" type="button">${esc(s.name)}</button>`).join("")}</div>
   <div class="price-row"><span class="price-label">السعر حسب الحجم</span><div class="price">${money(selected.price)}${selected.price!=null?'<small></small>':""}</div></div></div>
   <div class="details"><span>تفاصيل الطبق</span><span>‹</span></div><p class="detail-text">${esc(p.details||"")}</p></div>`;
   card.querySelectorAll(".size-btn").forEach(btn=>btn.addEventListener("click",()=>{
    card.querySelectorAll(".size-btn").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");
    const s=p.sizes[Number(btn.dataset.index)];card.querySelector(".price").textContent=money(s.price);
   }));
   grid.appendChild(card);
 });
 document.querySelector("#empty").classList.toggle("hidden",items.length>0);
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.querySelector("#search").addEventListener("input",render);
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{category=b.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render()}));
render();