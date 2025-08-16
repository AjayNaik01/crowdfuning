import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const ImageSlider = ({ slides, autoSlideInterval = 4000, className = '' }) => {
    const [current, setCurrent] = useState(0);
    const timeoutRef = useRef(null);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    const goToSlide = (idx) => setCurrent(idx);

    useEffect(() => {
        if (slides.length <= 1) return;
        timeoutRef.current = setTimeout(nextSlide, autoSlideInterval);
        return () => clearTimeout(timeoutRef.current);
    }, [current, slides.length, autoSlideInterval]);

    if (!slides || slides.length === 0) return null;

    return (
        <div className={`relative overflow-hidden shadow-lg bg-white ${className}`.trim()}>
            {/* Slides */}
            <div className="relative h-full flex items-center justify-center">
                {slides.map((slide, idx) => (
                    <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        <img
                            src={slide.image}
                            alt={slide.text}
                            className="w-full h-full object-cover object-center"
                            style={{ minHeight: 0, minWidth: 0 }}
                            draggable={false}
                        />
                        {/* Animated Big Quote Overlay */}
                        {idx === current && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                                <span
                                    key={current}
                                    className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white drop-shadow-2xl animate-slide-ltr text-center px-4"
                                    style={{
                                        textShadow: '0 4px 32px rgba(0,0,0,0.7)',
                                        whiteSpace: 'pre-line',
                                        transition: 'opacity 0.5s',
                                        lineHeight: 1.2,
                                        maxWidth: '80vw',
                                    }}
                                >
                                    {slide.text}
                                </span>
                                {/* Static Centered Buttons */}
                                <div className="flex flex-row gap-6 mt-10 pointer-events-auto select-auto">
                                    <Link
                                        to="/register"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition duration-300"
                                    >
                                        Start a Campaign
                                    </Link>
                                    <Link
                                        to="/campaigns"
                                        className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition duration-300"
                                    >
                                        Explore Campaigns
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* Navigation Controls - only dots at bottom center */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20">
                <div className="flex gap-3 items-center">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            className={`transition-all duration-300 rounded-full border-2 focus:outline-none ${idx === current ? 'w-6 h-6 bg-indigo-600 border-indigo-600 shadow-lg scale-125' : 'w-3 h-3 bg-white border-gray-300'}`}
                            onClick={() => goToSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            tabIndex={0}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ImageSlider); 