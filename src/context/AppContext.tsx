import React, { createContext, useContext, useState, useEffect } from "react";
import { AsyncStorageService, type DateUser } from "../services/AsyncStorageService";

interface AppContextProps {
  users: DateUser[];
  isLoading: boolean;
  refreshState: () => Promise<void>;
  backgroundImageDesktop: string | null;
  backgroundImageMobile: string | null;
  updateBackgroundImage: (type: "desktop" | "mobile", url: string | null) => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<DateUser[]>([]);
  const [backgroundImageDesktop, setBackgroundImageDesktop] = useState<string | null>(null);
  const [backgroundImageMobile, setBackgroundImageMobile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = async () => {
    try {
      setIsLoading(true);

      const userList = await AsyncStorageService.getUsers();
      setUsers(userList);
      
      const bgDesktop = await AsyncStorageService.getBackgroundUrl("desktop");
      const bgMobile = await AsyncStorageService.getBackgroundUrl("mobile");
      setBackgroundImageDesktop(bgDesktop);
      setBackgroundImageMobile(bgMobile);
    } catch (error) {
      console.error("Failed to load app context state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackgroundImage = async (type: "desktop" | "mobile", url: string | null) => {
    try {
      await AsyncStorageService.setBackgroundUrl(type, url);
      if (type === "desktop") {
        setBackgroundImageDesktop(url);
      } else {
        setBackgroundImageMobile(url);
      }
    } catch (error) {
      console.error(`Failed to update background image for ${type}:`, error);
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
        backgroundImageDesktop,
        backgroundImageMobile,
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
