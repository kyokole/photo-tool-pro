import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BeautyFeature, BeautyBadgeType } from '../../types';

interface MainToolbarProps {
    tools: BeautyFeature[];
    onToolSelect: (tool: BeautyFeature) => void;
    isDisabled: boolean;
}

const Badge: React.FC<{ type: BeautyBadgeType }> = ({ type }) => {
    const baseClasses = "absolute -top-1 -right-1 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow";
    const colorClasses = {
        Free: 'bg-gradient-to-br from-purple-500 to-pink-500',
        Hot: 'bg-gradient-to-br from-red-500 to-orange-500',
        NEW: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    };
    return <span className={`${baseClasses} ${colorClasses[type]}`}>{type}</span>;
};

const FeatureItem: React.FC<{ feature: BeautyFeature; onSelect: () => void; }> = ({ feature, onSelect }) => (
    <div
        onClick={onSelect}
        className="flex flex-col items-center justify-start text-center cursor-pointer group space-y-1.5 p-1 flex-shrink-0 w-20"
    >
        <div className="relative w-14 h-14 bg-[var(--bg-component)] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
            <div className="w-8 h-8 text-[var(--text-primary)]">{feature.icon}</div>
            {feature.badge && <Badge type={feature.badge} />}
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{feature.label}</span>
    </div>
);

export const BeautyStudioMainToolbar: React.FC<MainToolbarProps> = ({ tools, onToolSelect, isDisabled }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[var(--bg-interactive)] backdrop-blur-sm rounded-2xl shadow-inner p-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2 px-3 pt-1">{t('beautyStudio.toolbar.title')}</h2>
            <div className={`overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-start space-x-1">
                    {tools.map(tool => (
                        <FeatureItem
                            key={tool.id}
                            feature={tool}
                            onSelect={() => onToolSelect(tool)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
