import { db } from "./firebase";
import { ref, get, set, remove } from "firebase/database";
import {
  decrypt,
  isEncrypted,
  encryptUser,
  decryptUser,
  encryptType,
  decryptType,
  encryptHistoryItem,
  decryptHistoryItem,
} from "../utils/encryption";

const MIGRATION_FLAG_KEY = "@fireheart_firebase_field_encryption_migration_done_v2";

// Keys used in localStorage (representing mobile's AsyncStorage)
const KEYS = {
  HISTORY: "@fireheart_history_v1",
  TYPES: "@fireheart_types_v1",
  USERS: "@fireheart_users_v1",
};

// Types definition
export interface DateHistory {
  id: string;
  time: string; // ISO 8601
  type: string; // Type name or ID
  note: string;
  imageList: string[]; // Google Drive links
  reason: string;
}

export interface DateType {
  id: string;
  name: string;
  deleteAt?: string | null;
}

export interface DateUser {
  id: string; // 'user_1' or 'user_2'
  name: string;
  phone: string;
  facebook: string;
  tiktok: string;
  interest: string[];
  dislike: string[];
  hate: string[];
  height: number;
  weight: number;
  birthday: string; // YYYY-MM-DD
  gender: "Nam" | "Nữ";
  shoeSize?: string;
  shirtSize?: string;
  avatar?: string;
}

export interface DateStartTime {
  acquaintedDay: string; // ngày 29/9/2025 16:00
  confessionDay: string; // ngày 1/1/2026 21:30
}

// Fixed milestones, read-only
const DATE_START_TIME: DateStartTime = {
  acquaintedDay: "2025-09-29T16:00:00+07:00",
  confessionDay: "2026-01-01T21:30:00+07:00",
};

// Default Date Types to seed on first run
const DEFAULT_DATE_TYPES: DateType[] = [
  { id: "type_1", name: "Đi ăn uống 🍽️" },
  { id: "type_2", name: "Xem phim 🎬" },
  { id: "type_3", name: "Đi dạo phố 🚶‍♂️🚶‍♀️" },
  { id: "type_4", name: "Cà phê trò chuyện ☕" },
  { id: "type_5", name: "Du lịch nghỉ dưỡng ✈️" },
];

export const AsyncStorageService = {
  // --- Start Milestones ---
  getStartTime(): DateStartTime {
    return DATE_START_TIME;
  },

  // --- DateUser Operations ---
  async getUsers(): Promise<DateUser[]> {
    try {
      const snapshot = await get(ref(db, "/users"));
      const val = snapshot.val();
      if (!val) return [];
      if (typeof val === "string") {
        const decrypted = decrypt(val);
        if (!decrypted) return [];
        const parsed = JSON.parse(decrypted) as DateUser[];
        // Auto-migrate to new field-level encrypted format
        await set(ref(db, "/users"), parsed.map(encryptUser));
        return parsed;
      }
      if (Array.isArray(val) || typeof val === "object") {
        const list: any[] = Array.isArray(val) ? val : Object.values(val);
        const parsed = list.filter(Boolean).map(decryptUser);
        const needsReSave = list.some(item => item && !isEncrypted(item.name));
        if (needsReSave) {
          await set(ref(db, "/users"), parsed.map(encryptUser));
        }
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Firebase getUsers failed:", error);
      return [];
    }
  },

  async saveUsers(user1: DateUser, user2: DateUser): Promise<void> {
    // Force specific IDs for consistent 2-user layout
    const formattedUser1 = { ...user1, id: "user_1" };
    const formattedUser2 = { ...user2, id: "user_2" };
    const data = [formattedUser1, formattedUser2];
    await set(ref(db, "/users"), data.map(encryptUser));
  },

  // --- DateType Operations ---
  async getTypes(includeArchived = false): Promise<DateType[]> {
    try {
      const snapshot = await get(ref(db, "/types"));
      const val = snapshot.val();
      let types: DateType[] | null = null;
      if (val !== null) {
        if (typeof val === "string") {
          const decrypted = decrypt(val);
          if (decrypted) {
            types = JSON.parse(decrypted) as DateType[];
            await set(ref(db, "/types"), types.map(encryptType));
          }
        } else if (Array.isArray(val) || typeof val === "object") {
          const list: any[] = Array.isArray(val) ? val : Object.values(val);
          types = list.filter(Boolean).map(decryptType);
          const needsReSave = list.some(item => item && !isEncrypted(item.name));
          if (needsReSave) {
            await set(ref(db, "/types"), types.map(encryptType));
          }
        }
      }
      if (types === null) {
        // Seed default types
        await set(ref(db, "/types"), DEFAULT_DATE_TYPES.map(encryptType));
        types = DEFAULT_DATE_TYPES;
      }
      if (!includeArchived) {
        return types.filter(t => !t.deleteAt);
      }
      return types;
    } catch (error) {
      console.error("Firebase getTypes failed:", error);
      return [];
    }
  },

  async saveTypes(types: DateType[]): Promise<void> {
    await set(ref(db, "/types"), types.map(encryptType));
  },

  async addType(name: string): Promise<DateType> {
    const types = await this.getTypes(true);

    // Check if there is an archived category with the same name (case-insensitive)
    const archivedIndex = types.findIndex(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase() && t.deleteAt
    );

    if (archivedIndex !== -1) {
      // Restore it
      types[archivedIndex].deleteAt = null;
      await this.saveTypes(types);
      return types[archivedIndex];
    }

    // Check if there is an active category with the same name, to avoid duplication
    const activeExist = types.find(
      (t) => t.name.toLowerCase() === name.trim().toLowerCase() && !t.deleteAt
    );
    if (activeExist) {
      return activeExist;
    }

    const newType: DateType = {
      id: `type_${Date.now()}`,
      name: name.trim(),
      deleteAt: null,
    };
    types.push(newType);
    await this.saveTypes(types);
    return newType;
  },

  async updateType(id: string, newName: string): Promise<void> {
    const types = await this.getTypes(true);
    const index = types.findIndex((t) => t.id === id);
    if (index !== -1) {
      types[index].name = newName.trim();
      await this.saveTypes(types);
    }
  },

  async deleteType(id: string): Promise<void> {
    const types = await this.getTypes(true);
    const targetType = types.find((t) => t.id === id);
    if (!targetType) return;

    const history = await this.getHistory();
    const isLinked = history.some(
      (h) => h.type.toLowerCase() === targetType.name.toLowerCase()
    );

    let updatedTypes: DateType[];
    if (isLinked) {
      // Archive it: set deleteAt to the current date/time
      updatedTypes = types.map((t) => {
        if (t.id === id) {
          return { ...t, deleteAt: new Date().toISOString() };
        }
        return t;
      });
    } else {
      // Delete completely
      updatedTypes = types.filter((t) => t.id !== id);
    }

    await this.saveTypes(updatedTypes);
  },

  // --- DateHistory Operations ---
  async getHistory(): Promise<DateHistory[]> {
    try {
      const snapshot = await get(ref(db, "/history"));
      const val = snapshot.val();
      if (!val) return [];
      if (typeof val === "string") {
        const decrypted = decrypt(val);
        if (!decrypted) return [];
        const parsed = JSON.parse(decrypted) as DateHistory[];
        await set(ref(db, "/history"), parsed.map(encryptHistoryItem));
        return parsed;
      }
      if (Array.isArray(val) || typeof val === "object") {
        const list: any[] = Array.isArray(val) ? val : Object.values(val);
        const parsed = list.filter(Boolean).map(decryptHistoryItem);
        const needsReSave = list.some(item => item && !isEncrypted(item.time));
        if (needsReSave) {
          await set(ref(db, "/history"), parsed.map(encryptHistoryItem));
        }
        return parsed;
      }
      return [];
    } catch (error) {
      console.error("Firebase getHistory failed:", error);
      return [];
    }
  },

  async saveHistoryList(history: DateHistory[]): Promise<void> {
    await set(ref(db, "/history"), history.map(encryptHistoryItem));
  },

  async addHistoryItem(item: Omit<DateHistory, "id">): Promise<DateHistory> {
    const history = await this.getHistory();
    const newItem: DateHistory = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    };
    history.unshift(newItem); // New events at the top
    await this.saveHistoryList(history);
    return newItem;
  },

  async updateHistoryItem(id: string, updatedFields: Partial<Omit<DateHistory, "id">>): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error("Không tìm thấy sự kiện cần cập nhật.");
    }

    const currentItem = history[index];

    // Merge modifications
    history[index] = {
      ...currentItem,
      ...updatedFields,
    };
    await this.saveHistoryList(history);
  },

  async deleteHistoryItem(id: string): Promise<void> {
    const history = await this.getHistory();
    const index = history.findIndex((h) => h.id === id);
    if (index === -1) {
      throw new Error("Không tìm thấy sự kiện cần xóa.");
    }

    const filtered = history.filter((h) => h.id !== id);
    await this.saveHistoryList(filtered);
  },

  // --- Clear & Import ---
  async clearAll(): Promise<void> {
    await remove(ref(db));
    localStorage.removeItem("@fireheart_firebase_migration_done");
    localStorage.removeItem("@fireheart_firebase_encryption_migration_done");
    localStorage.removeItem(MIGRATION_FLAG_KEY);
  },

  /**
   * Imports raw database tables, used for restoration.
   */
  async importRawBackup(data: { history: any; types: any; users: any }): Promise<void> {
    if (data.users) {
      let parsedUsers: DateUser[] = [];
      if (typeof data.users === "string") {
        const decrypted = decrypt(data.users);
        if (decrypted) parsedUsers = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.users) ? data.users : Object.values(data.users);
        parsedUsers = list.filter(Boolean).map(decryptUser);
      }
      await set(ref(db, "/users"), parsedUsers.map(encryptUser));
    } else {
      throw new Error("Dữ liệu sao lưu không chứa đúng người dùng.");
    }

    if (data.types) {
      let parsedTypes: DateType[] = [];
      if (typeof data.types === "string") {
        const decrypted = decrypt(data.types);
        if (decrypted) parsedTypes = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.types) ? data.types : Object.values(data.types);
        parsedTypes = list.filter(Boolean).map(decryptType);
      }
      await set(ref(db, "/types"), parsedTypes.map(encryptType));
    }

    if (data.history) {
      let parsedHistory: DateHistory[] = [];
      if (typeof data.history === "string") {
        const decrypted = decrypt(data.history);
        if (decrypted) parsedHistory = JSON.parse(decrypted);
      } else {
        const list = Array.isArray(data.history) ? data.history : Object.values(data.history);
        parsedHistory = list.filter(Boolean).map(decryptHistoryItem);
      }
      await set(ref(db, "/history"), parsedHistory.map(encryptHistoryItem));
    }
  },

  /**
   * Exports raw database tables as JSON, used for backup creation.
   */
  async exportRawBackup(): Promise<{ history: any; types: any; users: any }> {
    const snapshotHistory = await get(ref(db, "/history"));
    const snapshotTypes = await get(ref(db, "/types"));
    const snapshotUsers = await get(ref(db, "/users"));

    return {
      history: snapshotHistory.val() || [],
      types: snapshotTypes.val() || [],
      users: snapshotUsers.val() || [],
    };
  },

  /**
   * One-time migration script from localStorage to Firebase Realtime Database.
   */
  async runFirebaseMigrationIfNeeded(): Promise<void> {
    try {
      const migrationDone = localStorage.getItem("@fireheart_firebase_migration_done");
      if (migrationDone === "true") {
        return; // Already migrated
      }

      console.log("[Migration] Starting Firebase migration...");

      // 1. Get old local users
      const rawUsers = localStorage.getItem(KEYS.USERS);
      let users: DateUser[] = [];
      if (rawUsers) {
        const decrypted = decrypt(rawUsers);
        if (decrypted) users = JSON.parse(decrypted);
      }

      // 2. Get old local types
      const rawTypes = localStorage.getItem(KEYS.TYPES);
      let types: DateType[] = [];
      if (rawTypes) {
        const decrypted = decrypt(rawTypes);
        if (decrypted) types = JSON.parse(decrypted);
      }

      // 3. Get old local history
      const rawHistory = localStorage.getItem(KEYS.HISTORY);
      let history: DateHistory[] = [];
      if (rawHistory) {
        const decrypted = decrypt(rawHistory);
        if (decrypted) history = JSON.parse(decrypted);
      }

      // If there is no local data, just set flag and exit
      if (users.length === 0 && types.length === 0 && history.length === 0) {
        localStorage.setItem("@fireheart_firebase_migration_done", "true");
        console.log("[Migration] No local data to migrate. Finished.");
        return;
      }

      console.log(`[Migration] Found local data: ${users.length} users, ${types.length} types, ${history.length} history items.`);

      // 4. Write migrated data directly to Firebase Realtime Database (encrypted)
      console.log("[Migration] Saving migrated data to Firebase Realtime Database...");
      if (users.length > 0) {
        await set(ref(db, "/users"), users.map(encryptUser));
      }
      if (types.length > 0) {
        await set(ref(db, "/types"), types.map(encryptType));
      }
      if (history.length > 0) {
        await set(ref(db, "/history"), history.map(encryptHistoryItem));
      }

      // Mark as completed
      localStorage.setItem("@fireheart_firebase_migration_done", "true");
      console.log("[Migration] Firebase migration completed successfully!");
    } catch (error) {
      console.error("[Migration] Firebase migration failed:", error);
    }
  },

  /**
   * Scans existing Firebase Realtime Database data and encrypts it if it's plain text (array/object).
   */
  async encryptFirebaseDataIfNeeded(): Promise<void> {
    try {
      const encryptionDone = localStorage.getItem(MIGRATION_FLAG_KEY);
      if (encryptionDone === "true") {
        return; // Already checked and migrated
      }

      console.log("[Encryption Migration] Checking if Firebase Realtime Database needs migration to field-level encryption...");

      let changed = false;

      // 1. Migrate users
      const snapshotUsers = await get(ref(db, "/users"));
      const usersVal = snapshotUsers.val();
      if (usersVal) {
        if (typeof usersVal === "string") {
          console.log("[Encryption Migration] Migrating /users from string to field-encrypted...");
          const decrypted = decrypt(usersVal);
          if (decrypted) {
            const parsed = JSON.parse(decrypted) as DateUser[];
            await set(ref(db, "/users"), parsed.map(encryptUser));
            changed = true;
          }
        } else if (Array.isArray(usersVal) || typeof usersVal === "object") {
          const list = Array.isArray(usersVal) ? usersVal : Object.values(usersVal);
          const parsed = list.filter(Boolean).map(decryptUser);
          const needsReSave = list.some(item => item && !isEncrypted(item.name));
          if (needsReSave) {
            console.log("[Encryption Migration] Encrypting plain /users...");
            await set(ref(db, "/users"), parsed.map(encryptUser));
            changed = true;
          }
        }
      }

      // 2. Migrate types
      const snapshotTypes = await get(ref(db, "/types"));
      const typesVal = snapshotTypes.val();
      if (typesVal) {
        if (typeof typesVal === "string") {
          console.log("[Encryption Migration] Migrating /types from string to field-encrypted...");
          const decrypted = decrypt(typesVal);
          if (decrypted) {
            const parsed = JSON.parse(decrypted) as DateType[];
            await set(ref(db, "/types"), parsed.map(encryptType));
            changed = true;
          }
        } else if (Array.isArray(typesVal) || typeof typesVal === "object") {
          const list = Array.isArray(typesVal) ? typesVal : Object.values(typesVal);
          const parsed = list.filter(Boolean).map(decryptType);
          const needsReSave = list.some(item => item && !isEncrypted(item.name));
          if (needsReSave) {
            console.log("[Encryption Migration] Encrypting plain /types...");
            await set(ref(db, "/types"), parsed.map(encryptType));
            changed = true;
          }
        }
      }

      // 3. Migrate history
      const snapshotHistory = await get(ref(db, "/history"));
      const historyVal = snapshotHistory.val();
      if (historyVal) {
        if (typeof historyVal === "string") {
          console.log("[Encryption Migration] Migrating /history from string to field-encrypted...");
          const decrypted = decrypt(historyVal);
          if (decrypted) {
            const parsed = JSON.parse(decrypted) as DateHistory[];
            await set(ref(db, "/history"), parsed.map(encryptHistoryItem));
            changed = true;
          }
        } else if (Array.isArray(historyVal) || typeof historyVal === "object") {
          const list = Array.isArray(historyVal) ? historyVal : Object.values(historyVal);
          const parsed = list.filter(Boolean).map(decryptHistoryItem);
          const needsReSave = list.some(item => item && !isEncrypted(item.time));
          if (needsReSave) {
            console.log("[Encryption Migration] Encrypting plain /history...");
            await set(ref(db, "/history"), parsed.map(encryptHistoryItem));
            changed = true;
          }
        }
      }

      localStorage.setItem(MIGRATION_FLAG_KEY, "true");
      console.log("[Encryption Migration] Firebase Realtime Database field encryption migration completed. Changed: " + changed);
    } catch (error) {
      console.error("[Encryption Migration] Failed to migrate Firebase data:", error);
    }
  },
};
