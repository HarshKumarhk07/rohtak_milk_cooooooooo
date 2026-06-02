
// MOBILE-FRIENDLY TESTIMONIAL SLIDER
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { IoStarSharp } from 'react-icons/io5';
import { dairyAssets } from '../utils/dairyImageResolver';

// Assets
// Assets from public/assets
const person1 = dairyAssets.testimonialFamily;
const person2 = dairyAssets.testimonialDelivery;
const person3 = dairyAssets.testimonialFamily;

const testimonials = [
  {
    id: 1,
    name: 'Rohit Kumar',
    review:
      'The daily milk subscription is fantastic — always fresh, creamy and delivered on time. My family loves it!',
    rating: 5,
    ratingsCount: 128,
    userImage: person1,
    productImage: dairyAssets.productCowMilk,
    productName: 'Full Cream Milk',
    tagline: 'Pure Dairy Goodness',
    desc: 'Fresh full cream milk delivered daily from trusted local farms.',
  },
  {
    id: 2,
    name: 'Anjali Sharma',
    review:
      'Paneer and curd are always fresh and rich in taste. Great packaging and timely delivery.',
    rating: 5,
    ratingsCount: 96,
    userImage: person2,
    productImage: dairyAssets.productPaneer,
    productName: 'Homestyle Paneer',
    tagline: 'Creamy & Fresh',
    desc: 'Soft, hand-pressed paneer made from fresh milk for authentic Indian recipes.',
  },
  {
    id: 3,
    name: 'Vivek Singh',
    review:
      'I am very picky about my dairy, but the full cream milk here is outstanding. Pure and thick, just the way it should be.',
    rating: 5,
    ratingsCount: 142,
    userImage: person3,
    productImage: dairyAssets.productButtermilk,
    productName: 'Full Cream Farm Milk',
    tagline: 'Pure & Wholesome',
    desc: 'Freshly pasteurized full cream milk with no additives. Rich in calcium and essential vitamins.',
  },

];

const TestimonialSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const totalSlides = testimonials.length;

  const handleNext = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, []);

  // Animation
  const slideVariants = {
    initial: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  const currentTestimonial = testimonials[currentSlide];

  return (
    <section id='testimonials' className="relative py-1 md:py-4 overflow-hidden bg-gradient-to-br from-[#fffdf7] to-[#fefaf3]">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center min-h-[500px] md:min-h-[420px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute w-full flex-shrink-0"
            >
              <div className="flex flex-col md:flex-row items-stretch justify-center bg-white rounded-xl shadow-lg w-full overflow-hidden border border-gray-100">
                {/* User Image Section */}
                <div className="md:w-5/12 w-full h-56 md:h-[420px] bg-gray-50 flex-shrink-0 relative border-b md:border-b-0 md:border-r border-gray-100">
                  <img
                    src={currentTestimonial.userImage}
                    alt={currentTestimonial.name}
                    className="w-full h-full object-contain p-2 md:p-0 md:object-cover"
                  />
                </div>

                {/* Content Section */}
                <div className="md:w-7/12 flex flex-col justify-between p-5 md:p-8">
                  <div className="flex flex-col items-start text-left">
                    <div className="text-xl md:text-4xl text-green-600/20 mb-1 md:mb-2 leading-none font-serif">
                      “
                    </div>
                    <blockquote className="text-[13px] md:text-xl font-bold text-gray-800 leading-relaxed tracking-tight italic">
                      {currentTestimonial.review}
                    </blockquote>

                    {/* Description - optimized */}
                    <p className="hidden md:block text-[13px] font-medium text-gray-500 mt-2 max-w-lg leading-relaxed">
                      {currentTestimonial.desc}
                    </p>

                    <cite className="text-[9px] md:text-xs font-black text-green-700 mt-2 md:mt-4 uppercase tracking-wider">
                      — {currentTestimonial.name}
                    </cite>
                  </div>

                  {/* Featured Product Banner - Slimmer */}
                  <div className="bg-green-50/50 rounded-lg p-2.5 md:p-3 flex items-center border border-green-100 mt-4 md:mt-6">
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-white rounded-md p-1 shadow-sm mr-3 flex-shrink-0">
                      <img
                        src={currentTestimonial.productImage}
                        alt={currentTestimonial.productName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[7px] md:text-[9px] font-bold uppercase text-green-600/70 mb-0.5">
                        FEATURED
                      </p>
                      <h4 className="text-[9px] md:text-sm font-black text-gray-900 truncate">
                        {currentTestimonial.productName}
                      </h4>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <div className="flex mr-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <IoStarSharp
                              key={i}
                              className={`w-2 h-2 md:w-3 md:h-3 ${i < currentTestimonial.rating
                                ? 'text-yellow-400'
                                : 'text-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-[7px] md:text-[10px] text-gray-400 font-bold whitespace-nowrap uppercase tracking-tighter">
                          {currentTestimonial.ratingsCount}+ Reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 z-20"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-300 z-20"
          >
            <FaChevronRight className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSlider;
