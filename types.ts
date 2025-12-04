
// FIX: Import React to provide the 'React' namespace for React.ReactNode.
import React from 'react';

export type AppMode = 'id_photo' | 'headshot' | 'restoration' | 'admin' | 'fashion_studio' | 'creative_studio' | 'prompt_analyzer' | 'football_studio' | 'four_seasons_studio' | 'beauty_studio' | 'family_studio' | 'marketing_studio' | 'art_style_studio' | 'voice_studio' | 'music_studio' | 'magic_eraser' | 'motion_studio';
export type AspectRatio = '2x3' | '3x4' | '4x6' | '5x5';
export type FashionAspectRatio = '1:1' | '4:3' | '9:16' | '16:9';
export type OutfitMode = 'preset' | 'custom' | 'upload';
export type HairStyle = 'auto' | 'down' | 'slicked_back' | 'keep_original';
export type BackgroundMode = 'white' | 'light_blue' | 'custom' | 'ai';
export type PrintLayout = 'none' | '10x15' | '13x18' | '20x30';
export type PaperBackground = string;
export type AccordionSection = 'layout' | 'outfit' | 'face' | 'background' | '';


export interface Settings {
  aspectRatio: AspectRatio;
  outfit: {
    mode: OutfitMode;
    preset: string;
    customPrompt: string;
    uploadedFile: File | null;
    keepOriginal: boolean;
  };
  face: {
    otherCustom: string;
    hairStyle: HairStyle;
    keepOriginalFeatures: boolean;
    smoothSkin: boolean;
    slightSmile: boolean;
  };
  background: {
    mode: BackgroundMode;
    customColor: string;
    customPrompt: string;
  };
  safe5x5Layout: boolean;
  printLayout: PrintLayout;
  paperBackground: PaperBackground;
  highQuality?: boolean; // New property for quality control
}

export interface HistoryItem {
    image: string;
    settings: Settings;
}

export interface HeadshotStyle {
  id: string;
  nameKey: string; // Changed from name to nameKey for i18n
  prompt: string;
  type: 'professional' | 'artistic' | 'outdoor' | 'minimalist';
}

export interface HeadshotResult {
    id: string;
    imageUrl: string;
}

// Types for the new Restoration Tool
export interface FilePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

export interface RestorationOptions {
  mode: 'quick' | 'hq' | 'portrait' | 'reconstruct';
  removeScratches: boolean;
  removeYellowing: boolean;
  sharpenFace: boolean;
  redrawHair: boolean;
  naturalSkinSmoothing: boolean;
  colorize: boolean;
  isVietnamese: boolean;
  gender: 'auto' | 'male' | 'female';
  age: 'auto' | 'child' | 'young_adult' | 'adult' | 'elderly';
  context: string;
  highQuality?: boolean; // New property
}

export interface DocumentRestorationOptions {
  documentType: 'general' | 'id_card' | 'license' | 'certificate' | 'handwritten';
  removeStains: boolean;
  deskew: boolean;
  enhanceText: boolean;
  preserveSignatures: boolean;
  customPrompt: string;
  highQuality?: boolean; // New property
}


export interface RestorationResult {
  originalUrl: string;
  restoredUrl: string;
}

export interface User {
  uid: string;
  username: string;
  subscriptionEndDate: string; // ISO 8601 date string
  credits: number; // New: Credit balance
  shortId?: string; // New: Short ID for banking transactions (6 chars)
  isAdmin?: boolean;
  deviceFingerprint?: string;
  providerId?: string;
}

// --- Transaction History Type ---
export interface Transaction {
    id: string;
    uid: string;
    packageId: string;
    packageName: string;
    amount: number;
    type: 'credit' | 'vip';
    timestamp: string; // ISO string
    status: 'success' | 'pending' | 'failed';
    price?: number; // Added price
    currency?: string; // Added currency
    gateway?: 'PAYPAL' | 'VIETQR'; // Added gateway source
    orderId?: string; // PayPal Order ID
}

// --- Types for the new Fashion Studio ---
export type FashionCategory = 'female' | 'male' | 'girl' | 'boy';

export interface FashionStyle {
  key: string;
  promptValue: string;
}

export interface FashionStudioSettings {
  category: FashionCategory;
  style: string; // This will store the promptValue
  aspectRatio: FashionAspectRatio;
  description: string;
  highQuality: boolean;
}

export interface FashionStudioResult {
  id: string;
  imageUrl: string;
}

// --- Types for the new Football Studio ---
export type FootballMode = 'idol' | 'outfit';
export type FootballCategory = 'contemporary' | 'legendary';

export interface FootballStudioSettings {
  mode: FootballMode;
  sourceImage: File | null;
  category: FootballCategory;
  team: string;
  player: string;
  scene: string;
  aspectRatio: string;
  style: string;
  customPrompt: string;
  highQuality?: boolean; // New property
}

export interface FootballStudioResult {
  id: string;
  imageUrl: string;
}


// --- Batch Processing Types ---
export interface IdPhotoJob {
  id: string;
  file: File;
  originalUrl: string;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

// --- Types for Four Seasons Studio ---
export interface Scene {
  title: string;
  desc: string;
}


// --- Types for AI Studio ---

export enum FeatureAction {
  PRODUCT_PHOTO = 'product_photo',
  TRY_ON_OUTFIT = 'try_on_outfit',
  PLACE_IN_SCENE = 'place_in_scene',
  COUPLE_COMPOSE = 'couple_compose',
  FASHION_STUDIO = 'fashion_studio',
  EXTRACT_OUTFIT = 'extract_outfit',
  CHANGE_HAIRSTYLE = 'change_hairstyle',
  CREATE_ALBUM = 'create_album',
  CREATIVE_COMPOSITE = 'creative_composite',
  BIRTHDAY_PHOTO = 'birthday_photo',
  HOT_TREND_PHOTO = 'hot_trend_photo',
  AI_TRAINER = 'ai_trainer',
  ID_PHOTO = 'id_photo',
  AI_THUMBNAIL_DESIGNER = 'ai_thumbnail_designer',
  BATCH_GENERATOR = 'batch_generator',
  IMAGE_VARIATION_GENERATOR = 'image_variation_generator',
  KOREAN_STYLE_STUDIO = 'korean_style_studio',
  YOGA_STUDIO = 'yoga_studio',
}

export interface BaseInput {
  type: string;
  label: string;
  name: string;
  required?: boolean;
}

export interface TextInput extends BaseInput {
  type: 'text';
  placeholder?: string;
}

export interface SliderInput extends BaseInput {
    type: 'slider';
    min?: number;
    max?: number;
    step?: number;
    default?: number;
}

export interface FileInput extends BaseInput {
  type: 'file';
  accept: string[];
}

export interface SelectInput extends BaseInput {
  type: 'select';
  options: (string | { value: string; label: string })[];
  placeholder?: string;
  default?: string;
}

export interface MultiSelectInput extends BaseInput {
  type: 'multiselect';
  options: string[];
  placeholder?: string;
}

export interface CheckboxInput extends BaseInput {
  type: 'checkbox';
  default?: boolean;
}

export interface ImageSelectOption {
  name: string;
  preview: string;
}

export interface ImageSelectInput extends BaseInput {
  type: 'imageselect';
  options: ImageSelectOption[];
}


export type FeatureInput = TextInput | FileInput | SelectInput | MultiSelectInput | CheckboxInput | ImageSelectInput | SliderInput;

export interface Feature {
  name: string;
  action: FeatureAction;
  icon: string;
  inputs: FeatureInput[];
}

export type ConceptType = 'character' | 'style';

export interface Concept {
    id: string;
    name: string;
    type: ConceptType;
    images: string[]; // base64 encoded images
}

// --- Types for AI Thumbnail Generator ---
export type ThumbnailRatio = '16:9' | '9:16';

export interface ThumbnailInputs {
  title: string;
  speaker: string;
  outfit: string;
  action: string;
  extra: string;
  highQuality?: boolean; // New property
}

export interface ThumbnailImageData {
  element: HTMLImageElement;
  url: string;
}

// --- Types for Batch Generator ---
export enum JobStatus {
  Queued = 'Queued',
  Running = 'Running',
  Success = 'Success',
  Failed = 'Failed',
}

export type BatchAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const batchAspectRatios: BatchAspectRatio[] = ['9:16', '1:1', '16:9', '4:3', '3:4'];

export const isBatchAspectRatio = (value: any): value is BatchAspectRatio => {
  return batchAspectRatios.includes(value);
};

export interface GeneratedImage {
  id: string;
  base64: string;
}

export interface JobDefinition {
  prompt: string;
  aspectRatio: BatchAspectRatio;
  numOutputs: number;
}

export interface Job extends JobDefinition {
  id: string;
  status: JobStatus;
  result: GeneratedImage[];
  error?: string;
}

// --- NEW TYPES FOR BEAUTY STUDIO ---
export type BeautyStyleType = 'image' | 'color' | 'intensity';

export interface BeautyStyle {
  id: string;
  labelKey: string;
  englishLabel: string;
  type: BeautyStyleType;
  value: string;
  promptInstruction?: string;
}

export interface BeautySubFeature {
  id: string;
  labelKey: string;
  englishLabel: string;
  styles: BeautyStyle[];
  promptInstruction?: string;
}

export type BeautyBadgeType = 'Free' | 'Hot' | 'NEW';

export interface BeautyFeature {
  id: string;
  labelKey: string;
  englishLabel: string;
  icon: string;
  badge?: BeautyBadgeType;
  subFeatures?: BeautySubFeature[];
  promptInstruction?: string;
}

export interface BeautyHistoryItem {
  id: string;
  imageDataUrl: string;
}

// --- NEW TYPES FOR FAMILY STUDIO ---
export interface FamilyMember {
    id: string;
    photo: File | null;
    age: string;
    bodyDescription?: string;
    outfit?: string;
    pose?: string;
}

export interface FamilyStudioSettings {
    members: FamilyMember[];
    scene: string;
    outfit: string;
    pose: string;
    customPrompt: string;
    aspectRatio: '4:3' | '16:9';
    faceConsistency: boolean;
    highQuality?: boolean; // New property
}

export interface ROI {
    memberId: string;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
}

// DEBUG INFO STRUCTURE
export interface DebugInfo {
    pass1: string; // base64 of pass 1 image
    roiJson: ROI[]; // Detected ROIs
    pass2: {
        memberId: string;
        debug: {
            iteration: number;
            roi: any;
            maskBase64: string;
            imageBase64: string;
        }[];
    }[];
}

export interface FamilyStudioResult {
    id: string;
    imageUrl: string;
    similarityScores?: { memberId: string, score: number }[],
    debug?: DebugInfo;
}


export interface SerializedFamilyMember {
    id: string;
    age: string;
    photo: {
        base64: string;
        mimeType: string;
    };
    bodyDescription?: string;
    outfit?: string;
    pose?: string;
}

export interface SerializedFamilyStudioSettings {
    members: SerializedFamilyMember[];
    scene: string;
    outfit: string;
    pose: string;
    customPrompt: string;
    aspectRatio: '4:3' | '16:9';
    faceConsistency: boolean;
    highQuality?: boolean; // New property
    rois?: ROI[]; // Make optional for backend compatibility
}

// --- MARKETING STUDIO TYPES ---
export interface MarketingProduct {
    name: string;
    brand: string;
    category: string;
    price: string;
    merchant: string;
    rating: string;
    features: string;
    pros: string;
    cons: string;
    productImage: File | null;
    referenceImage: File | null; // Model or context ref
}

export interface MarketingSettings {
    templateId: string;
    tone: string;
    aspectRatio: FashionAspectRatio;
    customAngle: string; // For reviews
    highQuality: boolean;
}

export interface MarketingResult {
    adCopy: string;
    videoScript: string;
    generatedImageUrl: string | null;
    generatedVideoUrl: string | null;
}

export interface SelectOption {
    id: string;
    labelKey: string;
}

export interface TemplateOption {
    id: string;
    labelKey: string;
    phrase: string;
}

// --- ART STYLE STUDIO TYPES ---
export interface ArtStyleUploadedFile {
  file: File;
  previewUrl: string;
}

export interface ArtStylePayload {
    modelFile: { base64: string, mimeType: string };
    otherFiles: {
        clothing?: { base64: string, mimeType: string };
        accessories?: { base64: string, mimeType: string };
        product?: { base64: string, mimeType: string };
    };
    styles: string[];
    quality: string;
    aspect: string;
    count: number;
    userPrompt: string;
}

// --- VOICE STUDIO TYPES ---
export interface VoiceOption {
    id: string;
    nameKey: string;
    geminiVoice: string;
    gender: 'male' | 'female';
    regionKey: string; // north, central, south, intl
    provinceKey?: string; // Optional: To distinguish provinces in UI
    icon: string;
}

export interface VoiceStudioSettings {
    text: string;
    voiceId: string;
    language: 'vi' | 'en';
    speed: number; // Added speed property
}

// --- MUSIC STUDIO TYPES (NEW) ---
export interface MusicSettings {
    topic: string;
    genre: string;
    mood: string;
    language: 'vi' | 'en';
}

export interface SongStructure {
    title: string;
    lyrics: string;
    chords: string; // Text representation of chords
    description: string; // Visual description for cover art
    stylePrompt: string; // Musical style description
}

export interface MusicAnalysisResult {
    style: string;
    lyrics: string;
}

export interface MusicResult {
    song: SongStructure;
    coverArtUrl: string | null;
    demoAudioUrl: string | null; // Base64 audio from TTS reading lyrics
}

// --- MOTION STUDIO TYPES (NEW) ---
export interface MotionCharacter {
    id: string;
    name: string;
    image: File;
    previewUrl: string;
    description?: string; // Added description field
}

export interface MotionShot {
    id: string;
    prompt: string;
    image?: File | null; 
    imagePreview?: string;
    status: 'pending' | 'processing' | 'done' | 'error';
    videoUrl?: string;
    duration?: number;
    characters?: string[]; // List of character IDs used in this shot
}

export interface MotionStudioSettings {
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
    audio: boolean;
}

export interface AnalyzedScene {
    id: string;
    timestamp: string;
    image: string; // Base64
    prompt: string;
}

// LayoutResult moved here to prevent circular dependency
export interface LayoutResult {
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  padX: number;
  padY: number;
  gap: number;
  x0: number;
  y0: number;
}

// --- PAYMENT TYPES ---
export type PackageType = 'credit' | 'vip';

export interface PaymentPackage {
    id: string;
    type: PackageType;
    name: string;
    amount: number; // Credits amount OR Days amount
    price: number; // VND
    originalPrice?: number; // Optional: to show strike-through price
    popular?: boolean; // Highlight badge
}