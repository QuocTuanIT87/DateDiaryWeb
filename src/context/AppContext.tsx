import React, { createContext, useContext, useState, useEffect } from "react";
import { AsyncStorageService, type DateUser } from "../services/AsyncStorageService";

interface AppContextProps {
  users: DateUser[];
  isLoading: boolean;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<DateUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = async () => {
    try {
      setIsLoading(true);
      await AsyncStorageService.runFirebaseMigrationIfNeeded();
      await AsyncStorageService.encryptFirebaseDataIfNeeded();
      const userList = await AsyncStorageService.getUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to load app context state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  return (
    <AppContext.Provider
      value={{
        users,
        isLoading,
        refreshState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
