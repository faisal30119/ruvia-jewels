'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import MobileBottomNav from '@/components/MobileBottomNav';
import SearchModal from '@/components/SearchModal';

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isHome = pathname === '/';

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className={`pb-16 lg:pb-0 ${isHome ? '' : 'pt-16 lg:pt-20'}`}>
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomNav />
      <SearchModal />
    </>
  );
}



