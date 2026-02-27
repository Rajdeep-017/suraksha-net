import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
    routeName: string;
    riskPercentage: string;
    onClose: () => void;
}

export const RiskWarningToast = ({ routeName, riskPercentage, onClose }: Props) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // enter animation
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 400);
        }, 6000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <div className="flex items-start gap-3 bg-gradient-to-r from-red-950/95 to-amber-950/95 backdrop-blur-xl border border-red-500/30 rounded-2xl px-5 py-4 shadow-2xl shadow-red-900/30 max-w-md animate-pulse-subtle">
                {/* Icon */}
                <div className="shrink-0 mt-0.5 bg-red-500/20 p-2 rounded-xl">
                    <AlertTriangle size={20} className="text-red-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-300">⚠️ High Risk Route Selected</p>
                    <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                        <span className="font-semibold text-white">{routeName}</span> has{' '}
                        <span className="font-bold text-red-300">{riskPercentage}</span> accident risk.
                        Consider the recommended safer route.
                    </p>
                </div>

                {/* Close */}
                <button
                    onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
                    className="shrink-0 text-red-500/50 hover:text-red-300 transition-colors p-1"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
