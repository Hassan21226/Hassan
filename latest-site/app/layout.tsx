import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'لذة الأجداد | المنيو',description:'مذاق من تراثنا، يُحضّر بحب. اكتشف المنيو واختر الحجم المناسب لك.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>}
