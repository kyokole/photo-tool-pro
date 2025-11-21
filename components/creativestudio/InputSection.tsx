
// components/creativestudio/InputSection.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Feature, FeatureAction, FeatureInput, Concept } from '../../types';
import { FileUpload } from './FileUpload';
import { MultiSelect } from './MultiSelect';
import { SliderInput } from './SliderInput';
import { Spinner } from './Spinner';
import { getHotTrends } from '../../services/creativeStudioService';
import { MALE_HAIRSTYLE_NAMES, FEMALE_HAIRSTYLE_NAMES, YOGA_POSES_BEGINNER, YOGA_POSES_INTERMEDIATE, YOGA_POSES_ADVANCED } from '../../constants/creativeStudioConstants';
import { ConceptInserter } from '../ConceptInserter';

interface InputSectionProps {
  feature: Feature;
  onGenerate: () => void;
  isLoading: boolean;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  numImages: number;
  setNumImages: (num: number) => void;
  usageCount: number;
  concepts: Concept[];
  onInsertConcept: (fieldName: string, tag: string) => void;
  showCreativeTip?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  feature, onGenerate, isLoading, formData, setFormData, numImages, setNumImages, usageCount, concepts, onInsertConcept, showCreativeTip
}) => {
  const { t } = useTranslation();
  const [trends, setTrends] = useState<string[]>([]);
  const [isFetchingTrends, setIsFetchingTrends] = useState(false);
  const [trendError, setTrendError] = useState<string|null>(null);
  
  useEffect(() => {
    setTrends([]);
    setIsFetchingTrends(false);
    setTrendError(null);
  }, [feature.action]);

  useEffect(() => {
      // Reset dependent dropdowns when their controller changes
      if (feature.action === FeatureAction.CHANGE_HAIRSTYLE) {
          handleFormChange('hairstyle', '');
      }
      if (feature.action === FeatureAction.YOGA_STUDIO) {
          handleFormChange('yoga_pose', '');
      }
  }, [formData.gender, formData.pose_level, feature.action]);


  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFetchTrends = async () => {
    setIsFetchingTrends(true);
    setTrendError(null);
    try {
        const fetchedTrends = await getHotTrends();
        setTrends(fetchedTrends);
        handleFormChange('selected_trends', []);
    } catch (err: any) {
        setTrendError(err.message);
    } finally {
        setIsFetchingTrends(false);
    }
  };

  const isSpecialFeature = [FeatureAction.PLACE_IN_SCENE, FeatureAction.CREATE_ALBUM, FeatureAction.BIRTHDAY_PHOTO, FeatureAction.HOT_TREND_PHOTO, FeatureAction.IMAGE_VARIATION_GENERATOR].includes(feature.action);

  const calculateImagesToGenerate = () => {
    if (feature.action === FeatureAction.CREATE_ALBUM) {
        const posesCount = formData.poses?.length || 0;
        const backgroundsCount = formData.backgrounds?.length || 0;
        return posesCount * backgroundsCount;
    }
    if (feature.action === FeatureAction.PLACE_IN_SCENE) {
        const optionsCount = formData.background_options?.length || 0;
        const customPromptCount = formData.custom_background_prompt ? 1 : 0;
        const customImageCount = formData.background_image ? 1 : 0;
        return optionsCount + customPromptCount + customImageCount;
    }
    if (feature.action === FeatureAction.BIRTHDAY_PHOTO) {
        return formData.birthday_scenes?.length || 0;
    }
    if (feature.action === FeatureAction.HOT_TREND_PHOTO) {
        return formData.selected_trends?.length || 0;
    }
    if (feature.action === FeatureAction.IMAGE_VARIATION_GENERATOR) {
        return 4;
    }
    return 0;
  };


  const isGenerateDisabled = () => {
    if (isLoading || usageCount <= 0) return true;

    for (const input of feature.inputs) {
        if (input.required && !formData[input.name]) {
            return true;
        }
    }

    if (feature.action === FeatureAction.CREATIVE_COMPOSITE) {
        return !formData.main_subject?.file || !formData.scene_description;
    }
     if (feature.action === FeatureAction.PLACE_IN_SCENE) {
        return !formData.subject_image || calculateImagesToGenerate() === 0;
    }
    if ([FeatureAction.CREATE_ALBUM, FeatureAction.BIRTHDAY_PHOTO, FeatureAction.HOT_TREND_PHOTO].includes(feature.action)) {
        return !formData.subject_image || calculateImagesToGenerate() === 0;
    }
   
    return false;
  };

  const addComponent = () => {
    const newComponents = [...(formData.additional_components || []), { file: null, description: '' }];
    handleFormChange('additional_components', newComponents);
  };

  const updateComponent = (index: number, field: 'file' | 'description', value: any) => {
     const updatedComponents = [...(formData.additional_components || [])];
     updatedComponents[index] = { ...updatedComponents[index], [field]: value };
     handleFormChange('additional_components', updatedComponents);
  };

  const removeComponent = (index: number) => {
    const updatedComponents = [...(formData.additional_components || [])].filter((_, i) => i !== index);
    handleFormChange('additional_components', updatedComponents);
  };


  const renderInput = (input: FeatureInput) => {
    const { name, label, type } = input;

    switch (type) {
      case 'file':
        return <FileUpload key={name} label={t(label)} file={formData[name] || null} setFile={(file) => handleFormChange(name, file)} />;
      case 'slider':
        return <SliderInput key={name} label={t(label)} value={formData[name] ?? input.default ?? 0} onChange={(val) => handleFormChange(name, val)} min={input.min} max={input.max} step={input.step} />;
      case 'text':
        return (
          <div key={name} className="col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-1">
                <label htmlFor={name} className="block font-semibold text-[var(--text-primary)] mb-2">{t(label)}</label>
                {concepts.length > 0 && <ConceptInserter concepts={concepts} onInsert={(tag) => onInsertConcept(name, tag)} />}
            </div>
            <textarea
              id={name}
              rows={2}
              value={formData[name] || ''}
              onChange={(e) => handleFormChange(name, e.target.value)}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 resize-none transition-all duration-200 focus:border-[var(--ring-color)] focus:ring-2 focus:ring-[var(--ring-color)]/50 focus:shadow-[0_0_15px_var(--accent-blue-glow)]"
              placeholder={input.placeholder ? t(input.placeholder) : undefined}
            />
          </div>
        );
      case 'select': {
        let selectOptions: (string | { value: string; label: string })[] = input.options;
        let isDisabled = false;
        let placeholder = input.placeholder;
        let yogaLevelKeyPart = ''; // Will hold 'beginner', 'intermediate', or 'advanced'
        let hairstyleGenderKey = ''; // Will hold 'male' or 'female'

        // --- Start of dynamic logic ---
        if (feature.action === FeatureAction.CHANGE_HAIRSTYLE && name === 'hairstyle') {
            const genderValue = formData.gender || '';
            const genderInput = feature.inputs.find(i => i.name === 'gender');
            if (genderInput && genderInput.type === 'select') {
                const foundKey = (genderInput.options as string[]).find(key => key === genderValue || t(key) === genderValue);
                if (foundKey) {
                    hairstyleGenderKey = foundKey.split('.').pop() || '';
                }
            }
            
            if (!hairstyleGenderKey) {
                isDisabled = true;
                selectOptions = [];
            } else {
                placeholder = undefined;
                selectOptions = hairstyleGenderKey === 'male' ? MALE_HAIRSTYLE_NAMES : FEMALE_HAIRSTYLE_NAMES;
            }
        }
        
        if (feature.action === FeatureAction.YOGA_STUDIO && name === 'yoga_pose') {
            const levelValue = formData.pose_level || '';
            if (!levelValue) {
                isDisabled = true;
                selectOptions = [];
            } else {
                placeholder = undefined;
                const poseLevelInput = feature.inputs.find(i => i.name === 'pose_level');
                if (poseLevelInput && poseLevelInput.type === 'select') {
                    const foundOptionKey = (poseLevelInput.options as string[]).find(key => key === levelValue || t(key) === levelValue);
                    if (foundOptionKey) {
                        yogaLevelKeyPart = foundOptionKey.split('.').pop() || '';
                    }
                }
                
                if (yogaLevelKeyPart === 'beginner') {
                    selectOptions = YOGA_POSES_BEGINNER;
                } else if (yogaLevelKeyPart === 'intermediate') {
                    selectOptions = YOGA_POSES_INTERMEDIATE;
                } else if (yogaLevelKeyPart === 'advanced') {
                    selectOptions = YOGA_POSES_ADVANCED;
                } else {
                    selectOptions = [];
                }
            }
        }
        // --- End of dynamic logic ---
        
        return (
          <div key={name}>
            <label htmlFor={name} className="block font-semibold text-[var(--text-primary)] mb-2">{t(label)}</label>
            <select 
                id={name} 
                value={formData[name] || ''} 
                onChange={e => handleFormChange(name, e.target.value)} 
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 appearance-none disabled:opacity-50 transition-all duration-200 focus:border-[var(--ring-color)] focus:ring-2 focus:ring-[var(--ring-color)]/50 focus:shadow-[0_0_15px_var(--accent-blue-glow)]"
                disabled={isDisabled}
            >
              {placeholder && <option value="">{t(placeholder)}</option>}
              {selectOptions.map(opt => {
                if (typeof opt === 'string') {
                    let optionKey = opt;
                    let valueAttr = t(optionKey);

                    // For controlling dropdowns, their state value MUST be the key itself.
                    if (
                        (feature.action === FeatureAction.YOGA_STUDIO && name === 'pose_level') ||
                        (feature.action === FeatureAction.CHANGE_HAIRSTYLE && name === 'gender')
                    ) {
                        valueAttr = optionKey;
                    }
                    
                    // For dependent dropdowns, construct the full translation key.
                    if (feature.action === FeatureAction.YOGA_STUDIO && name === 'yoga_pose') {
                        if (yogaLevelKeyPart) {
                            optionKey = `aiStudio.inputs.yoga.poses.${yogaLevelKeyPart}.${opt}`;
                            valueAttr = t(optionKey);
                        }
                    }
                    if (feature.action === FeatureAction.CHANGE_HAIRSTYLE && name === 'hairstyle') {
                        // Here, `opt` is already the full key from the constants array.
                        valueAttr = t(opt);
                    }

                    return <option key={optionKey} value={valueAttr}>{t(optionKey)}</option>;
                }
                // Use opt.value as the actual value sent to the backend, while displaying the translated label.
                // This fixes issues where the prompt needs to be detailed (like Korean studio) but the UI needs to be clean (Vietnamese title).
                return <option key={opt.value} value={opt.value}>{t(opt.label)}</option>;
              })}
            </select>
          </div>
        );
      }
      case 'imageselect':
        return null;
      case 'multiselect':
         return (
            <MultiSelect
                key={name}
                label={t(label)}
                options={input.options.map(opt => ({ key: opt, label: t(opt) }))}
                selected={formData[name] || []}
                onChange={(selected) => handleFormChange(name, selected)}
            />
         );
      case 'checkbox':
        return (
          <div key={name} className="flex items-center justify-center col-span-1 md:col-span-2 lg:col-span-1">
            <input
              type="checkbox"
              id={name}
              checked={formData[name] ?? false}
              onChange={(e) => handleFormChange(name, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[var(--button-primary)] focus:ring-[var(--ring-color)] bg-gray-700"
            />
            <label htmlFor={name} className="ml-2 text-sm font-medium text-[var(--text-secondary)]">{t(label)}</label>
          </div>
        );
      default:
        return null;
    }
  };

  const renderFormContent = () => {
    if (feature.action === FeatureAction.HOT_TREND_PHOTO) {
        const handleTrendSelectionChange = (trend: string) => {
            const currentSelection: string[] = formData.selected_trends || [];
            const newSelection = currentSelection.includes(trend)
                ? currentSelection.filter(t => t !== trend)
                : [...currentSelection, trend];
            handleFormChange('selected_trends', newSelection);
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    {renderInput(feature.inputs[0])}
                </div>
                <div className="space-y-4 p-4 bg-[var(--bg-interactive)] rounded-lg flex flex-col h-full">
                    <button
                        type="button"
                        onClick={handleFetchTrends}
                        disabled={isFetchingTrends}
                        className="w-full bg-[var(--button-secondary)] hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isFetchingTrends ? <Spinner/> : <i className={feature.icon}></i>}
                        <span>{isFetchingTrends ? t('aiStudio.trends.fetching') : t('aiStudio.trends.fetchButton')}</span>
                    </button>
                    {trendError && <p className="text-red-400 text-sm text-center">{trendError}</p>}
                    {trends.length > 0 && (
                       <div className="flex-grow overflow-y-auto max-h-60 pr-2">
                            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">{t('aiStudio.trends.selectLabel')}:</p>
                            <div className="space-y-2">
                                {trends.map(trend => (
                                    <div
                                        key={trend}
                                        onClick={() => handleTrendSelectionChange(trend)}
                                        className="px-3 py-2 cursor-pointer hover:bg-[var(--accent-gradient-start)]/50 flex items-center bg-[var(--bg-primary)]/50 rounded-md transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={(formData.selected_trends || []).includes(trend)}
                                            readOnly
                                            className="h-4 w-4 rounded border-gray-300 text-[var(--button-primary)] focus:ring-[var(--ring-color)] bg-gray-700 mr-3 pointer-events-none"
                                        />
                                        <span className="text-[var(--text-primary)] text-sm">{trend}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                   {renderInput(feature.inputs[1])}
                </div>
            </div>
        )
    }

    if (feature.action === FeatureAction.PLACE_IN_SCENE) {
        return (
             <div className="space-y-6">
                {renderInput(feature.inputs[0])}
                <div className="p-4 bg-[var(--bg-interactive)] rounded-lg space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <h3 className="font-semibold text-center text-[var(--accent-text-start)] mb-2">{t('aiStudio.scene.title')}</h3>
                    </div>
                    {renderInput(feature.inputs[1])}
                    {renderInput(feature.inputs[2])}
                    <div className="md:col-span-2">{renderInput(feature.inputs[3])}</div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {feature.inputs.slice(4).map(renderInput)}
                </div>
            </div>
        )
    }

    if (feature.action === FeatureAction.COUPLE_COMPOSE) {
        return (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 p-4 bg-[var(--bg-interactive)] rounded-lg">
                        <h3 className="font-semibold text-center text-[var(--accent-text-start)]">{t('aiStudio.couple.person1')}</h3>
                        {renderInput(feature.inputs[0])}
                        {renderInput(feature.inputs[1])}
                    </div>
                     <div className="space-y-4 p-4 bg-[var(--bg-interactive)] rounded-lg">
                        <h3 className="font-semibold text-center text-[var(--accent-text-end)]">{t('aiStudio.couple.person2')}</h3>
                        {renderInput(feature.inputs[2])}
                        {renderInput(feature.inputs[3])}
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {feature.inputs.slice(4).map(renderInput)}
                </div>
            </div>
        )
    }

    if(feature.action === FeatureAction.CREATIVE_COMPOSITE){
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <h3 className="font-semibold text-[var(--accent-text-start)] mb-2">{t('aiStudio.composite.mainSubject')}</h3>
                        <FileUpload
                            label={t('aiStudio.composite.uploadMain')}
                            file={formData.main_subject?.file || null}
                            setFile={(file) => handleFormChange('main_subject', { ...formData.main_subject, file })}
                        />
                         <div className="relative mt-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block font-semibold text-[var(--text-primary)] mb-2">{t('aiStudio.composite.mainDesc')}</label>
                                {concepts.length > 0 && <ConceptInserter concepts={concepts} onInsert={(tag) => onInsertConcept('main_subject_description', tag)} />}
                            </div>
                            <input
                                type="text"
                                placeholder={t('aiStudio.composite.mainDescPlaceholder')}
                                value={formData.main_subject_description || ''}
                                onChange={(e) => handleFormChange('main_subject_description', e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2"
                            />
                         </div>
                    </div>
                    <div className="relative">
                         <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-[var(--accent-text-end)]">{t('aiStudio.composite.scene')}</h3>
                            {concepts.length > 0 && <ConceptInserter concepts={concepts} onInsert={(tag) => onInsertConcept('scene_description', tag)} />}
                        </div>
                         {showCreativeTip && (
                            <p className="text-sm mb-2 animated-gradient-text">
                                {t('aiStudio.creativeTip')}
                            </p>
                        )}
                        <textarea
                            rows={showCreativeTip ? 7 : 8}
                            placeholder={t('aiStudio.composite.scenePlaceholder')}
                            value={formData.scene_description || ''}
                            onChange={(e) => handleFormChange('scene_description', e.target.value)}
                            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-3 resize-none"
                         />
                    </div>
                </div>

                <h3 className="font-semibold text-[var(--text-secondary)] pt-4 border-t border-[var(--border-color)]">{t('aiStudio.composite.additional')}</h3>
                {(formData.additional_components || []).map((comp: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-[var(--bg-interactive)] rounded-lg relative">
                        <FileUpload
                            label={`${t('aiStudio.composite.additionalDesc')} ${index + 1}`}
                            file={comp.file}
                            setFile={(file) => updateComponent(index, 'file', file)}
                        />
                        <div className="self-center">
                            <div className="flex justify-between items-center mb-1">
                                 <label className="block font-semibold text-[var(--text-primary)] mb-2">{`${t('aiStudio.composite.additionalDesc')} ${index + 1}`}</label>
                                 {concepts.length > 0 && <ConceptInserter concepts={concepts} onInsert={(tag) => onInsertConcept(`additional_components[${index}].description`, tag)} />}
                            </div>
                            <input
                                type="text"
                                value={comp.description}
                                onChange={(e) => updateComponent(index, 'description', e.target.value)}
                                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2"
                            />
                        </div>
                        <button onClick={() => removeComponent(index)} className="absolute top-2 right-2 text-red-500">&times;</button>
                    </div>
                ))}
                <button onClick={addComponent} className="text-[var(--accent-text-start)] font-semibold">+ {t('aiStudio.composite.add')}</button>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 !mt-6">
                    {renderInput({ type: 'select', label: 'aiStudio.inputs.common.aspectRatio.label', name: 'aspect_ratio', options: ["1:1", "3:4", "4:3", "9:16", "16:9"], default: '4:3' })}
                </div>
            </div>
        )
    }

    if (feature.action === FeatureAction.IMAGE_VARIATION_GENERATOR) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Column 1: Image Upload */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t('imageVariation.sections.upload')}</h3>
                    {feature.inputs.filter(input => input.type === 'file').map(renderInput)}
                </div>
                {/* Column 2: Sliders and Selects */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t('imageVariation.sections.configure')}</h3>
                    {feature.inputs.filter(input => input.type !== 'file').map(renderInput)}
                </div>
            </div>
        )
    }

    const gridCols = [FeatureAction.FASHION_STUDIO, FeatureAction.CREATE_ALBUM, FeatureAction.BIRTHDAY_PHOTO, FeatureAction.CHANGE_HAIRSTYLE, FeatureAction.YOGA_STUDIO].includes(feature.action) ? 3 : 2;
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-4 items-start`}>
        {feature.inputs.map(renderInput)}
      </div>
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onGenerate(); }} className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] backdrop-blur-xl">
      {renderFormContent()}

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
         {!isSpecialFeature ? (
            <div>
                <label htmlFor="num-images" className="text-sm font-semibold text-[var(--text-secondary)] mr-2">{t('aiStudio.numImages')}:</label>
                <select id="num-images" value={numImages} onChange={e => setNumImages(parseInt(e.target.value))} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-2 appearance-none">
                    {[1, 2, 4, 8].map(num => <option key={num} value={num}>{num}</option>)}
                </select>
            </div>
         ) : (
            <div className="text-center text-[var(--accent-text-start)] font-semibold bg-[var(--bg-interactive)] px-4 py-2 rounded-lg">
                {t('aiStudio.generateCount', { count: calculateImagesToGenerate() })}
            </div>
         )}
        <button
          type="submit"
          disabled={isGenerateDisabled()}
          className="btn-gradient text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
        >
          {isLoading && <Spinner />}
          <span className={isLoading ? 'ml-2' : ''}>
            {isLoading ? t('aiStudio.generating') : usageCount <= 0 ? t('aiStudio.noTurns') : t('aiStudio.generate')}
          </span>
        </button>
      </div>
    </form>
  );
};
