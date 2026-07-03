import { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  orderBy,
  limit,
  serverTimestamp
} from "../firebase";
import { FavoriteCity, SearchHistoryItem, UserPreferences, User, WeatherAlert } from "../types";

export const FirestoreService = {
  // --- USER PROFILE OPERATIONS ---
  async saveUserProfile(userId: string, email: string, name: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      createdAt: new Date().toISOString()
    }, { merge: true });
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as User;
  },

  // --- FAVORITES OPERATIONS ---
  async getFavorites(userId: string): Promise<FavoriteCity[]> {
    const q = query(
      collection(db, "favorites"), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const favs = snap.docs.map(doc => doc.data() as FavoriteCity);
    
    // Sort client-side to ensure stable layout order
    return favs.sort((a: any, b: any) => {
      if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
        return a.orderIndex - b.orderIndex;
      }
      return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
    });
  },

  async addFavorite(userId: string, city: any): Promise<FavoriteCity> {
    const favs = await this.getFavorites(userId);
    const orderIndex = favs.length;
    const addedAt = new Date().toISOString();
    
    const favoriteDocId = `${userId}_${city.id}`;
    const favData: any = {
      ...city,
      userId,
      addedAt,
      orderIndex
    };

    const favRef = doc(db, "favorites", favoriteDocId);
    await setDoc(favRef, favData);
    return favData as FavoriteCity;
  },

  async deleteFavorite(userId: string, cityId: string): Promise<void> {
    const favoriteDocId = `${userId}_${cityId}`;
    const favRef = doc(db, "favorites", favoriteDocId);
    await deleteDoc(favRef);
  },

  async reorderFavorites(userId: string, reorderedIds: string[]): Promise<void> {
    // We update each favorite with its new orderIndex
    const promises = reorderedIds.map((id, index) => {
      const favRef = doc(db, "favorites", `${userId}_${id}`);
      return setDoc(favRef, { orderIndex: index }, { merge: true });
    });
    await Promise.all(promises);
  },

  // --- SEARCH HISTORY OPERATIONS ---
  async getSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
    const q = query(
      collection(db, "history"), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(doc => doc.data() as SearchHistoryItem);
    
    // Sort descending by search date
    return items.sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());
  },

  async addSearchHistory(userId: string, item: any): Promise<SearchHistoryItem> {
    const searchedAt = new Date().toISOString();
    const historyId = `${userId}_${Date.now()}`;
    const historyData: any = {
      ...item,
      userId,
      searchedAt
    };

    const historyRef = doc(db, "history", historyId);
    await setDoc(historyRef, historyData);
    return historyData as SearchHistoryItem;
  },

  async clearSearchHistory(userId: string): Promise<void> {
    const q = query(collection(db, "history"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const promises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
  },

  // --- USER PREFERENCES OPERATIONS ---
  async getPreferences(userId: string): Promise<UserPreferences> {
    const prefRef = doc(db, "preferences", userId);
    const snap = await getDoc(prefRef);
    if (!snap.exists()) {
      // Default preferences
      const defaultPrefs: UserPreferences = {
        tempUnit: "C",
        windUnit: "kmh",
        theme: "dark",
        notificationsEnabled: true
      };
      await setDoc(prefRef, defaultPrefs);
      return defaultPrefs;
    }
    return snap.data() as UserPreferences;
  },

  async savePreferences(userId: string, prefs: UserPreferences): Promise<void> {
    const prefRef = doc(db, "preferences", userId);
    await setDoc(prefRef, prefs, { merge: true });
  },

  // --- SYSTEM WIDE ALERTS / NOTIFICATIONS ---
  async getSystemAlerts(): Promise<WeatherAlert[]> {
    const snap = await getDocs(collection(db, "alerts"));
    const alertsList = snap.docs.map(doc => doc.data() as WeatherAlert);
    return alertsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createSystemAlert(alert: Omit<WeatherAlert, "id" | "createdAt">): Promise<WeatherAlert> {
    const id = `alert_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const alertData: WeatherAlert = {
      ...alert,
      id,
      createdAt
    };

    const alertRef = doc(db, "alerts", id);
    await setDoc(alertRef, alertData);
    return alertData;
  },

  async deleteSystemAlert(alertId: string): Promise<void> {
    await deleteDoc(doc(db, "alerts", alertId));
  },

  // --- ADMIN VIEW OPERATIONS ---
  async getAdminUsers(): Promise<User[]> {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(doc => doc.data() as User);
  },

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalFavorites: number;
    totalSearches: number;
    activeAlerts: number;
  }> {
    const [usersSnap, favsSnap, historySnap, alertsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "favorites")),
      getDocs(collection(db, "history")),
      getDocs(collection(db, "alerts"))
    ]);

    return {
      totalUsers: usersSnap.size,
      totalFavorites: favsSnap.size,
      totalSearches: historySnap.size,
      activeAlerts: alertsSnap.size
    };
  },

  async deleteUser(userId: string): Promise<void> {
    // 1. Delete user profile doc
    await deleteDoc(doc(db, "users", userId));

    // 2. Delete user preferences doc
    await deleteDoc(doc(db, "preferences", userId));

    // 3. Delete user favorites
    const favsQuery = query(collection(db, "favorites"), where("userId", "==", userId));
    const favsSnap = await getDocs(favsQuery);
    const favPromises = favsSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(favPromises);

    // 4. Delete user history
    const historyQuery = query(collection(db, "history"), where("userId", "==", userId));
    const historySnap = await getDocs(historyQuery);
    const historyPromises = historySnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(historyPromises);
  }
};
