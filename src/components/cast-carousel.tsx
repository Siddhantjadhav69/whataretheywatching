"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { tmdbImage, type TmdbCastMember } from "@/lib/tmdb";

type CastCarouselProps = {
  cast: TmdbCastMember[];
};

export function CastCarousel({ cast }: CastCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragLimit, setDragLimit] = useState(0);

  useEffect(() => {
    const calculateLimit = () => {
      const rail = railRef.current;

      if (!rail) {
        return;
      }

      setDragLimit(Math.max(rail.scrollWidth - rail.clientWidth, 0));
    };

    calculateLimit();
    window.addEventListener("resize", calculateLimit);

    return () => window.removeEventListener("resize", calculateLimit);
  }, [cast.length]);

  return (
    <div ref={railRef} className="hide-scrollbar overflow-x-auto">
      <motion.div
        drag="x"
        dragConstraints={{ right: 0, left: -dragLimit }}
        dragElastic={0.08}
        whileTap={{ cursor: "grabbing" }}
        className="flex w-max cursor-grab gap-4 pr-4"
      >
        {cast.slice(0, 18).map((member, index) => {
          const profile = tmdbImage(member.profile_path, "w185");

          return (
            <motion.article
              key={`${member.id}-${member.character ?? index}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(index * 0.035, 0.35) }}
              className="w-[138px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]"
            >
              <div className="relative aspect-[3/4] bg-panel">
                {profile ? (
                  <Image
                    src={profile}
                    alt={`${member.name} profile`}
                    fill
                    sizes="138px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center bg-white/[0.04] px-4 text-center text-xs font-bold text-white/35">
                    No Image
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3">
                <h3 className="line-clamp-1 text-sm font-black text-white">{member.name}</h3>
                <p className="line-clamp-2 min-h-8 text-xs leading-4 text-white/45">{member.character}</p>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </div>
  );
}
