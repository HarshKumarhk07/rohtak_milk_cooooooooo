import React, { useState } from "react";

// Popup that shows as soon as the website opens.
const ComingSoonPopup = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm rounded-2xl border-t-4 border-green-600 bg-white p-8 text-center shadow-2xl">
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-3 text-2xl font-bold leading-none text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          &times;
        </button>

        <div className="mb-4 text-5xl">🚚</div>

        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Coming Soon
        </h2>
        <p className="mt-1 text-lg font-bold text-green-700">
          at your doorstep
        </p>

        <p className="mt-4 text-sm text-gray-500">
          We're getting everything ready to bring the freshness of the village
          straight to your home. Stay tuned!
        </p>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-green-600 px-8 py-2.5 font-bold text-white shadow-md transition-all hover:bg-green-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPopup;
