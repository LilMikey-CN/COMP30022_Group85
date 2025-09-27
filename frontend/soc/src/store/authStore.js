import { create } from 'zustand';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';

const useAuthStore = create((set /* , get */) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize auth state listener
  initializeAuth: () => {
    onAuthStateChanged(auth, (user) => {
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
  signup: async (email, password) => {
    try {
      set({ isLoading: true });
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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