import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';

/**
 * Upload audio file to Firebase Storage
 * @param file - The audio file to upload
 * @param articleId - The ID of the article (used for organizing files)
 * @returns The download URL of the uploaded file
 */
export async function uploadAudioFile(
  file: File,
  articleId: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be authenticated to upload files');
  }

  // Create a unique filename with timestamp to avoid conflicts
  const timestamp = Date.now();
  const filename = `${articleId}_${timestamp}_${file.name}`;
  const storageRef = ref(storage, `audio/${user.uid}/${filename}`);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get and return the download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Delete audio file from Firebase Storage
 * @param audioUrl - The download URL of the file to delete
 */
export async function deleteAudioFile(audioUrl: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Must be authenticated to delete files');
  }

  try {
    // Extract the file path from the URL
    const url = new URL(audioUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);
    if (!pathMatch) {
      throw new Error('Invalid Firebase Storage URL');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, filePath);

    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting audio file:', error);
    // Don't throw - file might already be deleted or URL might be invalid
  }
}
