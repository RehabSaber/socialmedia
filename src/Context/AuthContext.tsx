import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import axios from "axios";

export const AuthContext = createContext<any>(null);

const PROFILE_URL = "https://route-posts.routemisr.com/users/profile-data";

export default function AuthContextProvider({ children }: { children: ReactNode }) {
  const [UserLogin, setUserLogin] = useState<string | null>(
    localStorage.getItem("userToken")
  );
  const [userData, setUserData] = useState<any>(null);

  const fetchUser = useCallback(async (token: string) => {
    try {
      const { data } = await axios.get(PROFILE_URL, {
        headers: { token, Authorization: `Bearer ${token}` },
      });
     
      const user = data?.data?.user ?? data?.user ?? data?.data ?? null;
      if (user && typeof user === "object") {
        setUserData(user);
      } else {
        console.error("Unexpected profile-data response:", data);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, []);

  useEffect(() => {
    if (!UserLogin) {
      setUserData(null);
      return;
    }
    fetchUser(UserLogin);
  }, [UserLogin, fetchUser]);


  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("userToken");
    if (token) await fetchUser(token);
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ UserLogin, setUserLogin, userData, setUserData, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}