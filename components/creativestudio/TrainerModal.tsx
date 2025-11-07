// components/creativestudio/TrainerModal.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Concept } from '../../types';
import { Spinner } from './Spinner';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: Concept[];
  onSave: (concepts: Concept[]) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const TrainerModal: React.FC<TrainerModalProps> = ({ isOpen, onClose, concepts, onSave }) => {
    const { t } = useTranslation();
    const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
    const [view, setView] = useState<'list' | 'form'>('list');

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setView('list');
            setEditingConcept(null);
        }
    }, [isOpen]);

    const handleAddNew = () => {
        setEditingConcept({
            id: `concept_${Date.now()}`,
            name: '',
            type: 'character',
            images: []
        });
        setView('form');
    };
    
    const handleEdit = (concept: Concept) => {
        setEditingConcept(concept);
        setView('form');
    };

    const handleDelete = (conceptId: string) => {
        if(window.confirm(t('trainer.deleteConfirm'))) {
            const updatedConcepts = concepts.filter(c => c.id !== conceptId);
            onSave(updatedConcepts);
        }
    };
    
    const handleSave = () => {
        if (!editingConcept || !editingConcept.name.trim()) {
            alert(t('trainer.nameRequired'));
            return;
        }
        if (editingConcept.images.length < 3) {
            alert(t('trainer.imagesRequired'));
            return;
        }

        const isEditing = concepts.some(c => c.id === editingConcept.id);
        let updatedConcepts: Concept[];

        if (isEditing) {
            updatedConcepts = concepts.map(c => c.id === editingConcept.id ? editingConcept : c);
        } else {
            // Check for duplicate names
            if (concepts.some(c => c.name.toLowerCase() === editingConcept.name.trim().toLowerCase())) {
                alert(t('trainer.nameExists'));
                return;
            }
            updatedConcepts = [...concepts, { ...editingConcept, name: editingConcept.name.trim() }];
        }
        onSave(updatedConcepts);
        setView('list');
        setEditingConcept(null);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && editingConcept) {
            const files = Array.from(e.target.files);
            const base64Promises = files.map(fileToBase64);
            try {
                const base64Images = await Promise.all(base64Promises);
                setEditingConcept({
                    ...editingConcept,
                    images: [...editingConcept.images, ...base64Images]
                });
            } catch (error) {
                console.error("Error converting files to base64", error);
                alert(t('errors.imageUploadFailed'));
            }
        }
    };
    
    const removeImage = (indexToRemove: number) => {
        if (editingConcept) {
            setEditingConcept({
                ...editingConcept,
                images: editingConcept.images.filter((_, index) => index !== indexToRemove)
            });
        }
    };

    const renderListView = () => (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                    {t('trainer.title')}
                </h2>
                <button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">
                    + {t('trainer.newConcept')}
                </button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {concepts.length > 0 ? (
                    <div className="space-y-4">
                        {concepts.map(c => (
                            <div key={c.id} className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-800 rounded-md flex items-center justify-center mr-4">
                                        <img src={`data:image/png;base64,${c.images[0]}`} alt={c.name} className="w-full h-full object-cover rounded-md" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{c.name}</h3>
                                        <p className="text-sm text-gray-400 capitalize">{c.type === 'character' ? t('trainer.character') : t('trainer.style')} - {c.images.length} ảnh</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(c)} className="text-blue-400 hover:text-blue-300">{t('common.edit')}</button>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-400">{t('common.delete')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 h-full flex items-center justify-center">
                        <p>{t('trainer.empty')}</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderFormView = () => {
        if (!editingConcept) return null;
        return (
             <>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                        {concepts.some(c => c.id === editingConcept.id) ? t('trainer.editTitle') : t('trainer.newTitle')}
                    </h2>
                    <div>
                         <button onClick={() => setView('list')} className="text-gray-400 hover:text-white mr-4">{t('common.cancel')}</button>
                         <button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg">{t('common.save')}</button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('trainer.nameLabel')}</label>
                        <input
                            type="text"
                            placeholder={editingConcept.type === 'character' ? 'Vd: Người mẫu Linh' : 'Vd: Phong cách phim cổ điển'}
                            value={editingConcept.name}
                            onChange={e => setEditingConcept({...editingConcept, name: e.target.value})}
                            className="w-full bg-gray-900/50 border border-white/20 rounded-lg p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('trainer.typeLabel')}</label>
                        <div className="flex gap-4">
                             <label className="flex items-center">
                                <input type="radio" name="concept-type" value="character" checked={editingConcept.type === 'character'} onChange={() => setEditingConcept({...editingConcept, type: 'character'})} className="form-radio h-4 w-4 text-purple-600 focus:ring-purple-500"/>
                                <span className="ml-2">{t('trainer.typeCharacter')}</span>
                            </label>
                             <label className="flex items-center">
                                <input type="radio" name="concept-type" value="style" checked={editingConcept.type === 'style'} onChange={() => setEditingConcept({...editingConcept, type: 'style'})} className="form-radio h-4 w-4 text-purple-600 focus:ring-purple-500"/>
                                <span className="ml-2">{t('trainer.typeStyle')}</span>
                            </label>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('trainer.imagesLabel')} ({editingConcept.images.length})</label>
                         <p className="text-xs text-gray-400 mb-2">{t('trainer.imagesHelp')}</p>
                         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                             {editingConcept.images.map((img, index) => (
                                 <div key={index} className="relative group aspect-square">
                                     <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover rounded-md"/>
                                     <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
                                 </div>
                             ))}
                             <label className="aspect-square bg-gray-700/50 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-700/80">
                                 <span className="text-3xl font-light text-gray-400">+</span>
                                 <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                             </label>
                         </div>
                    </div>
                </div>
            </>
        );
    }

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
        <div
          className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] w-full max-w-4xl text-[var(--text-primary)] relative flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] z-20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {view === 'list' ? renderListView() : renderFormView()}

        </div>
      </div>
    );
};