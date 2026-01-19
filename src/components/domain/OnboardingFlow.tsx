import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CreditCard, TrendingUp, Plane, Home, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function OnboardingFlow() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const completeOnboarding = useStore(state => state.completeOnboarding);

    const slides = [
        {
            icon: CreditCard,
            title: '歡迎使用\n信用卡回饋管家',
            description: '幫您快速找出最優信用卡\n輕鬆賺取最高回饋',
            gradient: 'from-indigo-500 to-purple-600',
            iconBg: 'from-indigo-400 to-purple-500',
        },
        {
            icon: Plane,
            title: '雙模式智能切換',
            description: '「旅日模式」計算日圓消費\n「日常模式」處理台幣交易',
            gradient: 'from-blue-500 to-indigo-600',
            iconBg: 'from-blue-400 to-indigo-500',
            demo: 'mode-toggle',
        },
        {
            icon: TrendingUp,
            title: '追蹤回饋進度',
            description: '儲存交易紀錄\n即時監控加碼上限使用狀況',
            gradient: 'from-rose-500 to-pink-600',
            iconBg: 'from-rose-400 to-pink-500',
        },
        {
            icon: Check,
            title: '開始設定您的卡片',
            description: '前往「卡片」頁面\n勾選您實際擁有的信用卡',
            gradient: 'from-emerald-500 to-green-600',
            iconBg: 'from-emerald-400 to-green-500',
            cta: true,
        },
    ];

    const currentSlideData = slides[currentSlide];
    const isLastSlide = currentSlide === slides.length - 1;

    const handleNext = () => {
        if (isLastSlide) {
            completeOnboarding();
        } else {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -left-20 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 -right-20 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
            </div>

            {/* Skip Button */}
            {!isLastSlide && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleSkip}
                    className="absolute top-6 right-6 text-sm text-gray-400 hover:text-gray-600 transition-colors z-10 font-medium"
                >
                    跳過
                </motion.button>
            )}

            {/* Slide Content */}
            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-sm w-full text-center space-y-8"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
                            className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${currentSlideData.iconBg} flex items-center justify-center shadow-2xl shadow-indigo-200/50 relative overflow-hidden`}
                        >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
                            <currentSlideData.icon className="w-14 h-14 text-white relative z-10" strokeWidth={2.5} />
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="text-3xl font-black text-slate-800 whitespace-pre-line leading-tight tracking-tight"
                        >
                            {currentSlideData.title}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="text-gray-600 text-lg whitespace-pre-line leading-relaxed"
                        >
                            {currentSlideData.description}
                        </motion.p>

                        {/* Demo Area - Mode Toggle Animation */}
                        {currentSlideData.demo === 'mode-toggle' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5, type: "spring" }}
                                className="pt-4"
                            >
                                <div className="inline-flex items-center h-11 bg-white/80 backdrop-blur-xl rounded-full p-1.5 shadow-xl shadow-indigo-200/30 border border-white/60">
                                    <motion.div
                                        initial={{ x: 0 }}
                                        animate={{ x: 0 }}
                                        className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                                    >
                                        <Home className="w-3.5 h-3.5" />
                                        日常模式
                                    </motion.div>
                                    <div className="px-5 py-2 text-gray-400 text-xs font-bold flex items-center gap-1.5">
                                        <Plane className="w-3.5 h-3.5" />
                                        旅日模式
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-3">輕觸即可切換模式</p>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 space-y-5 relative z-10 bg-gradient-to-t from-white/50 to-transparent backdrop-blur-sm"
            >
                {/* Dots Indicator */}
                <div className="flex justify-center gap-2.5">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-10 bg-indigo-600 shadow-lg shadow-indigo-300/50'
                                : 'w-2 bg-gray-300 hover:bg-gray-400'
                                }`}
                            aria-label={`前往第 ${index + 1} 頁`}
                        />
                    ))}
                </div>

                {/* Next/Start Button */}
                <button
                    onClick={handleNext}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 bg-gradient-to-r ${currentSlideData.gradient} hover:shadow-2xl relative overflow-hidden group`}
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />

                    <span className="relative z-10 text-base">
                        {isLastSlide ? '開始使用' : '下一步'}
                    </span>
                    <ChevronRight className="w-5 h-5 relative z-10" strokeWidth={3} />
                </button>

                {isLastSlide && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-xs text-gray-400"
                    >
                        您可以隨時在「卡片」頁面管理您的信用卡
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
}
