import Header from '@/components/layout/Header';
import Carousel from '@/components/home/Carousel';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import TopRankingSection from '@/components/home/TopRankingSection';
import ViewAllProductsSection from '@/components/home/ViewAllProductsSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <div className="px-6 max-w-[1440px] mx-auto">
        <Carousel />
      </div>
      
      <FlashSaleSection />
      <CategoriesSection />
      <TopRankingSection />
      
      {/* 
        Personalized View All Products Section:
        Dynamic recommendations based on customer search history, recently uploaded arrivals, and category best sellers.
      */}
      <ViewAllProductsSection />
    </main>
  );
}
