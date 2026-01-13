import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Article } from '../types';

const ARTICLES_COLLECTION = 'articles';
const CATEGORIES_COLLECTION = 'categories';

/**
 * Publish an article to Firebase
 */
export async function publishArticle(
  article: Article,
  categoryId: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be authenticated to publish articles');
  }

  const articleData = {
    ...article,
    categoryId,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    authorId: user.uid,
    updatedAt: new Date().toISOString(),
  };

  // Remove undefined values (Firestore doesn't accept them)
  const cleanedData = Object.fromEntries(
    Object.entries(articleData).filter(([_, value]) => value !== undefined)
  );

  await setDoc(doc(db, ARTICLES_COLLECTION, article.id), cleanedData);
}

/**
 * Update a published article
 */
export async function updatePublishedArticle(
  articleId: string,
  updates: Partial<Article>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be authenticated to update articles');
  }

  // Remove undefined values (Firestore doesn't accept them)
  const cleanedUpdates = Object.fromEntries(
    Object.entries({
      ...updates,
      updatedAt: new Date().toISOString(),
    }).filter(([_, value]) => value !== undefined)
  );

  await updateDoc(doc(db, ARTICLES_COLLECTION, articleId), cleanedUpdates);
}

/**
 * Unpublish an article (delete from Firebase)
 */
export async function unpublishArticle(articleId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be authenticated to unpublish articles');
  }

  await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId));
}

/**
 * Get all published articles
 */
export async function getAllPublishedArticles(): Promise<Article[]> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Article);
}

/**
 * Get published articles for a specific category
 */
export async function getPublishedArticlesByCategory(
  categoryId: string
): Promise<Article[]> {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('categoryId', '==', categoryId),
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Article);
}

/**
 * Get a single published article
 */
export async function getPublishedArticle(articleId: string): Promise<Article | null> {
  const docRef = doc(db, ARTICLES_COLLECTION, articleId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data().isPublished) {
    return docSnap.data() as Article;
  }

  return null;
}

/**
 * Subscribe to real-time updates for published articles
 */
export function subscribeToPublishedArticles(
  callback: (articles: Article[]) => void
): () => void {
  const q = query(
    collection(db, ARTICLES_COLLECTION),
    where('isPublished', '==', true),
    orderBy('publishedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const articles = snapshot.docs.map((doc) => doc.data() as Article);
    callback(articles);
  });
}

/**
 * Check if an article is published
 */
export async function isArticlePublished(articleId: string): Promise<boolean> {
  const article = await getPublishedArticle(articleId);
  return article !== null;
}
