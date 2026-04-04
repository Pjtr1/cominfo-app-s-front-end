// UserContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

// 1️⃣ Define the User type
interface User {
  id: number;
  username: string;
  email: string;
  role: "customer" | "seller";
}

// 2️⃣ Define the context value type
interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

// 3️⃣ Create context
const UserContext = createContext<UserContextType | undefined>(undefined);

// 4️⃣ Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// 5️⃣ Hook to use the context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};