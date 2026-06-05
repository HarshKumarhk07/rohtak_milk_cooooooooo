import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiClient from "../services/apiClient";

// Sensible defaults so the bar is never empty (e.g. before the banners are
// seeded or if the API is briefly unreachable). Admin-managed banners from
// /api/announcements override these once loaded.
const FALLBACK_MESSAGES = [
  { _id: "f1", message: "Get the Subscription", link: "/subscribe" },
  { _id: "f2", message: "Get Fresh Milk Products Daily At Your Doorstep", link: "" },
];

const AnnouncementBanner = () => {
  const [banners, setBanners] = useState(FALLBACK_MESSAGES);

  // Load admin-managed banners (active, in display order).
  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/announcements")
      .then((res) => {
        if (mounted && Array.isArray(res.data) && res.data.length > 0) {
          setBanners(res.data);
        }
      })
      .catch(() => {
        /* keep fallbacks */
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!banners.length) return null;

  // The marquee animates translateX(0 → -50%), so the track must hold the SAME
  // content twice for a seamless loop. With only a couple of short messages a
  // single pass is narrower than the screen and would leave a visible gap, so we
  // repeat the message list enough times to comfortably exceed any viewport
  // width before duplicating it.
  const REPEAT = 8;
  const oneHalf = Array.from({ length: REPEAT }, () => banners).flat();

  const renderSet = (keyPrefix) =>
    oneHalf.map((b, i) => {
      const text = <span className="px-8">{b.message}</span>;
      return b.link ? (
        <Link key={`${keyPrefix}-${i}`} to={b.link} className="hover:underline shrink-0">
          {text}
        </Link>
      ) : (
        <span key={`${keyPrefix}-${i}`} className="shrink-0">
          {text}
        </span>
      );
    });

  return (
    <div className="bg-green-600 text-white py-1.5 text-[9px] md:text-xs font-bold tracking-widest uppercase overflow-hidden relative">
      <div className="flex animate-marquee whitespace-nowrap min-w-max">
        {renderSet("a")}
        {renderSet("b")}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
