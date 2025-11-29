
// components/CreativeStudio.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './creativestudio/Header';
import { FeatureSelector } from './creativestudio/FeatureSelector';
import { InputSection } from './creativestudio/InputSection';
import { ImageGallery } from './creativestudio/ImageGallery';
import { FEATURES } from '../constants/creativeStudioConstants';
import { FeatureAction, FeatureInput, Concept } from '../types';
import { generateImagesFromFeature } from '../services/creativeStudioService';
import { LibraryModal } from './creativestudio/LibraryModal';
import { TrainerModal } from './TrainerModal';
import { VideoCreatorModal } from './VideoCreatorModal';
import { ThumbnailGenerator } from './creativestudio/ThumbnailGenerator';
import { BatchProcessor } from './batch/BatchProcessor';
import { resizeBase64 } from '../utils/fileUtils'; // Import resize utility

const LIBRARY_KEY = 'ai_studio_library';
const THEME_KEY = 'ai_studio_theme';
const CONCEPTS_KEY = 'ai_studio_concepts';
const MAX_LIBRARY_SIZE = 100;

interface CreativeStudioProps {
    theme: string;
    setTheme: (theme: string) => void;
    initialState?: { image: File, prompt: string } | null;
    onInitialStateConsumed?: () => void;
    isVip: boolean; // Add isVip prop
}

const CreativeStudio: React.FC<CreativeStudioProps> = ({ theme, setTheme, initialState, onInitialStateConsumed, isVip }) => {
    const { t } = useTranslation();
    const [selectedFeature, setSelectedFeature] = useState<FeatureAction>(FeatureAction.BATCH_GENERATOR);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [usageCount, setUsageCount] = useState(20); // Dummy value
    const [numImages, setNumImages] = useState(1);
    const [error, setError] = useState<string | null>(null);
    
    const [library, setLibrary] = useState<string[]>([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const [isTrainerOpen, setIsTrainerOpen] = useState(false);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [isVideoCreatorOpen, setIsVideoCreatorOpen] = useState(false);
    const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
    
    const isProgrammaticChange = useRef(false);
    const [showCreativeTip, setShowCreativeTip] = useState(false);


    useEffect(() => {
        try {
            const storedLibrary = localStorage.getItem(LIBRARY_KEY);
            if (storedLibrary) setLibrary(JSON.parse(storedLibrary));
            const storedConcepts = localStorage.getItem(CONCEPTS_KEY);
            if (storedConcepts) setConcepts(JSON.parse(storedConcepts));
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.error("Failed to save theme to localStorage", error);
        }
    }, [theme]);


    const currentFeature = useMemo(() => FEATURES.find(f => f.action === selectedFeature)!, [selectedFeature]);

    // Effect to handle form reset on MANUAL feature changes
    useEffect(() => {
        if (isProgrammaticChange.current) {
            isProgrammaticChange.current = false; // Reset flag and skip the form reset
            return;
        }

        const defaults: Record<string, any> = {};
        currentFeature.inputs.forEach((input: FeatureInput) => {
            if ('default' in input && input.default !== undefined) {
                if (typeof input.default === 'string') {
                    defaults[input.name] = t(input.default);
                } else {
                    defaults[input.name] = input.default;
                }
            } else if (input.type === 'multiselect') {
                defaults[input.name] = [];
            }
        });
        if (currentFeature.action === FeatureAction.CREATIVE_COMPOSITE) {
            defaults['aspect_ratio'] = '4:3';
        }

        setFormData(defaults);
        setImages([]);
        setError(null);
        setShowCreativeTip(false); // Hide tip on manual feature change
    }, [currentFeature, t]); // Removed initialState from dependencies

    // Effect to handle the initial state transfer from another tool
    useEffect(() => {
        if (initialState && onInitialStateConsumed) {
            console.log("Creative Studio received initial state. Setting up form.");
            
            isProgrammaticChange.current = true;
            setSelectedFeature(FeatureAction.CREATIVE_COMPOSITE);
            
            setFormData({
                main_subject: { file: initialState.image },
                scene_description: initialState.prompt,
                aspect_ratio: '4:3'
            });

            setShowCreativeTip(true); // Show the tip when data is transferred
            
            onInitialStateConsumed();
        }
    }, [initialState, onInitialStateConsumed]);
    
    const handleSaveConcepts = (updatedConcepts: Concept[]) => {
        setConcepts(updatedConcepts);
        try {
            localStorage.setItem(CONCEPTS_KEY, JSON.stringify(updatedConcepts));
        } catch (error) {
            console.error("Failed to save concepts to localStorage", error);
        }
    };

    const handleInsertConcept = (fieldName: string, tag: string) => {
        // For creative composite, descriptions are nested. This is a simplified approach.
        if (fieldName.includes('additional_components')) {
            const match = fieldName.match(/\[(\d+)\]/);
            if(match) {
                const index = parseInt(match[1], 10);
                setFormData(prev => {
                    const newComps = [...(prev.additional_components || [])];
                    if (newComps[index]) {
                        newComps[index] = { ...newComps[index], description: `${newComps[index].description || ''} ${tag}`.trim() };
                    }
                    return { ...prev, additional_components: newComps };
                });
            }
        } else if (fieldName === 'main_subject_description') {
             setFormData(prev => ({
                ...prev,
                main_subject_description: `${prev.main_subject_description || ''} ${tag}`.trim()
            }));
        }
        else {
             setFormData(prev => ({
                ...prev,
                [fieldName]: `${prev[fieldName] || ''} ${tag}`.trim()
            }));
        }
    };

    const handleOpenVideoCreator = (base64Image: string) => {
        setVideoSourceImage(base64Image);
        setIsVideoCreatorOpen(true);
    };

    // UPDATED: Async function to handle compression before saving
    const addToLibrary = async (newImages: string[]) => {
        // Compress images to a smaller size (e.g., 400px width/height) for library storage
        // This drastically reduces size from ~4MB to ~50KB to fit in LocalStorage
        const compressedImages = await Promise.all(
            newImages.map(img => resizeBase64(img, 400))
        );

        setLibrary(prevLibrary => {
            let updatedLibrary = [...compressedImages, ...prevLibrary];
            if (updatedLibrary.length > MAX_LIBRARY_SIZE) {
                updatedLibrary = updatedLibrary.slice(0, MAX_LIBRARY_SIZE);
            }

            // Retry logic in case quota is still full
            while (updatedLibrary.length > 0) {
                try {
                    localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary));
                    return updatedLibrary;
                } catch (error: any) {
                    const isQuotaError =
                        error.name === 'QuotaExceededError' ||
                        (error.code && (error.code === 22 || error.code === 1014));

                    if (isQuotaError) {
                        console.warn(`LocalStorage quota exceeded. Removing oldest image to make space.`);
                        updatedLibrary.pop(); // Remove the oldest image
                    } else {
                        console.error("Failed to save library to localStorage:", error);
                        return prevLibrary; // Abort if unknown error
                    }
                }
            }
            return [];
        });
    };

    const handleDeleteFromLibrary = (indexToDelete: number) => {
        setLibrary(prevLibrary => {
            const updatedLibrary = prevLibrary.filter((_, index) => index !== indexToDelete);
            try {
                localStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary));
            } catch (error) {
                console.error("Failed to update library in localStorage", error);
            }
            return updatedLibrary;
        });
    };

    const calculateImagesToLoad = () => {
        if (selectedFeature === FeatureAction.CREATE_ALBUM) {
            const posesCount = formData.poses?.length || 0;
            const backgroundsCount = formData.backgrounds?.length || 0;
            return posesCount * backgroundsCount;
        }
        if (selectedFeature === FeatureAction.PLACE_IN_SCENE) {
            const optionsCount = formData.background_options?.length || 0;
            const customPromptCount = formData.custom_background_prompt ? 1 : 0;
            const customImageCount = formData.background_image ? 1 : 0;
            return optionsCount + customPromptCount + customImageCount;
        }
        if (selectedFeature === FeatureAction.BIRTHDAY_PHOTO) {
            return formData.birthday_scenes?.length || 0;
        }
        if (selectedFeature === FeatureAction.HOT_TREND_PHOTO) {
            return formData.selected_trends?.length || 0;
        }
        return numImages;
    };


    const handleGenerate = async () => {
        if (!currentFeature) return;

        setIsLoading(true);
        setImages([]);
        setError(null);

        const imagesToGenerate = calculateImagesToLoad();

        try {
            const result = await generateImagesFromFeature(selectedFeature, formData, imagesToGenerate);
            setImages(result.images); // Display High-Res images immediately
            await addToLibrary(result.images); // Compress and Save to History

            if (result.successCount < imagesToGenerate) {
                setError(t('aiStudio.generationError', { successCount: result.successCount, total: imagesToGenerate }));
            }

            setUsageCount(prev => prev - 1);
        } catch (err: any) {
            console.error("Error generating images:", err);
            let errorString = err.message || String(err);
            if (errorString.includes('FUNCTION_INVOCATION_TIMEOUT') || errorString.includes('504')) {
                setError(t('errors.timeout'));
            } else {
                setError(errorString || t('errors.unknownError'));
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderFeatureContent = () => {
        if (selectedFeature === FeatureAction.BATCH_GENERATOR) {
            return <BatchProcessor />;
        }
        if (selectedFeature === FeatureAction.AI_THUMBNAIL_DESIGNER) {
            return <ThumbnailGenerator />;
        }
        return (
            <>
                <InputSection
                    feature={currentFeature}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    formData={formData}
                    setFormData={setFormData}
                    numImages={numImages}
                    setNumImages={setNumImages}
                    usageCount={usageCount}
                    concepts={concepts}
                    onInsertConcept={handleInsertConcept}
                    showCreativeTip={showCreativeTip}
                    isVip={isVip} // Pass isVip
                />
                <div className="mt-8">
                    <ImageGallery 
                        isLoading={isLoading} 
                        images={images} 
                        numImagesToLoad={calculateImagesToLoad()}
                        onOpenVideoCreator={handleOpenVideoCreator}
                    />
                </div>
            </>
        );
    };

    return (
        <div className="relative flex-grow flex flex-col p-4">
            <div
                className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10"
                style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}
            ></div>
            <div className="container mx-auto px-4 py-8 relative z-10 flex-grow flex flex-col">
                <Header 
                    onOpenLibrary={() => setIsLibraryOpen(true)}
                    onOpenTrainer={() => setIsTrainerOpen(true)}
                    currentTheme={theme}
                    onChangeTheme={setTheme}
                />
                <FeatureSelector selectedFeature={selectedFeature} onSelectFeature={setSelectedFeature} />

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center my-4" role="alert">
                        <strong className="font-bold">{t('common.error')}:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}
                
                {renderFeatureContent()}

            </div>
            <LibraryModal
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                images={library}
                onDelete={handleDeleteFromLibrary}
            />
            <TrainerModal
                isOpen={isTrainerOpen}
                onClose={() => setIsTrainerOpen(false)}
                concepts={concepts}
                onSave={handleSaveConcepts}
            />
            <VideoCreatorModal
                isOpen={isVideoCreatorOpen}
                onClose={() => setIsVideoCreatorOpen(false)}
                base64Image={videoSourceImage}
                isVip={isVip}
            />
        </div>
    );
};

export default CreativeStudio;
