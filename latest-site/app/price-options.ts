export type PriceOption={id:string;name:string;price:number};
export function priceOptions(p:{options?:PriceOption[];prices:number[]}):PriceOption[]{
  if(p.options?.length)return p.options;
  const prices=p.prices.length===3?p.prices.slice(1):p.prices;
  return ['وسط','كبير'].map((name,i)=>({id:'legacy-'+i,name,price:prices[i]??0}));
}
