/**
 * ImageCarousel - Instagram/TikTok-style image carousel for web
 * Features:
 * - Click/swipe navigation between images
 * - Pagination dots indicator
 * - Image counter badge
 * - Keyboard navigation (left/right arrows)
 * - Click to view full screen (optional)
 */

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  height?: number;
  className?: string;
  onImageClick?: (index: number) => void;
}

export function ImageCarousel({
  images,
  height = 300,
  className,
  onImageClick,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered) return;
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, goToNext, goToPrev]);

  // Single image - no carousel needed
  if (images.length === 1) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-lg", className)}
        style={{ height }}
      >
        <img
          src={images[0]}
          alt="Post image"
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onImageClick?.(0)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg group", className)}
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images Container */}
      <div
        className="flex transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="w-full h-full flex-shrink-0"
            style={{ minWidth: "100%" }}
          >
            <img
              src={image}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageClick?.(index)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows - show on hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrev();
            }}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full",
              "bg-black/60 hover:bg-black/80 text-white",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "focus:outline-none focus:ring-2 focus:ring-white/50",
              activeIndex === 0 && "opacity-30 group-hover:opacity-30 cursor-not-allowed"
            )}
            disabled={activeIndex === 0}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full",
              "bg-black/60 hover:bg-black/80 text-white",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "focus:outline-none focus:ring-2 focus:ring-white/50",
              activeIndex === images.length - 1 && "opacity-30 group-hover:opacity-30 cursor-not-allowed"
            )}
            disabled={activeIndex === images.length - 1}
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveIndex(index);
            }}
            className={cn(
              "rounded-full transition-all duration-200",
              "shadow-sm shadow-black/30",
              index === activeIndex
                ? "w-2 h-2 bg-white"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/70"
            )}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image Counter Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full">
        <Images className="h-3.5 w-3.5 text-white" />
        <span className="text-xs font-semibold text-white">
          {activeIndex + 1}/{images.length}
        </span>
      </div>
    </div>
  );
}

export default ImageCarousel;
