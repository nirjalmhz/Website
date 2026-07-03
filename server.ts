import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Interfaces for our database
interface WeatherAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  createdAt: string;
}

interface DBUser {
  id: string;
  email: string;
  passwordHash: string; // "salt:hash"
  name: string;
  createdAt: string;
}

interface DBFavorite {
  userId: string;
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  addedAt: string;
}

interface DBSearchHistory {
  userId: string;
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt: string;
}

interface DBUserPreferences {
  userId: string;
  tempUnit: "C" | "F";
  windUnit: "kmh" | "mph" | "ms";
  theme: "dark" | "light";
  notificationsEnabled: boolean;
}

interface WeatherDB {
  users: DBUser[];
  favorites: DBFavorite[];
  history: DBSearchHistory[];
  preferences: DBUserPreferences[];
  alerts?: WeatherAlert[];
}

const DB_FILE = path.join(process.cwd(), "data", "weather_db.json");

// Initialize JSON database
function initDB(): WeatherDB {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: WeatherDB = {
      users: [],
      favorites: [],
      history: [],
      preferences: [],
      alerts: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    let migrated = false;
    if (parsed.preferences && Array.isArray(parsed.preferences)) {
      parsed.preferences.forEach((p: any) => {
        if (p.theme === "light") {
          p.theme = "dark";
          migrated = true;
        }
      });
    }
    if (migrated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read database, resetting to empty", err);
    return { users: [], favorites: [], history: [], preferences: [] };
  }
}

function saveDB(data: WeatherDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to save database", err);
  }
}

let firestoreDb: any = null;
let useFirestore = false;

try {
  const app = admin.initializeApp({
    projectId: "principal-anchor-cfs6l"
  });
  firestoreDb = getFirestore(app, "ai-studio-weatherdashboard-a92ac380-a7aa-4fe6-8b5e-ea4dfec69808");
  useFirestore = true;
  console.log("Firebase Firestore successfully initialized!");
} catch (error) {
  console.error("Firebase initialization failed, falling back to JSON file database", error);
}

const DBService = {
  async findUserByEmail(email: string): Promise<DBUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("users").where("email", "==", normalizedEmail).limit(1).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data() as DBUser;
      } catch (err) {
        console.error("Firestore error finding user by email", err);
      }
    }
    const local = initDB();
    return local.users.find((u) => u.email === normalizedEmail) || null;
  },

  async findUserById(id: string): Promise<DBUser | null> {
    if (useFirestore && firestoreDb) {
      try {
        const doc = await firestoreDb.collection("users").doc(id).get();
        if (!doc.exists) return null;
        return doc.data() as DBUser;
      } catch (err) {
        console.error("Firestore error finding user by id", err);
      }
    }
    const local = initDB();
    return local.users.find((u) => u.id === id) || null;
  },

  async createUser(user: DBUser): Promise<void> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("users").doc(user.id).set(user);
        return;
      } catch (err) {
        console.error("Firestore error creating user", err);
      }
    }
    const local = initDB();
    local.users.push(user);
    saveDB(local);
  },

  async getFavorites(userId: string): Promise<DBFavorite[]> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("favorites").where("userId", "==", userId).get();
        const favs = snapshot.docs.map((doc: any) => doc.data() as DBFavorite);
        return favs.sort((a: any, b: any) => {
          if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
            return a.orderIndex - b.orderIndex;
          }
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        });
      } catch (err) {
        console.error("Firestore error getting favorites", err);
      }
    }
    const local = initDB();
    return local.favorites.filter((f) => f.userId === userId);
  },

  async addFavorite(favorite: DBFavorite): Promise<void> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("favorites").where("userId", "==", favorite.userId).get();
        const orderIndex = snapshot.size;
        await firestoreDb.collection("favorites").doc(`${favorite.userId}_${favorite.id}`).set({
          ...favorite,
          orderIndex
        });
        return;
      } catch (err) {
        console.error("Firestore error adding favorite", err);
      }
    }
    const local = initDB();
    const exists = local.favorites.some((f) => f.userId === favorite.userId && f.id === favorite.id);
    if (!exists) {
      local.favorites.push(favorite);
      saveDB(local);
    }
  },

  async deleteFavorite(userId: string, id: string): Promise<boolean> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("favorites").doc(`${userId}_${id}`).delete();
        return true;
      } catch (err) {
        console.error("Firestore error deleting favorite", err);
        return false;
      }
    }
    const local = initDB();
    const lengthBefore = local.favorites.length;
    local.favorites = local.favorites.filter((f) => !(f.userId === userId && f.id === id));
    if (local.favorites.length === lengthBefore) {
      return false;
    }
    saveDB(local);
    return true;
  },

  async reorderFavorites(userId: string, reorderedIds: string[]): Promise<DBFavorite[]> {
    if (useFirestore && firestoreDb) {
      try {
        const batch = firestoreDb.batch();
        reorderedIds.forEach((id, index) => {
          const ref = firestoreDb.collection("favorites").doc(`${userId}_${id}`);
          batch.set(ref, { orderIndex: index }, { merge: true });
        });
        await batch.commit();
        return await this.getFavorites(userId);
      } catch (err) {
        console.error("Firestore error reordering favorites", err);
      }
    }
    const local = initDB();
    const otherFavs = local.favorites.filter((f) => f.userId !== userId);
    const userFavs = local.favorites.filter((f) => f.userId === userId);

    const reorderedFavs: DBFavorite[] = [];
    reorderedIds.forEach((id) => {
      const fav = userFavs.find((f) => f.id === id);
      if (fav) reorderedFavs.push(fav);
    });

    userFavs.forEach((fav) => {
      if (!reorderedFavs.some((f) => f.id === fav.id)) {
        reorderedFavs.push(fav);
      }
    });

    local.favorites = [...otherFavs, ...reorderedFavs];
    saveDB(local);
    return reorderedFavs;
  },

  async getHistory(userId: string): Promise<DBSearchHistory[]> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("history").where("userId", "==", userId).get();
        const history = snapshot.docs.map((doc: any) => doc.data() as DBSearchHistory);
        return history
          .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
          .slice(0, 10);
      } catch (err) {
        console.error("Firestore error getting history", err);
      }
    }
    const local = initDB();
    return local.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
      .slice(0, 10);
  },

  async addHistory(item: DBSearchHistory): Promise<void> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("history").doc(`${item.userId}_${item.id}`).set(item);
        return;
      } catch (err) {
        console.error("Firestore error adding history", err);
      }
    }
    const local = initDB();
    local.history = local.history.filter((h) => !(h.userId === item.userId && h.id === item.id));
    local.history.push(item);
    saveDB(local);
  },

  async clearHistory(userId: string): Promise<void> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("history").where("userId", "==", userId).get();
        const batch = firestoreDb.batch();
        snapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        return;
      } catch (err) {
        console.error("Firestore error clearing history", err);
      }
    }
    const local = initDB();
    local.history = local.history.filter((h) => h.userId !== userId);
    saveDB(local);
  },

  async getPreferences(userId: string): Promise<DBUserPreferences> {
    if (useFirestore && firestoreDb) {
      try {
        const doc = await firestoreDb.collection("preferences").doc(userId).get();
        if (doc.exists) {
          return doc.data() as DBUserPreferences;
        } else {
          const defaultPrefs: DBUserPreferences = {
            userId,
            tempUnit: "C",
            windUnit: "kmh",
            theme: "dark",
            notificationsEnabled: true,
          };
          await firestoreDb.collection("preferences").doc(userId).set(defaultPrefs);
          return defaultPrefs;
        }
      } catch (err) {
        console.error("Firestore error getting preferences", err);
      }
    }
    const local = initDB();
    let prefs = local.preferences.find((p) => p.userId === userId);
    if (!prefs) {
      prefs = {
        userId,
        tempUnit: "C",
        windUnit: "kmh",
        theme: "dark",
        notificationsEnabled: true,
      };
      local.preferences.push(prefs);
      saveDB(local);
    }
    return prefs;
  },

  async updatePreferences(userId: string, prefs: Partial<DBUserPreferences>): Promise<DBUserPreferences> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("preferences").doc(userId).set(prefs, { merge: true });
        return await this.getPreferences(userId);
      } catch (err) {
        console.error("Firestore error updating preferences", err);
      }
    }
    const local = initDB();
    let index = local.preferences.findIndex((p) => p.userId === userId);
    if (index === -1) {
      const newPrefs: DBUserPreferences = {
        userId,
        tempUnit: prefs.tempUnit || "C",
        windUnit: prefs.windUnit || "kmh",
        theme: prefs.theme || "dark",
        notificationsEnabled: prefs.notificationsEnabled !== undefined ? prefs.notificationsEnabled : true,
      };
      local.preferences.push(newPrefs);
      index = local.preferences.length - 1;
    } else {
      if (prefs.tempUnit) local.preferences[index].tempUnit = prefs.tempUnit;
      if (prefs.windUnit) local.preferences[index].windUnit = prefs.windUnit;
      if (prefs.theme) local.preferences[index].theme = prefs.theme;
      if (prefs.notificationsEnabled !== undefined) local.preferences[index].notificationsEnabled = prefs.notificationsEnabled;
    }
    saveDB(local);
    return local.preferences[index];
  },

  async getAllUsers(): Promise<DBUser[]> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("users").get();
        return snapshot.docs.map((doc: any) => doc.data() as DBUser);
      } catch (err) {
        console.error("Firestore error getting all users", err);
      }
    }
    return initDB().users;
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (useFirestore && firestoreDb) {
      try {
        const batch = firestoreDb.batch();
        
        // Delete user doc
        batch.delete(firestoreDb.collection("users").doc(userId));
        
        // Delete preferences doc
        batch.delete(firestoreDb.collection("preferences").doc(userId));
        
        // Find and delete user favorites
        const favsSnap = await firestoreDb.collection("favorites").where("userId", "==", userId).get();
        favsSnap.docs.forEach((doc: any) => batch.delete(doc.ref));
        
        // Find and delete user history
        const histSnap = await firestoreDb.collection("history").where("userId", "==", userId).get();
        histSnap.docs.forEach((doc: any) => batch.delete(doc.ref));
        
        await batch.commit();
        return true;
      } catch (err) {
        console.error("Firestore error deleting user fully", err);
        return false;
      }
    }
    const local = initDB();
    const lengthBefore = local.users.length;
    local.users = local.users.filter((u) => u.id !== userId);
    if (local.users.length === lengthBefore) return false;
    
    local.favorites = local.favorites.filter((f) => f.userId !== userId);
    local.history = local.history.filter((h) => h.userId !== userId);
    local.preferences = local.preferences.filter((p) => p.userId !== userId);
    saveDB(local);
    return true;
  },

  async getStats(): Promise<any> {
    if (useFirestore && firestoreDb) {
      try {
        const [usersSnap, favsSnap, histSnap, alertsSnap] = await Promise.all([
          firestoreDb.collection("users").get(),
          firestoreDb.collection("favorites").get(),
          firestoreDb.collection("history").get(),
          firestoreDb.collection("alerts").get()
        ]);
        return {
          totalUsers: usersSnap.size,
          totalFavorites: favsSnap.size,
          totalHistory: histSnap.size,
          activeAlertsCount: alertsSnap.size,
          dbType: "Google Cloud Firestore"
        };
      } catch (err) {
        console.error("Firestore error fetching statistics", err);
      }
    }
    const local = initDB();
    return {
      totalUsers: local.users.length,
      totalFavorites: local.favorites.length,
      totalHistory: local.history.length,
      activeAlertsCount: (local.alerts || []).length,
      dbType: "Local JSON Database"
    };
  },

  async getAdminAlerts(): Promise<WeatherAlert[]> {
    if (useFirestore && firestoreDb) {
      try {
        const snapshot = await firestoreDb.collection("alerts").get();
        return snapshot.docs.map((doc: any) => doc.data() as WeatherAlert);
      } catch (err) {
        console.error("Firestore error getting admin alerts", err);
      }
    }
    return initDB().alerts || [];
  },

  async addAdminAlert(alert: WeatherAlert): Promise<void> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("alerts").doc(alert.id).set(alert);
        return;
      } catch (err) {
        console.error("Firestore error adding admin alert", err);
      }
    }
    const local = initDB();
    if (!local.alerts) local.alerts = [];
    local.alerts.push(alert);
    saveDB(local);
  },

  async deleteAdminAlert(alertId: string): Promise<boolean> {
    if (useFirestore && firestoreDb) {
      try {
        await firestoreDb.collection("alerts").doc(alertId).delete();
        return true;
      } catch (err) {
        console.error("Firestore error deleting admin alert", err);
        return false;
      }
    }
    const local = initDB();
    if (!local.alerts) return false;
    const lengthBefore = local.alerts.length;
    local.alerts = local.alerts.filter((a) => a.id !== alertId);
    if (local.alerts.length === lengthBefore) return false;
    saveDB(local);
    return true;
  }
};

// Security Helpers
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  } catch {
    return false;
  }
}

function generateToken(payload: object): string {
  const secret = process.env.JWT_SECRET || "weather-dashboard-super-secret-key-2026";
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${data}`).digest("base64url");
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const secret = process.env.JWT_SECRET || "weather-dashboard-super-secret-key-2026";
    const [header, data, signature] = token.split(".");
    const expectedSignature = crypto.createHmac("sha256", secret).update(`${header}.${data}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Express Application Setup
const app = express();
const PORT = 3000;

app.use(express.json());

// Authentication Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token is missing or invalid" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Access token is expired or invalid" });
  }
  req.userId = payload.userId;
  next();
}

async function adminAuthenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access token is missing or invalid" });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Access token is expired or invalid" });
  }
  
  const user = await DBService.findUserById(payload.userId);
  if (!user || user.email.toLowerCase().trim() !== "69nirjalmaharjan@gmail.com") {
    return res.status(403).json({ error: "Access denied. Administrator privileges are required." });
  }
  
  req.userId = payload.userId;
  req.userEmail = user.email;
  next();
}

async function seedAdminUser() {
  const adminEmail = "69nirjalmaharjan@gmail.com";
  const adminPassword = "616931367@nm";
  
  try {
    const existing = await DBService.findUserByEmail(adminEmail);
    if (!existing) {
      console.log("Seeding admin user...");
      const adminUser: DBUser = {
        id: crypto.randomUUID(),
        email: adminEmail,
        name: "Nirjal Maharjan (Admin)",
        passwordHash: hashPassword(adminPassword),
        createdAt: new Date().toISOString()
      };
      await DBService.createUser(adminUser);
      await DBService.getPreferences(adminUser.id); // implicitly creates default preferences
      console.log("Admin user successfully seeded!");
    } else {
      if (!verifyPassword(adminPassword, existing.passwordHash)) {
        console.log("Updating admin password hash...");
        existing.passwordHash = hashPassword(adminPassword);
        if (useFirestore && firestoreDb) {
          await firestoreDb.collection("users").doc(existing.id).set(existing);
        } else {
          const local = initDB();
          const idx = local.users.findIndex(u => u.email === adminEmail);
          if (idx !== -1) {
            local.users[idx].passwordHash = existing.passwordHash;
            saveDB(local);
          }
        }
        console.log("Admin password updated successfully!");
      }
    }
  } catch (error) {
    console.error("Failed to seed admin user:", error);
  }
}

// --- AUTHENTICATION ENDPOINTS ---

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields (email, password, name) are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await DBService.findUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Email is already registered" });
  }

  const newUser: DBUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };

  await DBService.createUser(newUser);
  await DBService.getPreferences(newUser.id); // implicitly creates default preferences

  const token = generateToken({ userId: newUser.id, email: newUser.email });
  res.status(201).json({
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt },
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await DBService.findUserByEmail(normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken({ userId: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
});

app.get("/api/auth/me", authenticate, async (req: any, res) => {
  const user = await DBService.findUserById(req.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = await DBService.findUserByEmail(email);
  if (!user) {
    // Return success to prevent email enumeration, but add detail in response
    return res.json({ success: true, message: "If the email is registered, a recovery token has been generated." });
  }

  const recoveryToken = crypto.randomBytes(24).toString("hex");
  console.log(`[PASSWORD RESET] Generated recovery token for ${user.email}: ${recoveryToken}`);

  res.json({
    success: true,
    message: "Recovery link generated successfully",
    debugToken: recoveryToken, // Returned for easy UI forgot-password simulation/override!
  });
});

// --- FAVORITES ENDPOINTS ---

app.get("/api/favorites", authenticate, async (req: any, res) => {
  const userFavs = await DBService.getFavorites(req.userId);
  res.json(userFavs);
});

app.post("/api/favorites", authenticate, async (req: any, res) => {
  const { id, name, country, state, lat, lon } = req.body;
  if (!id || !name || !country || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: "Missing favorite information" });
  }

  const userFavs = await DBService.getFavorites(req.userId);
  // Check duplicate
  const exists = userFavs.some((f) => f.id === id);
  if (exists) {
    return res.json({ message: "City is already in favorites" });
  }

  const newFavorite: DBFavorite = {
    userId: req.userId,
    id,
    name,
    country,
    state,
    lat: Number(lat),
    lon: Number(lon),
    addedAt: new Date().toISOString(),
  };

  await DBService.addFavorite(newFavorite);
  res.status(201).json(newFavorite);
});

app.delete("/api/favorites/:id", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const deleted = await DBService.deleteFavorite(req.userId, id);
  if (!deleted) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  res.json({ success: true });
});

app.post("/api/favorites/reorder", authenticate, async (req: any, res) => {
  const { reorderedIds } = req.body; // array of IDs in order
  if (!Array.isArray(reorderedIds)) {
    return res.status(400).json({ error: "Invalid body format" });
  }

  const reorderedFavs = await DBService.reorderFavorites(req.userId, reorderedIds);
  res.json(reorderedFavs);
});

// --- SEARCH HISTORY ENDPOINTS ---

app.get("/api/history", authenticate, async (req: any, res) => {
  const userHistory = await DBService.getHistory(req.userId);
  res.json(userHistory);
});

app.post("/api/history", authenticate, async (req: any, res) => {
  const { id, name, country, state, lat, lon } = req.body;
  if (!id || !name || !country || lat === undefined || lon === undefined) {
    return res.status(400).json({ error: "Missing history item information" });
  }

  const newHistory: DBSearchHistory = {
    userId: req.userId,
    id,
    name,
    country,
    state,
    lat: Number(lat),
    lon: Number(lon),
    searchedAt: new Date().toISOString(),
  };

  await DBService.addHistory(newHistory);
  res.status(201).json(newHistory);
});

app.delete("/api/history", authenticate, async (req: any, res) => {
  await DBService.clearHistory(req.userId);
  res.json({ success: true });
});

// --- USER PREFERENCES ENDPOINTS ---

app.get("/api/preferences", authenticate, async (req: any, res) => {
  const prefs = await DBService.getPreferences(req.userId);
  res.json(prefs);
});

app.post("/api/preferences", authenticate, async (req: any, res) => {
  const { tempUnit, windUnit, theme, notificationsEnabled } = req.body;
  const updated = await DBService.updatePreferences(req.userId, {
    tempUnit,
    windUnit,
    theme,
    notificationsEnabled,
  });
  res.json(updated);
});

// --- WEATHER PROXY API ENDPOINTS ---

// Geocoding Proxy
app.get("/api/weather/search", async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`
    );
    if (!response.ok) {
      throw new Error("Geocoding API request failed");
    }
    const data: any = await response.json();
    const results = (data.results || []).map((item: any) => ({
      id: `${item.latitude.toFixed(4)},${item.longitude.toFixed(4)}`,
      name: item.name,
      country: item.country,
      state: item.admin1,
      lat: item.latitude,
      lon: item.longitude,
      timezone: item.timezone || "UTC",
      population: item.population,
    }));
    res.json(results);
  } catch (error: any) {
    console.error("Geocoding proxy error:", error);
    res.status(500).json({ error: "Failed to fetch geocoding suggestions" });
  }
});

// Reverse Geocoding Proxy (retrieve city by lat/lon)
app.get("/api/weather/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;
  if (lat === undefined || lon === undefined) {
    return res.status(400).json({ error: "Parameters 'lat' and 'lon' are required" });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      {
        headers: {
          "User-Agent": "ModernWeatherDashboard/1.0 (contact: nirzalmhrjn87@gmail.com)",
        },
      }
    );

    let name = "Custom Location";
    let country = "Unknown";
    let state = undefined;

    if (response.ok) {
      const data: any = await response.json();
      if (data && data.address) {
        name = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || "Custom Location";
        country = data.address.country || "Unknown";
        state = data.address.state || data.address.region;
      }
    }

    res.json({
      name,
      country,
      state,
      lat: Number(lat),
      lon: Number(lon),
    });
  } catch (error: any) {
    console.error("Reverse geocoding error:", error);
    // Silent fallback
    res.json({
      name: `Lat: ${Number(lat).toFixed(2)}`,
      country: `Lon: ${Number(lon).toFixed(2)}`,
      lat: Number(lat),
      lon: Number(lon),
    });
  }
});

// Unified Weather & Air Quality Endpoint
app.get("/api/weather", async (req, res) => {
  const { lat, lon, name, country, state } = req.query;
  if (lat === undefined || lon === undefined) {
    return res.status(400).json({ error: "Parameters 'lat' and 'lon' are required" });
  }

  const numLat = Number(lat);
  const numLon = Number(lon);

  try {
    // 1. Fetch Weather and Forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${numLat}&longitude=${numLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index,dew_point_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${numLat}&longitude=${numLon}&current=european_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airQualityUrl),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API returned status ${weatherRes.status}`);
    }

    const weatherData: any = await weatherRes.json();
    let aqiData: any = null;
    if (aqiRes.ok) {
      aqiData = await aqiRes.json();
    }

    // Process Weather Current
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    const daily = weatherData.daily;

    const timezone = weatherData.timezone || "UTC";
    const timezoneOffset = weatherData.utc_offset_seconds || 0;

    // Calculate sunrise / sunset formatted strings
    const currentDaySunriseISO = daily.sunrise?.[0] || "";
    const currentDaySunsetISO = daily.sunset?.[0] || "";

    const formatISOToLocalTime = (isoString: string) => {
      if (!isoString) return "--:--";
      try {
        const date = new Date(isoString);
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      } catch {
        return "--:--";
      }
    };

    // Construct local current time based on timezone offset
    const utcTime = new Date().getTime();
    const localTimeDate = new Date(utcTime + timezoneOffset * 1000);
    const localTimeStr = localTimeDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const currentWeatherMap = {
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      pressure: current.pressure_msl,
      // Open-Meteo doesn't natively supply visibility, we approximate it using cloud cover or set standard
      visibility: current.cloud_cover > 80 ? 8 - current.cloud_cover / 20 : 10,
      uvIndex: hourly.uv_index?.[0] || 0,
      dewPoint: hourly.dew_point_2m?.[0] || (current.temperature_2m - (100 - current.relative_humidity_2m) / 5),
      cloudCover: current.cloud_cover,
      sunrise: formatISOToLocalTime(currentDaySunriseISO),
      sunset: formatISOToLocalTime(currentDaySunsetISO),
      localTime: localTimeStr,
      conditionCode: current.weather_code,
      timezone: timezone,
      isDay: current.is_day === 1,
    };

    // Process Hourly (next 24 entries)
    const hourlyList = [];
    const nowIndex = 0; // standard hourly forecast
    for (let i = 0; i < 24; i++) {
      const idx = nowIndex + i;
      if (hourly.time?.[idx]) {
        const hTime = new Date(hourly.time[idx]);
        const hTimeStr = hTime.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
        hourlyList.push({
          time: hTimeStr,
          temp: hourly.temperature_2m[idx],
          precipProb: hourly.precipitation_probability[idx] || 0,
          conditionCode: hourly.weather_code[idx],
          windSpeed: hourly.wind_speed_10m[idx],
          humidity: hourly.relative_humidity_2m[idx],
        });
      }
    }

    // Process Daily (7 entries)
    const dailyList = [];
    for (let i = 0; i < 7; i++) {
      if (daily.time?.[i]) {
        const dDate = new Date(daily.time[i]);
        const dayLabel = dDate.toLocaleDateString("en-US", { weekday: "short" });
        dailyList.push({
          date: dayLabel,
          maxTemp: daily.temperature_2m_max[i],
          minTemp: daily.temperature_2m_min[i],
          conditionCode: daily.weather_code[i],
          precipProb: daily.precipitation_probability_max[i] || 0,
          uvIndex: daily.uv_index_max[i] || 0,
          sunrise: formatISOToLocalTime(daily.sunrise[i]),
          sunset: formatISOToLocalTime(daily.sunset[i]),
        });
      }
    }

    // Process Air Quality
    const aqiVal = aqiData?.current?.european_aqi || 25; // default 25 (Good)
    const pm25 = aqiData?.current?.pm2_5 || 8.4;
    const pm10 = aqiData?.current?.pm10 || 12.0;
    const co = aqiData?.current?.carbon_monoxide || 250;
    const no2 = aqiData?.current?.nitrogen_dioxide || 15;
    const o3 = aqiData?.current?.ozone || 45;
    const so2 = aqiData?.current?.sulphur_dioxide || 1.8;

    let rating: any = "Good";
    let colorClass = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    let recommendation = "Air quality is highly satisfactory and poses little or no risk.";

    if (aqiVal > 100) {
      rating = "Extreme";
      colorClass = "text-rose-500 border-rose-500/20 bg-rose-500/5";
      recommendation = "Health warning of emergency conditions. Everyone should avoid outdoor activities.";
    } else if (aqiVal > 75) {
      rating = "Very Poor";
      colorClass = "text-red-400 border-red-500/20 bg-red-500/5";
      recommendation = "Active children and adults, and people with respiratory disease, should avoid prolonged outdoor exertion.";
    } else if (aqiVal > 50) {
      rating = "Poor";
      colorClass = "text-orange-400 border-orange-500/20 bg-orange-500/5";
      recommendation = "Sensitive groups may experience health effects. Consider reducing heavy or prolonged outdoor exertion.";
    } else if (aqiVal > 25) {
      rating = "Moderate";
      colorClass = "text-amber-400 border-amber-500/20 bg-amber-500/5";
      recommendation = "Air quality is acceptable. However, people sensitive to ozone should consider limiting outdoor activity.";
    } else if (aqiVal > 15) {
      rating = "Fair";
      colorClass = "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
      recommendation = "Air quality is ideal for most outdoor activities.";
    }

    const airQuality = {
      aqi: aqiVal,
      pm25,
      pm10,
      co,
      no2,
      o3,
      so2,
      rating,
      colorClass,
      recommendation,
    };

    // Return unified Response
    res.json({
      location: {
        name: (name as string) || "Custom Location",
        country: (country as string) || "Unknown",
        state: (state as string) || undefined,
        lat: numLat,
        lon: numLon,
        timezone,
      },
      current: currentWeatherMap,
      hourly: hourlyList,
      daily: dailyList,
      airQuality,
    });
  } catch (error: any) {
    console.error("Weather proxy full error:", error);
    res.status(500).json({ error: error.message || "Failed to compile weather data" });
  }
});

// --- GLOBAL ALERTS (Announcement Bulletin board) ---
app.get("/api/alerts/global", async (req, res) => {
  try {
    const alerts = await DBService.getAdminAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to load global advisories" });
  }
});

// --- ADMIN LEVEL REGISTRY VIEWS ---
app.get("/api/admin/stats", adminAuthenticate, async (req: any, res) => {
  try {
    const stats = await DBService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to load system stats" });
  }
});

app.get("/api/admin/users", adminAuthenticate, async (req: any, res) => {
  try {
    const users = await DBService.getAllUsers();
    // Do not return passwordHash for absolute safety
    const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to gather registered subscriber base" });
  }
});

app.delete("/api/admin/delete-user/:id", adminAuthenticate, async (req: any, res) => {
  try {
    const userId = req.params.id;
    // Prevent self-deletion
    if (userId === req.userId) {
      return res.status(400).json({ error: "Self deactivation of current session is prevented" });
    }
    
    // Check if user is protected
    const userToDelete = await DBService.findUserById(userId);
    if (userToDelete && userToDelete.email.toLowerCase().trim() === "69nirjalmaharjan@gmail.com") {
      return res.status(400).json({ error: "Self-deletion of administrator account is prevented" });
    }

    const success = await DBService.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ error: "Target subscriber not found in local directories" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to deactivate subscriber profile" });
  }
});

app.get("/api/admin/alerts", adminAuthenticate, async (req: any, res) => {
  try {
    const alerts = await DBService.getAdminAlerts();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Failed to load advisories list" });
  }
});

app.post("/api/admin/alerts", adminAuthenticate, async (req: any, res) => {
  const { title, message, severity, type } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "A title and message are required to draft a bulletin" });
  }

  try {
    const newAlert: WeatherAlert = {
      id: `admin-${Date.now()}`,
      title,
      message,
      severity: severity || "warning",
      type: type || "System Advisory",
      createdAt: new Date().toISOString(),
    };
    await DBService.addAdminAlert(newAlert);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(500).json({ error: "Failed to draft custom weather bulletin" });
  }
});

app.delete("/api/admin/alerts/:id", adminAuthenticate, async (req: any, res) => {
  try {
    const alertId = req.params.id;
    const success = await DBService.deleteAdminAlert(alertId);
    if (!success) {
      return res.status(404).json({ error: "Target bulletin advisory not found" });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to retract system bulletin" });
  }
});

// Setup development or production build system
async function startServer() {
  // Seed the admin credentials
  await seedAdminUser();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
