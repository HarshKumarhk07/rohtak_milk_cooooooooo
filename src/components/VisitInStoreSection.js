import React from "react";
import { IoLocationOutline } from "react-icons/io5";
import { resolveSectionImage } from "../utils/dairyImageResolver";

const VisitInStoreSection = () => {
  return (
    <section className="w-full bg-gradient-to-br from-white to-gray-50 py-4 md:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl md:rounded-3xl shadow-lg md:shadow-2xl overflow-hidden border border-gray-100">
          {/* Left Section: Image */}
          <div className="w-full md:w-1/2 h-48 md:h-[450px] relative">
            <img
              src={resolveSectionImage('visit')}
              alt="Rohtak Milk Company fresh outlet interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Right Section: Content */}
          <div className="w-full md:w-1/2 p-4 md:p-12 lg:p-16 text-center md:text-left flex flex-col justify-center items-center md:items-start">
            <div className="mb-4 md:mb-6">
              <IoLocationOutline className="text-3xl md:text-5xl text-green-600 mx-auto md:mx-0 mb-2 md:mb-4" />
              <h2 className="text-xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                  Visit Rohtak Milk Company Store: <br className="hidden md:block" /> Experience Quality Live!
              </h2>
            </div>

            <p className="text-sm md:text-lg text-gray-600 mb-6 md:mb-8 max-w-lg">
              Come and explore our range of premium dairy products and farm-fresh milk offerings.
              Visit our outlets to experience quality dairy products and learn about our subscription plans.
            </p>

            <div>
              <a
                href="https://www.google.com/search?q=Rohtak+Milk+Company"
                target="_blank"
                rel="noopener noreferrer"
                className="relative inline-flex items-center justify-center px-6 py-2 md:px-8 md:py-4 text-sm md:text-lg font-semibold
                           bg-green-600 text-white rounded-full shadow-md md:shadow-lg hover:shadow-xl
                           transition-all duration-300 transform hover:-translate-y-1 group
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <span className="relative z-10">Rohtak Milk Company</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitInStoreSection;
