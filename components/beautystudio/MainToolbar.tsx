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
        NEW: 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)]',
    };
    return <span className={`${baseClasses} ${colorClasses[type]}`}>{type}</span>;
};


const FeatureItem: React.FC<{ feature: BeautyFeature; onSelect: () => void; }> = ({ feature, onSelect }) => {
    const { t } = useTranslation();
    return (
        <div
            onClick={onSelect}
            className="flex flex-col items-center justify-start text-center cursor-pointer group space-y-1.5 p-1 flex-shrink-0"
            style={{ minWidth: '70px' }}
        >
            <div className="relative w-14 h-14 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105 border border-[var(--border-color)]">
                <i className={`${feature.icon} text-2xl text-[var(--accent-cyan)]`}></i>
                {feature.badge && <Badge type={feature.badge} />}
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors px-1">{t(feature.labelKey)}</span>
        </div>
    );
};


export const MainToolbar: React.FC<MainToolbarProps> = ({ tools, onToolSelect, isDisabled }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-[var(--bg-component)] rounded-2xl shadow-inner p-2 border border-[var(--border-color)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2 px-3 pt-1">{t('beautyStudio.title')}</h2>
            <div className={`overflow-x-auto overflow-y-hidden pb-2 no-scrollbar ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
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