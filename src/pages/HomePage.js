import React from 'react';
import HeroSection from '../components/HeroSection';
import UpcomingSection from '../components/UpcomingSection';
import FeaturedProductsSection from '../components/FeaturedProductsSection';
import BestsellerProductsSection from '../components/BestsellerProductsSection';
import NewReleaseProductsSection from '../components/NewReleaseProductsSection';
import VisitInStoreSection from '../components/VisitInStoreSection';
import FounderSection from '../components/FounderSection';
import TestimonialSlider from '../components/TestimonialSlider';

const HomePage = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <HeroSection />
            <div id="debug-check" className="hidden">v1.2</div>
            <FeaturedProductsSection />
            <BestsellerProductsSection />
            <NewReleaseProductsSection />
            <UpcomingSection />
            <FounderSection />
            <VisitInStoreSection />
            <TestimonialSlider />
        </div>
    );
};

export default HomePage;
