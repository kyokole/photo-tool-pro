
// FIX: Import 'useMemo' from React to resolve 'Cannot find name' error.
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getAuthInstance, getDbInstance } from './services/firebase';
import type { Settings, HistoryItem, AppMode, HeadshotResult, FilePart, User, AccordionSection, HeadshotStyle, RestorationResult, FashionStudioSettings, FashionStudioResult, IdPhotoJob } from './types';
import { generateIdPhoto, generateHeadshot, generateFashionPhoto } from './services/geminiService';
import { DEFAULT_SETTINGS, RESULT_STAGES_KEYS, DEFAULT_FASHION_STUDIO_SETTINGS, FASHION_FEMALE_STYLES, FASHION_MALE_STYLES, FASHION_GIRL_STYLES, FASHION_BOY_STYLES } from './constants';
import { fileToGenerativePart, fileToResizedDataURL } from './utils/fileUtils';
// import { applyWatermark } from './utils/canvasUtils'; // REMOVED: Backend handles watermarking now
import Sidebar from './components/Sidebar';
import ImagePanes from './components/ImagePanes';
import { ControlPanel } from './components/ControlPanel';
import ActionBar from './components/ActionBar';
import LoadingOverlay from './components/LoadingOverlay';
import UserGuideModal from './components/UserGuideModal';
import AboutModal from './components/AboutModal';
import DonateModal from './components/DonateModal';
import HeadshotGenerator from './components/HeadshotGenerator';
import RestorationTool from './components/RestorationTool';
import FashionStudio from './components/FashionStudio';
import FootballStudio from './components/FootballStudio';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ChangePasswordModal from './components/ChangePasswordModal';
import CreativeStudio from './components/CreativeStudio';
import PromptAnalyzer from './components/PromptAnalyzer';
import { ThemeSelector } from './components/creativestudio/ThemeSelector';
import UpgradeVipModal from './components/SubscriptionExpiredModal';
import BatchProcessor from './components/BatchProcessor';
import FourSeasonsStudio from './components/FourSeasonsStudio';
import LegalModal from './components/LegalModal';
import VerificationModal from './components/VerificationModal';
import BeautyStudio from './components/BeautyStudio';
import HistoryPanel from './components/HistoryPanel';
import FamilyStudio from './components/FamilyStudio'; // Correct default import

const loadSettingsFromSession = (): Settings => {
    try {
        const savedSettings = sessionStorage.getItem('photoToolSettings');
        if (savedSettings) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        }
    } catch (e) {
        console.error("Failed to load settings from session storage", e);
    }
    return DEFAULT_SETTINGS;
};

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // Lấy các instance đã được khởi tạo của Firebase
  const auth = getAuthInstance();
  const db = getDbInstance();

  // ID Photo State
  const [settings, setSettings] = useState<Settings>(loadSettingsFromSession());
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [idPhotoError, setIdPhotoError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);
  const [isResultReady, setIsResultReady] = useState<boolean>(false);
  const [activeWizardSection, setActiveWizardSection] = useState<AccordionSection>('layout');
  const [enabledWizardSections, setEnabledWizardSections] = useState<AccordionSection[]>(['layout']);
  const [isAiCropped, setIsAiCropped] = useState<boolean>(false);
  const [isFreeTierLocked, setIsFreeTierLocked] = useState<boolean>(false);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [idPhotoJobs, setIdPhotoJobs] = useState<IdPhotoJob[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Headshot Generator State
  const [headshotSourceFile, setHeadshotSourceFile] = useState<File | null>(null);
  const [headshotResults, setHeadshotResults] = useState<HeadshotResult[]>([]);
  const [isHeadshotLoading, setIsHeadshotLoading] = useState<boolean>(false);
  const [headshotError, setHeadshotError] = useState<string | null>(null);
  
  // Fashion Studio State
  const [fashionStudioFile, setFashionStudioFile] = useState<File | null>(null);
  const [fashionStudioSettings, setFashionStudioSettings] = useState<FashionStudioSettings>(DEFAULT_FASHION_STUDIO_SETTINGS);
  const [fashionStudioResult, setFashionStudioResult] = useState<FashionStudioResult | null>(null);
  const [isFashionStudioLoading, setIsFashionStudioLoading] = useState<boolean>(false);
  const [fashionStudioError, setFashionStudioError] = useState<string | null>(null);

  // Global State
  const [isGuideVisible, setIsGuideVisible] = useState<boolean>(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState<boolean>(false);
  const [isDonateModalVisible, setIsDonateModalVisible] = useState<boolean>(false);
  const [isSubscriptionModalVisible, setIsSubscriptionModalVisible] = useState<boolean>(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState<boolean>(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState<boolean>(false);
  const [appMode, setAppMode] = useState<AppMode>('headshot');
  const [postLoginRedirect, setPostLoginRedirect] = useState<AppMode | null>(null);
  const [theme, setTheme] = useState<string>('galactic-cobalt');
  const [creativeStudioKey, setCreativeStudioKey] = useState(0);
  const [creativeStudioInitialState, setCreativeStudioInitialState] = useState<{image: File, prompt: string} | null>(null);
  
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState<boolean>(false);
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fileUploadRef = useRef<HTMLInputElement>(null);
  const outfitUploadRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNewRegistration = useRef(false);

  const isVip = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.isAdmin || (new Date(currentUser.subscriptionEndDate) > new Date());
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoading) {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.classList.add('loaded');
            setTimeout(() => {
                preloader.remove();
            }, 500);
        }
    }
  }, [isAuthLoading]);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    auth.languageCode = i18n.language;
  }, [i18n.language, auth]);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const loadAllUsers = useCallback(async () => {
    if (!currentUser?.isAdmin) return;
    try {
        const usersCol = collection(db, "users");
        const userSnapshot = await getDocs(usersCol);
        const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
        setAllUsers(userList);
    } catch (e) {
        console.error("Failed to load all users from Firestore", e);
        setAllUsers([]);
    }
  }, [currentUser?.isAdmin, db]);
  
  const handleAbort = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
  };

  const handleResetIdPhotoTool = useCallback(() => {
    console.log("Resetting ID Photo tool state.");
    handleAbort();
    setOriginalImage(null);
    setProcessedImage(null);
    setHistory([]);
    setIdPhotoError(null);
    setIsGenerating(false);
    setIsResultReady(false);
    setZoom(1);
    setRotation(0);
    setActiveWizardSection('layout');
    setEnabledWizardSections(['layout']);
    setIsAiCropped(false);

    if (!isVip) {
      setIsFreeTierLocked(true);
    }

    setIsPanelVisible(true);
    setIsBatchMode(false);
    setIdPhotoJobs([]);
    setIsBatchProcessing(false);
  }, [isVip]);
  
  const handleResetHeadshotTool = useCallback(() => {
    console.log("Resetting Headshot Generator tool state.");
    handleAbort();
    setHeadshotSourceFile(null);
    setHeadshotResults([]);
    setHeadshotError(null);
    setIsHeadshotLoading(false);
  }, []);

  const handleResetRestorationTool = useCallback(() => {
    console.log("Resetting Restoration tool state (handled by component).");
    handleAbort();
  }, []);
  
  const handleResetFashionStudioTool = useCallback(() => {
      console.log("Resetting Fashion Studio tool state.");
      handleAbort();
      setFashionStudioFile(null);
      setFashionStudioResult(null);
      setFashionStudioError(null);
      setIsFashionStudioLoading(false);
      setFashionStudioSettings(DEFAULT_FASHION_STUDIO_SETTINGS);
  }, []);
  
  const handleResetFootballStudioTool = useCallback(() => {
      console.log("Resetting Football Studio tool state (no-op).");
  }, []);

  const handleResetCreativeStudioTool = useCallback(() => {
    console.log("Resetting AI Studio tool state.");
    handleAbort();
    setCreativeStudioKey(k => k + 1);
  }, []);

  const handleCreativeStudioStateConsumed = useCallback(() => {
    console.log("Initial state consumed by Creative Studio. Clearing it.");
    setCreativeStudioInitialState(null);
  }, []);
  
  const handleResetPromptAnalyzerTool = useCallback(() => {
      console.log("Resetting Prompt Analyzer tool state (no-op).");
  }, []);

  const handleResetFourSeasonsTool = useCallback(() => {
    console.log("Resetting Four Seasons tool state (no-op).");
    handleAbort();
  }, []);
  
  const handleResetBeautyStudioTool = useCallback(() => {
    console.log("Resetting Beauty Studio tool state.");
    handleAbort();
    // Logic will be added as the component is built out
  }, []);
  
  const handleResetFamilyStudioTool = useCallback(() => {
    console.log("Resetting Family Studio tool state.");
    handleAbort();
    // Logic for this new tool will be added here
  }, []);


  const resetAllTools = useCallback(() => {
    handleAbort();
    handleResetIdPhotoTool();
    handleResetHeadshotTool();
    handleResetRestorationTool();
    handleResetCreativeStudioTool();
    handleResetPromptAnalyzerTool();
    handleResetFootballStudioTool();
    handleResetFourSeasonsTool();
    handleResetBeautyStudioTool();
    handleResetFamilyStudioTool();
    setIsFreeTierLocked(false);
  }, [handleResetIdPhotoTool, handleResetHeadshotTool, handleResetRestorationTool, handleResetCreativeStudioTool, handleResetPromptAnalyzerTool, handleResetFootballStudioTool, handleResetFourSeasonsTool, handleResetBeautyStudioTool, handleResetFamilyStudioTool]);

  const handleModeChange = useCallback((newMode: AppMode) => {
    handleAbort();
    resetAllTools();
    setAppMode(newMode);
  }, [resetAllTools]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setIsAuthLoading(true);

        if (!user) {
            setCurrentUser(null);
            setIsVerificationModalVisible(false);
            setIsAuthLoading(false);
            return;
        }

        try {
            // Luôn cố gắng đọc hồ sơ người dùng từ Firestore trước.
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            let userData = userDoc.exists() ? userDoc.data() : null;
            const isDbAdmin = userData?.isAdmin === true;

            // Bây giờ, kiểm tra email đã xác thực hay chưa *trừ khi* người dùng là admin.
            await user.reload(); // Tải lại để lấy trạng thái emailVerified mới nhất
            if (!user.emailVerified && !isDbAdmin) {
                if (isNewRegistration.current) {
                    await sendEmailVerification(user);
                    isNewRegistration.current = false; // Đặt lại cờ sau khi gửi
                }
                setIsVerificationModalVisible(true);
                setIsAuthLoading(false);
                return; // Dừng ở đây và hiển thị modal xác thực cho người dùng không phải admin
            }
            
            // Nếu đến được đây, người dùng là admin HOẶC là người dùng thường đã xác thực.
            setIsVerificationModalVisible(false);

            if (!userData) { // Tương ứng với !userDoc.exists() trước đó
                // Logic mô hình Freemium: Người dùng mới không có thời gian dùng thử.
                // Ngày hết hạn được đặt thành một ngày trong quá khứ.
                const expiryDate = new Date(0); // 1970-01-01

                userData = {
                    username: user.email!,
                    subscriptionEndDate: expiryDate.toISOString(),
                    isAdmin: false, // Người dùng mới không bao giờ là admin
                };
                await setDoc(userDocRef, userData);

            } else {
                 if (!userData) {
                    throw new Error(`Tài liệu hồ sơ người dùng bị rỗng (UID: ${user.uid}). Vui lòng liên hệ hỗ trợ.`);
                }
            }

            const appUser: User = {
                uid: user.uid,
                username: user.email!,
                isAdmin: userData.isAdmin,
                subscriptionEndDate: userData.subscriptionEndDate,
                providerId: user.providerData?.[0]?.providerId
            };

            setCurrentUser(appUser);
            setIsAuthModalVisible(false);

            if (postLoginRedirect) {
                const vipModes: AppMode[] = ['restoration', 'fashion_studio', 'football_studio', 'creative_studio', 'prompt_analyzer', 'four_seasons_studio', 'beauty_studio', 'family_studio'];
                const targetIsVipTool = vipModes.includes(postLoginRedirect);
                const userIsVip = appUser.isAdmin || (new Date(appUser.subscriptionEndDate) > new Date());

                if (targetIsVipTool && !userIsVip) {
                    // User tries to access a VIP tool but isn't VIP. Show modal, don't redirect.
                    setIsSubscriptionModalVisible(true);
                } else {
                    // User is VIP or the tool is free, proceed with redirect.
                    handleModeChange(postLoginRedirect);
                }
                setPostLoginRedirect(null); // Clear the redirect request regardless.
            }

        } catch (e: any) {
            console.error("Lỗi xác thực nghiêm trọng (Firestore):", e);
            
            let userMessage = t('errors.authError');
            if (e.code === 'permission-denied' || (e.message && (e.message.toLowerCase().includes('permission-denied') || e.message.toLowerCase().includes('insufficient permissions')))) {
                userMessage = t('errors.firestorePermissionDenied'); 
            } else if (e.message) {
                userMessage = e.message;
            }

            alert(`${t('errors.loginFailedServer')}: ${userMessage}\n\n${t('errors.loginFailedHelp')}`);
            
            await signOut(auth);
            
        } finally {
            setIsAuthLoading(false);
        }
    });

    return () => unsubscribe();
  }, [auth, db, handleModeChange, postLoginRedirect, t]);


  useEffect(() => {
    if (currentUser?.isAdmin) {
        loadAllUsers();
    }
  }, [currentUser, loadAllUsers]);

  useEffect(() => {
    if (appMode === 'admin' && !currentUser?.isAdmin) {
      setAppMode('headshot');
    }
  }, [appMode, currentUser]);

  const handleGenerate = useCallback(async (settingsOverride?: Partial<Settings>) => {
    if (!originalImage) {
      setIdPhotoError(t('errors.uploadRequired'));
      return;
    }
    
    const currentSettings = { ...settings, ...settingsOverride };

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGenerating(true);
    setIsResultReady(false);
    setIdPhotoError(null);
    setZoom(1);
    setRotation(0);
    setIsAiCropped(false);
    
    try {
      let outfitImagePart: FilePart | undefined = undefined;
      if (currentSettings.outfit.mode === 'upload' && currentSettings.outfit.uploadedFile) {
          const result = await fileToGenerativePart(currentSettings.outfit.uploadedFile);
          if (result) {
              outfitImagePart = result;
          } else {
              throw new Error(t('errors.outfitFileError'));
          }
      }
      
      const finalImageFromServer = await generateIdPhoto(originalImage, currentSettings, signal, outfitImagePart);
      
      // CLIENT WATERMARK REMOVED: Backend handles it
      const finalImage = finalImageFromServer;

      setIsAiCropped(true); // Since the server handles the crop, we can consider it AI-cropped immediately.

      const newHistoryItem: HistoryItem = { image: finalImage, settings: { ...currentSettings } };
      setHistory(prev => [...prev, newHistoryItem]);
      setProcessedImage(finalImage);
      setIsResultReady(true);
      setIsPanelVisible(true);
      if (!isVip) {
        setIsFreeTierLocked(true);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
         console.log('Generation was aborted by the user.');
         setIdPhotoError(t('errors.generationCancelled'));
      } else {
        // Robust error extraction to catch Google's 500 error JSON string
        const errorMsg = err instanceof Error ? err.message : String(err);
        let errorStringForSearch = '';
        try {
            errorStringForSearch = (JSON.stringify(err) + ' ' + errorMsg).toLowerCase();
        } catch {
            errorStringForSearch = errorMsg.toLowerCase();
        }

        console.error("Generation failed with error:", errorStringForSearch);

        if (errorStringForSearch.includes('429') && (errorStringForSearch.includes('resource_exhausted') || errorStringForSearch.includes('rate limit'))) {
            setIdPhotoError(t('errors.quotaExceeded'));
        } else if (errorStringForSearch.includes('api_key_invalid') || errorStringForSearch.includes('api key not valid')) {
            setIdPhotoError(t('errors.apiKeyInvalid'));
        } else if (errorStringForSearch.includes('function_invocation_timeout') || errorStringForSearch.includes('504')) {
            setIdPhotoError(t('errors.timeout'));
        } else if (errorStringForSearch.includes('"code":500') || errorStringForSearch.includes('internal') || errorStringForSearch.includes('an internal error has occurred')) {
            // Check for Google Internal Server Error
            setIdPhotoError(t('errors.generationOverloaded'));
        } else {
            const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
            setIdPhotoError(t('errors.generationFailed', { error: displayMessage }));
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [originalImage, settings, t, isVip]);

  const processSingleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        const errorMsg = t('errors.invalidImageFile');
        if (appMode === 'id_photo') setIdPhotoError(errorMsg);
        else if (appMode === 'headshot') setHeadshotError(errorMsg);
        else if (appMode === 'fashion_studio') setFashionStudioError(errorMsg);
        return;
    }
    
    if (appMode === 'id_photo') {
        try {
            const resizedDataUrl = await fileToResizedDataURL(file);
            handleAbort();
            setProcessedImage(null);
            setHistory([]);
            setIdPhotoError(null);
            setIsGenerating(false);
            setIsResultReady(false);
            setZoom(1);
            setRotation(0);
            setActiveWizardSection('layout');
            setEnabledWizardSections(['layout']);
            setIsAiCropped(false);
            setIsBatchMode(false);
            setOriginalImage(resizedDataUrl);
            setIsFreeTierLocked(false);

            if (!isVip) {
                setIsPanelVisible(false);
            }
        } catch (error) {
            console.error("Failed to resize image for ID Photo tool", error);
            setIdPhotoError(t('errors.fileProcessingError'));
        }
    } else if (appMode === 'headshot') {
        handleResetHeadshotTool();
        setHeadshotSourceFile(file);
    } else if (appMode === 'fashion_studio') {
        handleResetFashionStudioTool();
        setFashionStudioFile(file);
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const createJobsFromFileList = (fileList: FileList): IdPhotoJob[] => {
        return Array.from(fileList).map((file, index) => {
            if (!file.type.startsWith('image/')) {
                setIdPhotoError(t('errors.invalidImageFile'));
                return null;
            }
            return {
                id: `${Date.now()}-${index}`,
                file,
                originalUrl: URL.createObjectURL(file),
                processedUrl: null,
                status: 'pending',
            };
        }).filter(Boolean) as IdPhotoJob[];
    };
    
    if (appMode === 'id_photo') {
        if (isBatchMode) {
            const newJobs = createJobsFromFileList(files);
            if(newJobs.length > 0) {
              setIdPhotoJobs(prevJobs => [...prevJobs, ...newJobs]);
            }
        } else if (files.length > 1) {
             if (!isVip) {
                if (!currentUser) {
                    setPostLoginRedirect('id_photo');
                    setIsAuthModalVisible(true);
                } else {
                    setIsSubscriptionModalVisible(true);
                }

                if (fileUploadRef.current) {
                    fileUploadRef.current.value = '';
                }
                return;
            }
            handleResetIdPhotoTool();
            setIsBatchMode(true);
            const jobs = createJobsFromFileList(files);
            if (jobs.length !== files.length) {
                setIsBatchMode(false);
                setIdPhotoJobs([]);
            } else {
                setIdPhotoJobs(jobs);
            }
        } else {
            processSingleFile(files[0]);
        }
    } else {
        processSingleFile(files[0]);
    }
  };

  const handleRemoveIdPhotoJob = (jobId: string) => {
    setIdPhotoJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };


  const handleGenerateBatch = useCallback(async () => {
    if (!isVip) {
        alert("Batch processing is a VIP feature.");
        return;
    }
    setIsBatchProcessing(true);
    setIdPhotoError(null);

    const newJobs = [...idPhotoJobs];

    for (let i = 0; i < newJobs.length; i++) {
        const job = newJobs[i];
        if (job.status === 'pending') {
            try {
                job.status = 'processing';
                setIdPhotoJobs([...newJobs]);
                
                const originalImageBase64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(job.file);
                });

                // Watermarking is not applied in batch mode (server handles it if needed, but VIP only anyway)
                const finalImage = await generateIdPhoto(originalImageBase64, settings);

                job.processedUrl = finalImage;
                job.status = 'done';

            } catch (err) {
                job.status = 'error';
                const errorMsg = err instanceof Error ? err.message : String(err);
                let errorStringForSearch = '';
                try {
                    errorStringForSearch = (JSON.stringify(err) + ' ' + errorMsg).toLowerCase();
                } catch {
                    errorStringForSearch = errorMsg.toLowerCase();
                }

                if (errorStringForSearch.includes('function_invocation_timeout') || errorStringForSearch.includes('504')) {
                    job.error = t('errors.timeout');
                } else if (errorStringForSearch.includes('"code":500') || errorStringForSearch.includes('internal') || errorStringForSearch.includes('an internal error has occurred')) {
                    job.error = t('errors.generationOverloaded');
                } else {
                    job.error = err instanceof Error ? err.message : t('errors.unknownError');
                }
            } finally {
                setIdPhotoJobs([...newJobs]);
            }
        }
    }

    setIsBatchProcessing(false);
}, [idPhotoJobs, settings, isVip, t]);


  const handleGenerateHeadshots = useCallback(async (file: File, style: HeadshotStyle) => {
    if (!file || !style) return;
    
    handleResetHeadshotTool();
    setHeadshotSourceFile(file);
    setIsHeadshotLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
        const imagePart: FilePart | null = await fileToGenerativePart(file);
        if (!imagePart) {
            throw new Error(t('errors.fileConversionError'));
        }

        const generationPromises = Array(4).fill(0).map(() => 
            generateHeadshot(imagePart, style.prompt, abortControllerRef.current?.signal)
        );
        
        const generatedImagesFromServer = await Promise.all(generationPromises);

        // CLIENT WATERMARK REMOVED: Backend handles it
        const finalImages = generatedImagesFromServer;

        setHeadshotResults(finalImages.map((url, index) => ({
            id: `${style.id}-${index}-${Date.now()}`,
            imageUrl: url
        })));

    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.log('Headshot generation was aborted by the user.');
            setHeadshotError(t('errors.generationCancelled'));
        } else {
            const errorMsg = err instanceof Error ? err.message : String(err);
            let errorStringForSearch = '';
            try {
                errorStringForSearch = (JSON.stringify(err) + ' ' + errorMsg).toLowerCase();
            } catch {
                errorStringForSearch = errorMsg.toLowerCase();
            }
    
            console.error("Headshot generation failed with error:", errorStringForSearch);
    
            if (errorStringForSearch.includes('429') && (errorStringForSearch.includes('resource_exhausted') || errorStringForSearch.includes('rate limit'))) {
                setHeadshotError(t('errors.quotaExceeded'));
            } else if (errorStringForSearch.includes('api_key_invalid') || errorStringForSearch.includes('api key not valid')) {
                setHeadshotError(t('errors.apiKeyInvalid'));
            } else if (errorStringForSearch.includes('function_invocation_timeout') || errorStringForSearch.includes('504')) {
                setHeadshotError(t('errors.timeout'));
            } else if (errorStringForSearch.includes('"code":500') || errorStringForSearch.includes('internal') || errorStringForSearch.includes('an internal error has occurred')) {
                setHeadshotError(t('errors.generationOverloaded'));
            } else {
                const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
                setHeadshotError(t('errors.headshotGenerationFailed', { error: displayMessage }));
            }
        }
    } finally {
        setIsHeadshotLoading(false);
        abortControllerRef.current = null;
    }
  }, [handleResetHeadshotTool, t, isVip]);

  const handleGenerateFashionPhoto = useCallback(async () => {
      if (!fashionStudioFile) {
        setFashionStudioError(t('errors.uploadRequired'));
        return;
      }

      setIsFashionStudioLoading(true);
      setFashionStudioError(null);
      setFashionStudioResult(null);
      abortControllerRef.current = new AbortController();
      
      try {
        const imagePart = await fileToGenerativePart(fashionStudioFile);
        if (!imagePart) throw new Error(t('errors.fileProcessingError'));

        // Since Fashion Studio is a VIP feature, no watermarking is needed here.
        // But if it were needed, backend would handle it.
        const imageUrl = await generateFashionPhoto(imagePart, fashionStudioSettings, abortControllerRef.current.signal);
        
        setFashionStudioResult({
          id: `fashion-${Date.now()}`,
          imageUrl: imageUrl,
        });

      } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
              console.log('Fashion Studio generation was aborted.');
              setFashionStudioError(t('errors.generationCancelled'));
          } else {
            const errorMsg = err instanceof Error ? err.message : String(err);
            let errorStringForSearch = '';
            try {
                errorStringForSearch = (JSON.stringify(err) + ' ' + errorMsg).toLowerCase();
            } catch {
                errorStringForSearch = errorMsg.toLowerCase();
            }
    
            console.error("Fashion Studio generation failed with error:", errorStringForSearch);
    
            if (errorStringForSearch.includes('429') && (errorStringForSearch.includes('resource_exhausted') || errorStringForSearch.includes('rate limit'))) {
                setFashionStudioError(t('errors.quotaExceeded'));
            } else if (errorStringForSearch.includes('api_key_invalid') || errorStringForSearch.includes('api key not valid')) {
                setFashionStudioError(t('errors.apiKeyInvalid'));
            } else if (errorStringForSearch.includes('function_invocation_timeout') || errorStringForSearch.includes('504')) {
                setFashionStudioError(t('errors.timeout'));
            } else if (errorStringForSearch.includes('"code":500') || errorStringForSearch.includes('internal') || errorStringForSearch.includes('an internal error has occurred')) {
                setFashionStudioError(t('errors.generationOverloaded'));
            } else {
                const displayMessage = err instanceof Error ? err.message : t('errors.unknownError');
                setFashionStudioError(t('errors.generationFailed', { error: displayMessage }));
            }
          }
      } finally {
          setIsFashionStudioLoading(false);
          abortControllerRef.current = null;
      }
  }, [fashionStudioFile, fashionStudioSettings, t]);

  // ... (rest of the file including renderContent and JSX)
  // Ensure all functions match the original file content structure
  const handleFashionSettingsChange = useCallback((updater: React.SetStateAction<FashionStudioSettings>) => {
    setFashionStudioSettings(prevSettings => {
        const newSettings = typeof updater === 'function' ? updater(prevSettings) : updater;
        if (newSettings.category !== prevSettings.category) {
            let newStyle = '';
            if (newSettings.category === 'female') newStyle = FASHION_FEMALE_STYLES[0].promptValue;
            else if (newSettings.category === 'male') newStyle = FASHION_MALE_STYLES[0].promptValue;
            else if (newSettings.category === 'girl') newStyle = FASHION_GIRL_STYLES[0].promptValue;
            else if (newSettings.category === 'boy') newStyle = FASHION_BOY_STYLES[0].promptValue;
            return { ...newSettings, style: newStyle };
        }
        return newSettings;
    });
  }, []);

    const handleLogin = (email: string, password: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                resolve();
            } catch (error: any) {
                let errorMessage;
                switch (error.code) {
                    case 'auth/user-disabled':
                        errorMessage = t('errors.userDisabled');
                        break;
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                    case 'auth/user-not-found':
                        errorMessage = t('errors.invalidCredential');
                        break;
                    default:
                        errorMessage = error.message || t('errors.unknownError');
                        break;
                }
                reject(new Error(errorMessage));
            }
        });
    };
    
    const handleRegister = (email: string, password: string): Promise<void> => {
        return new Promise(async (resolve, reject) => {
             try {
                isNewRegistration.current = true;
                await createUserWithEmailAndPassword(auth, email, password);
                resolve();
            } catch (error: any) {
                 isNewRegistration.current = false;
                 let errorMessage;
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = t('auth.emailAlreadyInUse');
                        break;
                    case 'auth/weak-password':
                        errorMessage = t('errors.passwordTooShort');
                        break;
                    default:
                        errorMessage = error.message || t('errors.unknownError');
                        break;
                }
                reject(new Error(errorMessage));
            }
        });
    };

  const handleGoogleSignIn = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };
  
  const handleResendVerification = async (): Promise<void> => {
    const user = auth.currentUser;
    if(user) {
        await sendEmailVerification(user);
    }
  };

  const handleForgotPassword = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
  };

  const handleChangePassword = (oldPassword: string, newPassword: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const user = auth.currentUser;
        if (!user || !user.email) {
            return reject(new Error(t('errors.mustBeLoggedIn')));
        }
    
        try {
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            resolve();
        } catch (error: any) {
            console.error("Failed to change password:", error);
            if(error.code === 'auth/wrong-password'){
                reject(new Error(t('errors.incorrectOldPassword')))
            } else {
                 reject(new Error(error.message || t('errors.systemErrorPasswordChange')));
            }
        }
    });
  };


  const handleLogout = async () => {
    try {
        await signOut(auth);
        setAppMode('headshot');
        resetAllTools();
    } catch (error) {
        console.error("Logout failed:", error);
    }
  };

  const handleGrantSubscription = useCallback(async (uid: string, daysToAdd: number) => {
    if (!currentUser?.isAdmin) return;
    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) throw new Error("User not found");
        
        const userData = userDoc.data()!;
        const currentEndDate = new Date(userData.subscriptionEndDate);
        const now = new Date();
        const startDate = currentEndDate > now ? currentEndDate : now;
        const newExpiryDate = new Date(startDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + daysToAdd);

        await updateDoc(userDocRef, {
            subscriptionEndDate: newExpiryDate.toISOString()
        });
        loadAllUsers(); // Refresh the user list
    } catch (e) {
        console.error("Failed to grant subscription:", e);
        alert(t('errors.saveUserError'));
    }
  }, [currentUser, loadAllUsers, t, db]);

  const handleToggleAdmin = useCallback(async (uid: string) => {
    if (!currentUser?.isAdmin || currentUser.uid === uid) {
        alert(t('errors.cannotChangeOwnAdmin'));
        return;
    }
    try {
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) throw new Error("User not found");

        const isNowAdmin = !userDoc.data()!.isAdmin;
        const newSubscriptionDate = isNowAdmin
            ? new Date(8640000000000000).toISOString()
            : new Date().toISOString();

        await updateDoc(userDocRef, {
            isAdmin: isNowAdmin,
            subscriptionEndDate: newSubscriptionDate
        });
        loadAllUsers();
    } catch (e) {
        console.error("Failed to toggle admin status:", e);
        alert(t('errors.saveUserError'));
    }
  }, [currentUser, loadAllUsers, t, db]);


  const handleResetUserPassword = useCallback(async (email: string): Promise<void> => {
    if (!currentUser?.isAdmin) {
        throw new Error(t('errors.noAdminRights'));
    }
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
        console.error("Failed to send password reset email by admin:", error);
        if (error.code === 'auth/user-not-found') {
             throw new Error(t('auth.userNotFound'));
        }
        throw new Error(t('errors.passwordResetError'));
    }
  }, [currentUser, t, auth]);

  const handleIdPhotoSelect = () => {
    if (appMode !== 'id_photo') handleModeChange('id_photo');
  };

  const handleFashionStudioSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'fashion_studio') handleModeChange('fashion_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('fashion_studio');
        setIsAuthModalVisible(true);
    }
  };
  
  const handleFootballStudioSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'football_studio') handleModeChange('football_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('football_studio');
        setIsAuthModalVisible(true);
    }
  };

  const handleHeadshotSelect = () => {
    if (appMode !== 'headshot') handleModeChange('headshot');
  };
  
  const handleRestorationSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'restoration') handleModeChange('restoration');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('restoration');
        setIsAuthModalVisible(true);
    }
  };
  
  const handleBeautyStudioSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'beauty_studio') handleModeChange('beauty_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('beauty_studio');
        setIsAuthModalVisible(true);
    }
  };

  const handleCreativeStudioSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'creative_studio') handleModeChange('creative_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('creative_studio');
        setIsAuthModalVisible(true);
    }
  };
  
  const handlePromptAnalyzerSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'prompt_analyzer') handleModeChange('prompt_analyzer');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('prompt_analyzer');
        setIsAuthModalVisible(true);
    }
  };

  const handleFourSeasonsSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'four_seasons_studio') handleModeChange('four_seasons_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('four_seasons_studio');
        setIsAuthModalVisible(true);
    }
  };
  
  const handleFamilyStudioSelect = () => {
    if (currentUser) {
        if (isVip) {
            if (appMode !== 'family_studio') handleModeChange('family_studio');
        } else {
            setIsSubscriptionModalVisible(true);
        }
    } else {
        setPostLoginRedirect('family_studio');
        setIsAuthModalVisible(true);
    }
  };

  const handleAdminPanelSelect = () => {
    if (currentUser?.isAdmin) {
        handleAbort();
        setAppMode('admin');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
  };
  
  const triggerUpload = () => {
    if (fileUploadRef.current) {
        fileUploadRef.current.value = '';
        fileUploadRef.current.click();
    }
  };

  const handleNewUploadRequest = () => {
      const isBusy = isGenerating || isHeadshotLoading || isFashionStudioLoading;
      if (isBusy) {
          if(window.confirm(t('confirmations.cancelInProgress'))) {
              triggerUpload();
          }
      } else {
          triggerUpload();
      }
  };

  useEffect(() => {
    try {
        const { uploadedFile, ...restOfOutfit } = settings.outfit;
        const savableSettings = { ...settings, outfit: restOfOutfit };
        sessionStorage.setItem('photoToolSettings', JSON.stringify(savableSettings));
    } catch (e) {
        console.error("Failed to save settings to session storage", e);
    }
  }, [settings]);

   useEffect(() => {
    const preventDefaults = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.body.addEventListener(eventName, preventDefaults);
    });
    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.removeEventListener(eventName, preventDefaults);
      });
    };
  }, []);

  const handleDestructiveSettingChange = (updater: React.SetStateAction<Settings>) => {
    setIsResultReady(false);
    setSettings(updater);
  };

  const handlePrintSettingChange = (updater: React.SetStateAction<Settings>) => {
    setSettings(updater);
  };

  const handlePresetSelect = (presetSettings: Partial<Settings>) => {
    const newSettings = { ...settings, ...presetSettings };
    setSettings(newSettings);
    setActiveWizardSection('face');
    handleGenerate(presetSettings);
  };
  
  const triggerOutfitUpload = () => {
    if (outfitUploadRef.current) {
        outfitUploadRef.current.value = '';
        outfitUploadRef.current.click();
    }
  };
  
  const handleSetActiveWizardSection = (section: AccordionSection) => {
    setActiveWizardSection(section);
    setEnabledWizardSections(prev => {
        const sectionOrder: AccordionSection[] = ['layout', 'background', 'outfit', 'face'];
        const enabledSet = new Set(prev);
        enabledSet.add(section);
        
        const currentSectionIndex = sectionOrder.indexOf(section);
        if (currentSectionIndex !== -1) {
            for(let i = 0; i <= currentSectionIndex; i++) {
                enabledSet.add(sectionOrder[i]);
            }
        }
        return Array.from(enabledSet);
    });
  };

  const handleOutfitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          handleDestructiveSettingChange(prev => ({
              ...prev,
              outfit: {
                  ...prev.outfit,
                  mode: 'upload', 
                  uploadedFile: file
              }
          }));
          handleSetActiveWizardSection('face');
      }
  };

  const handleClearOutfitFile = () => {
      handleDestructiveSettingChange(prev => ({
          ...prev,
          outfit: {
              ...prev.outfit,
              uploadedFile: null
          }
      }));
  };

  const handleUndo = () => {
    if (history.length > 1) {
        const newHistory = history.slice(0, -1);
        const lastItem = newHistory[newHistory.length - 1];
        setHistory(newHistory);
        setProcessedImage(lastItem.image);
        setSettings(lastItem.settings);
        setIsResultReady(true);
    } else if (history.length === 1) {
        setHistory([]);
        setProcessedImage(null);
        setIsResultReady(false);
    }
  };

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setProcessedImage(item.image);
    setSettings(item.settings);
    setIsResultReady(true);
  }, []);

  const handleSelectOriginal = useCallback(() => {
    setProcessedImage(null);
    setIsResultReady(false);
    setSettings(loadSettingsFromSession());
    setActiveWizardSection('layout');
    setEnabledWizardSections(['layout']);
    setIsAiCropped(false);
    if (!isVip) {
      setIsFreeTierLocked(false);
    }
  }, [isVip]);

  const handleClearHistory = useCallback(() => {
    if (window.confirm(t('history.clearConfirmation'))) {
        setHistory([]);
        setProcessedImage(null);
        setIsResultReady(false);
        if (!isVip) {
          setIsFreeTierLocked(false);
        }
    }
  }, [t, isVip]);

  const handleOpenDonateModal = () => {
    setIsAboutModalVisible(false);
    setIsDonateModalVisible(true);
  };

  const handleContactFromExpiredModal = () => {
    setIsSubscriptionModalVisible(false);
    setIsAboutModalVisible(true);
  };

  const handleSubscriptionExpired = useCallback(() => {
    if (currentUser && !currentUser.isAdmin) {
      const expiry = new Date(currentUser.subscriptionEndDate);
      if (expiry.getTime() === 0) {
        return; 
      }

      const vipModes: AppMode[] = ['restoration', 'fashion_studio', 'football_studio', 'creative_studio', 'prompt_analyzer', 'four_seasons_studio', 'beauty_studio', 'family_studio'];
      
      if (vipModes.includes(appMode) || isBatchMode) {
        handleModeChange('headshot');
        setIsFreeTierLocked(true);
      } else if (appMode === 'id_photo') {
        setIsFreeTierLocked(true);
      }
      setIsSubscriptionModalVisible(true);
    }
  }, [currentUser, appMode, isBatchMode, handleModeChange]);


  const handleUsePromptInStudio = useCallback((image: File, prompt: string) => {
    console.log("Transferring from Prompt Analyzer to Creative Studio.");
    setCreativeStudioInitialState({ image, prompt });
    handleModeChange('creative_studio');
  }, [handleModeChange]);


  const isLoading = isGenerating || isHeadshotLoading || isFashionStudioLoading || isBatchProcessing; 

  const renderContent = () => {
    switch (appMode) {
      case 'id_photo':
        return isBatchMode ? (
          <BatchProcessor
            jobs={idPhotoJobs}
            settings={settings}
            onDestructiveSettingChange={handleDestructiveSettingChange}
            onPrintSettingChange={handlePrintSettingChange}
            isProcessing={isBatchProcessing}
            onGenerate={handleGenerateBatch}
            onAddPhotos={triggerUpload}
            onClear={handleResetIdPhotoTool}
            onRemoveJob={handleRemoveIdPhotoJob}
            isVip={isVip}
            onContactClick={() => setIsAboutModalVisible(true)}
            activeSection={activeWizardSection}
            setActiveSection={handleSetActiveWizardSection}
            enabledSections={enabledWizardSections}
            onOutfitUpload={triggerOutfitUpload}
            onClearOutfit={handleClearOutfitFile}
          />
        ) : (
          <>
            <div className="flex-1 flex flex-col overflow-hidden">
               <header className="w-full max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 pt-6 pb-2 flex-shrink-0">
                  <div />
                  <div className="text-center">
                    <h1 
                      className="text-4xl sm:text-5xl font-extrabold uppercase tracking-wider animated-gradient-text"
                      style={{ fontFamily: "'Exo 2', sans-serif" }}
                    >
                      {t('idPhotoTool.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2 text-lg tracking-wide">{t('idPhotoTool.subtitle')}</p>
                  </div>
                  <div className="flex justify-end">
                      <ThemeSelector currentTheme={theme} onChangeTheme={setTheme} />
                  </div>
                </header>

              <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row overflow-hidden gap-6 px-6 pb-6">
                <ImagePanes 
                  originalImage={originalImage}
                  processedImage={processedImage}
                  onUploadClick={handleNewUploadRequest}
                  onFileDrop={handleFilesSelected}
                  zoomLevel={zoom}
                  rotation={rotation}
                  aspectRatio={settings.aspectRatio}
                  printLayout={settings.printLayout}
                  keepOriginalFeatures={settings.face.keepOriginalFeatures}
                  paperBackground={settings.paperBackground}
                  isAiCropped={isAiCropped}
                />
                <div className={`w-full md:w-96 flex-shrink-0 flex flex-col transition-all duration-300 ${isPanelVisible ? 'md:ml-0' : 'md:-mr-96 md:ml-6'}`}>
                    <ControlPanel 
                      settings={settings} 
                      onDestructiveSettingChange={handleDestructiveSettingChange}
                      onPrintSettingChange={handlePrintSettingChange}
                      isVisible={isPanelVisible}
                      hasProcessedImage={!!processedImage}
                      activeSection={activeWizardSection}
                      setActiveSection={handleSetActiveWizardSection}
                      onOutfitUpload={triggerOutfitUpload}
                      onClearOutfit={handleClearOutfitFile}
                      originalImage={originalImage}
                      enabledSections={enabledWizardSections}
                      isVip={isVip}
                      isFreeTierLocked={isFreeTierLocked}
                      onContactClick={() => setIsAboutModalVisible(true)}
                    />
                    <div className="mt-auto pt-4">
                        <button 
                            onClick={() => handleGenerate()} 
                            disabled={isGenerating || !originalImage} 
                            className={`w-full btn-gradient text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center text-lg transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${originalImage && !isGenerating ? 'animate-pulse-glow' : ''}`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('common.processing')}
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-magic mr-3"></i> {t('sidebar.generateButton')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
              </div>
            </div>
            {history.length > 0 && !isGenerating && (
                <HistoryPanel
                    originalImage={originalImage}
                    history={history}
                    currentImage={processedImage}
                    onSelect={handleHistorySelect}
                    onSelectOriginal={handleSelectOriginal}
                    onClear={handleClearHistory}
                />
            )}
            {idPhotoError && (
              <div className="bg-red-500 text-white text-center p-2 mx-6 mb-2 rounded-md">
                {idPhotoError}
              </div>
            )}
            {isResultReady && <ActionBar 
              zoom={zoom}
              setZoom={setZoom}
              rotation={rotation}
              setRotation={setRotation}
              processedImage={processedImage}
              isPanelVisible={isPanelVisible}
              setIsPanelVisible={setIsPanelVisible}
              printLayout={settings.printLayout}
              aspectRatio={settings.aspectRatio}
              paperBackground={settings.paperBackground}
            />}
          </>
        );
      case 'headshot':
        return (
          <HeadshotGenerator
            sourceFile={headshotSourceFile}
            results={headshotResults}
            isLoading={isHeadshotLoading}
            error={headshotError}
            onImageUpload={processSingleFile}
            onGenerate={handleGenerateHeadshots}
            onReset={handleResetHeadshotTool}
            theme={theme}
            setTheme={setTheme}
          />
        );
      case 'restoration':
          return (
              <RestorationTool
                  theme={theme}
                  setTheme={setTheme}
                  isVip={isVip}
              />
          );
      case 'fashion_studio':
          return (
              <FashionStudio 
                sourceFile={fashionStudioFile}
                settings={fashionStudioSettings}
                onSettingsChange={handleFashionSettingsChange}
                result={fashionStudioResult}
                isLoading={isFashionStudioLoading}
                error={fashionStudioError}
                onImageUpload={processSingleFile}
                onGenerate={handleGenerateFashionPhoto}
                onReset={handleResetFashionStudioTool}
                theme={theme}
                setTheme={setTheme}
              />
          );
      case 'football_studio':
          return <FootballStudio theme={theme} setTheme={setTheme} />;
       case 'prompt_analyzer':
            return <PromptAnalyzer 
                        theme={theme} 
                        setTheme={setTheme}
                        onUseInStudio={handleUsePromptInStudio}
                   />;
      case 'creative_studio':
          return <CreativeStudio 
                    key={creativeStudioKey} 
                    theme={theme} 
                    setTheme={setTheme} 
                    initialState={creativeStudioInitialState}
                    onInitialStateConsumed={handleCreativeStudioStateConsumed}
                    isVip={isVip}
                />;
      case 'four_seasons_studio':
          return <FourSeasonsStudio theme={theme} setTheme={setTheme} isVip={isVip} />;
      case 'beauty_studio':
          return <BeautyStudio theme={theme} setTheme={setTheme} isVip={isVip} />;
      case 'family_studio':
          return <FamilyStudio theme={theme} setTheme={setTheme} isVip={isVip} />;
      case 'admin':
        if (currentUser?.isAdmin) {
            const usersToShow = [...allUsers].sort((a, b) => {
                if (a.uid === currentUser.uid) return -1;
                if (b.uid === currentUser.uid) return 1;
                return a.username.localeCompare(b.username);
            });

          return <AdminPanel 
                    currentUser={currentUser}
                    users={usersToShow} 
                    onGrant={handleGrantSubscription} 
                    onResetPassword={handleResetUserPassword}
                    onToggleAdmin={handleToggleAdmin}
                    theme={theme}
                    setTheme={setTheme}
                 />;
        }
        return null;
      default:
        return null;
    }
  };

  if (isAuthLoading) {
    return null;
  }

  return (
    <div className="text-[var(--text-primary)] min-h-screen font-sans flex flex-col md:flex-row overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300">
      {isLoading && <LoadingOverlay />}
      {isGuideVisible && <UserGuideModal onClose={() => setIsGuideVisible(false)} />}
      {isAboutModalVisible && <AboutModal onClose={() => setIsAboutModalVisible(false)} onDonateClick={handleOpenDonateModal} />}
      {isDonateModalVisible && <DonateModal onClose={() => setIsDonateModalVisible(false)} />}
      {isSubscriptionModalVisible && (
        <UpgradeVipModal 
            onClose={() => setIsSubscriptionModalVisible(false)}
            onContact={handleContactFromExpiredModal}
        />
      )}
      {isAuthModalVisible && (
        <AuthModal 
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleSignIn={handleGoogleSignIn}
          onForgotPassword={handleForgotPassword}
          onClose={() => {
              setIsAuthModalVisible(false);
              setPostLoginRedirect(null);
          }}
        />
      )}
      {isChangePasswordModalVisible && (
        <ChangePasswordModal
            onChangePassword={handleChangePassword}
            onClose={() => setIsChangePasswordModalVisible(false)}
        />
      )}
       {isVerificationModalVisible && (
        <VerificationModal
            isOpen={isVerificationModalVisible}
            onClose={handleLogout}
            onResend={handleResendVerification}
            email={auth.currentUser?.email || ''}
        />
       )}
      <input type="file" ref={fileUploadRef} onChange={handleImageUpload} accept="image/*" className="hidden" multiple />
      <input type="file" ref={outfitUploadRef} onChange={handleOutfitFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
      
      <Sidebar 
        appMode={appMode}
        onIdPhotoClick={handleIdPhotoSelect}
        onHeadshotClick={handleHeadshotSelect}
        onRestorationClick={handleRestorationSelect}
        onFashionStudioClick={handleFashionStudioSelect}
        onFootballStudioClick={handleFootballStudioSelect}
        onCreativeStudioClick={handleCreativeStudioSelect}
        onPromptAnalyzerClick={handlePromptAnalyzerSelect}
        onFourSeasonsClick={handleFourSeasonsSelect}
        onBeautyStudioClick={handleBeautyStudioSelect}
        onFamilyStudioClick={handleFamilyStudioSelect}
        onAdminPanelClick={handleAdminPanelSelect}
        onPresetSelect={handlePresetSelect}
        onUndo={handleUndo}
        historyCount={history.length} 
        onGuideClick={() => setIsGuideVisible(true)}
        onAboutClick={() => setIsAboutModalVisible(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onChangePasswordClick={() => setIsChangePasswordModalVisible(true)}
        onSubscriptionExpired={handleSubscriptionExpired}
        isImageUploaded={!!originalImage}
        isVip={isVip}
      />

      <div className="flex-1 flex flex-col transition-all duration-300">
          <main className="flex-1 flex flex-col">
              {renderContent()}
          </main>
          <footer className="w-full text-center py-4 flex-shrink-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
               <div 
                  className="text-sm animated-gradient-text"
              >
                  © 2025 - {t('footer.credit')}
              </div>
              <div className="hidden sm:block text-sm text-[var(--text-secondary)]">|</div>
              <a href="javascript:void(0)" onClick={(e) => { e.preventDefault(); setIsPrivacyModalVisible(true); }} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">{t('footer.privacy')}</a>
              <div className="hidden sm:block text-sm text-[var(--text-secondary)]">|</div>
              <a href="javascript:void(0)" onClick={(e) => { e.preventDefault(); setIsTermsModalVisible(true); }} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">{t('footer.terms')}</a>
          </footer>
      </div>

       {isPrivacyModalVisible && (
        <LegalModal 
          isOpen={isPrivacyModalVisible}
          onClose={() => setIsPrivacyModalVisible(false)}
          titleKey="legal.privacy.title"
          contentKey="legal.privacy.content"
        />
      )}
      {isTermsModalVisible && (
        <LegalModal 
          isOpen={isTermsModalVisible}
          onClose={() => setIsTermsModalVisible(false)}
          titleKey="legal.terms.title"
          contentKey="legal.terms.content"
        />
      )}
    </div>
  );
};

export default App;
