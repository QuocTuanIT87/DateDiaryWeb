import React, { createContext, useContext, useState, useEffect } from "react";
import { AsyncStorageService, type DateUser } from "../services/AsyncStorageService";

interface AppContextProps {
  users: DateUser[];
  isLoading: boolean;
  refreshState: () => Promise<void>;
  backgroundImage: string | null;
  updateBackgroundImage: (url: string | null) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<DateUser[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = async () => {
    try {
      setIsLoading(true);

      const userList = await AsyncStorageService.getUsers();
      setUsers(userList);
      
      const bgUrl = await AsyncStorageService.getBackgroundUrl();
      setBackgroundImage(bgUrl);
    } catch (error) {
      console.error("Failed to load app context state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackgroundImage = async (url: string | null) => {
    try {
      await AsyncStorageService.setBackgroundUrl(url);
      setBackgroundImage(url);
    } catch (error) {
      console.error("Failed to update background image:", error);
      throw error;
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
        backgroundImage,
        updateBackgroundImage,
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
