// components/creativestudio/ConceptInserter.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Concept } from '../../types';

interface ConceptInserterProps {
    concepts: Concept[];
    onInsert: (tag: string) => void;
}

export const ConceptInserter: React.FC<ConceptInserterProps> = ({ concepts, onInsert }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const characterConcepts = concepts.filter(c => c.type === 'character');
    const styleConcepts = concepts.filter(c => c.type === 'style');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    if (concepts.length === 0) {
        return null;
    }

    const handleSelect = (concept: Concept) => {
        const tagType = concept.type === 'character' ? 'nhanvat' : 'phongcach';
        onInsert(`[${tagType}:${concept.name}]`);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 font-semibold py-1 px-2 rounded-md flex items-center gap-1"
                title={t('trainer.insertTooltip')}
            >
                <span role="img" aria-hidden="true">🧠</span>
                {t('trainer.insertButton')}
            </button>
            {isOpen && (
                <div className="absolute z-30 right-0 mt-2 w-64 bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {characterConcepts.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-purple-400 px-3 py-2">{t('trainer.character')}</h4>
                            {characterConcepts.map(c => (
                                <div key={c.id} onClick={() => handleSelect(c)} className="px-3 py-2 cursor-pointer hover:bg-purple-600/50 text-white">
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    )}
                     {styleConcepts.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-blue-400 px-3 py-2 border-t border-white/10">{t('trainer.style')}</h4>
                            {styleConcepts.map(c => (
                                <div key={c.id} onClick={() => handleSelect(c)} className="px-3 py-2 cursor-pointer hover:bg-blue-600/50 text-white">
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};