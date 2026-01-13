import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export interface Article {
  id: string;
  title: string;
  date: string;
  readTime: string;
  preview: string;
  content: string; // Markdown supported
  imageUrl?: string;
  images?: string[]; // Multiple images support
  location?: string;
  musicUrl?: string;
  isDraft?: boolean;
  isPublished?: boolean; // Published to Firebase
  publishedAt?: string; // ISO timestamp when published
  authorId?: string; // Firebase auth user ID
  categoryId?: string; // Reference to category for Firebase storage
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  colorHex: string; // For the cover base color
  backgroundImage: string;
  articles: Article[];
  isLightCover?: boolean; // Determines text color (Gold vs Dark Brown)
}

export type ViewState = 'HOME' | 'READING';