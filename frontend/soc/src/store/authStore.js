import { create } from 'zustand';
import { auth, db } from '../firebase/config';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { clearAllQueries } from '../utils/queryClient';

const useAuthStore = create((set /* , get */) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize auth state listener
  initializeAuth: () => {
    let previousUserId = null;

    onAuthStateChanged(auth, (user) => {
      const currentUserId = user?.uid || null;

      // Clear cache if user has changed (different user or logged out)
      if (previousUserId && previousUserId !== currentUserId) {
        clearAllQueries();
      }

      previousUserId = currentUserId;

      set({
        user: user,
        isAuthenticated: !!user,
        isLoading: false
      });
    });
  },

  // Login function
  login: async (email, password, rememberMe = false) => {
    try {
      set({ isLoading: true });

      // Set persistence based on remember me option
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({
        user: userCredential.user,
        isAuthenticated: true,
        isLoading: false
      });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Signup function
  signup: async (email, password, role, name) => {
    try {
      set({ isLoading: true });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setDoc(doc(db, "User", user.uid), {
      email: email,
      createdAt: serverTimestamp(),
      name: name,
      role: role,
      });
      set({
        user: userCredential.user,
        isAuthenticated: true,
        isLoading: false
      });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Logout function
  logout: async () => {
    try {
      await signOut(auth);

      // Clear all cached query data to prevent data leakage between users
      clearAllQueries();

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}));

export default useAuthStore;