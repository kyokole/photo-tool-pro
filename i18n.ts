import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Vietnamese imports
import viActionBar from './locales/vi/actionBar.js';
import viAdmin from './locales/vi/admin.js';
import viBatch from './locales/vi/batch.js';
import viCommon from './locales/vi/common.js';
import viConfirmations from './locales/vi/confirmations.js';
import viCreativeStudio from './locales/vi/creativeStudio.js';
import viErrors from './locales/vi/errors.js';
import viFashionStudio from './locales/vi/fashionStudio.js';
import viFootballStudio from './locales/vi/footballStudio.js';
import viHeadshot from './locales/vi/headshot.js';
import viIdPhotoTool from './locales/vi/idPhotoTool.js';
import viModals from './locales/vi/modals.js';
import viOutfits from './locales/vi/outfits.js';
import viRestoration from './locales/vi/restoration.js';
import viSidebar from './locales/vi/sidebar.js';
import viFourSeasons from './locales/vi/fourSeasons.js';
import viLegal from './locales/vi/legal.js';
import viImageVariation from './locales/vi/imageVariation.js';
import viBeautyStudio from './locales/vi/beautyStudio.js';

// English imports
import enActionBar from './locales/en/actionBar.js';
import enAdmin from './locales/en/admin.js';
import enBatch from './locales/en/batch.js';
import enCommon from './locales/en/common.js';
import enConfirmations from './locales/en/confirmations.js';
import enCreativeStudio from './locales/en/creativeStudio.js';
import enErrors from './locales/en/errors.js';
import enFashionStudio from './locales/en/fashionStudio.js';
import enFootballStudio from './locales/en/footballStudio.js';
import enHeadshot from './locales/en/headshot.js';
import enIdPhotoTool from './locales/en/idPhotoTool.js';
import enModals from './locales/en/modals.js';
import enOutfits from './locales/en/outfits.js';
import enRestoration from './locales/en/restoration.js';
import enSidebar from './locales/en/sidebar.js';
import enFourSeasons from './locales/en/fourSeasons.js';
import enLegal from './locales/en/legal.js';
import enImageVariation from './locales/en/imageVariation.js';
import enBeautyStudio from './locales/en/beautyStudio.js';


const resources = {
  en: {
    translation: {
      ...enActionBar,
      ...enAdmin,
      ...enBatch,
      ...enCommon,
      ...enConfirmations,
      ...enCreativeStudio,
      ...enErrors,
      ...enFashionStudio,
      ...enFootballStudio,
      ...enHeadshot,
      ...enIdPhotoTool,
      ...enModals,
      ...enOutfits,
      ...enRestoration,
      ...enSidebar,
      ...enFourSeasons,
      ...enLegal,
      ...enImageVariation,
      ...enBeautyStudio
    }
  },
  vi: {
    translation: {
      ...viActionBar,
      ...viAdmin,
      ...viBatch,
      ...viCommon,
      ...viConfirmations,
      ...viCreativeStudio,
      ...viErrors,
      ...viFashionStudio,
      ...viFootballStudio,
      ...viHeadshot,
      ...viIdPhotoTool,
      ...viModals,
      ...viOutfits,
      ...viRestoration,
      ...viSidebar,
      ...viFourSeasons,
      ...viLegal,
      ...viImageVariation,
      ...viBeautyStudio
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Ngôn ngữ dự phòng nếu không phát hiện được
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    detection: {
      // thứ tự phát hiện ngôn ngữ
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      // không lưu vào cookie hoặc localStorage
      caches: []
    }
  });

export default i18n;