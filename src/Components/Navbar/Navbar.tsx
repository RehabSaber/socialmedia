import { useContext, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AuthContext } from "../../Context/AuthContext";
import { HiOutlineHome, HiOutlineUser, HiOutlineBell, HiOutlineCog6Tooth } from "react-icons/hi2";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { FiLogOut } from "react-icons/fi";
import routeLogo from "../../assets/route.png";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const { UserLogin, setUserLogin, userData } = useContext(AuthContext);
  const navigate = useNavigate();
  const { data: notifData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const token =
        localStorage.getItem("userToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("user") ||
        "";
      const res = await axios.get(
        "https://route-posts.routemisr.com/notifications?page=1&limit=50",
        { headers: { token } }
      );
      return res.data;
    },
    enabled: !!UserLogin,
    refetchInterval: 30000,
  });

  const rawList =
    notifData?.data?.notifications ||
    notifData?.notifications ||
    notifData?.data ||
    notifData?.results ||
    notifData;

  const notifList: any[] = Array.isArray(rawList) ? rawList : [];

  const unreadCount = notifList.filter(
    (item) => !Boolean(item.isRead ?? item.read ?? item.status === "read")
  ).length;

  function logout() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("token");
    setUserLogin(null);
    navigate("/login");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "flex items-center gap-2 px-5 py-2 rounded-full bg-white text-blue-600 font-bold shadow-sm transition-all"
      : "flex items-center gap-2 px-5 py-2 rounded-full text-slate-600 hover:text-blue-600 font-medium transition-all";

  const defaultAvatar = "https://route-posts.routemisr.com/uploads/default-profile.png";

  return (
    <nav className="bg-slate-50 border-b border-slate-200 sticky top-0 z-50 py-3 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={routeLogo} 
            alt="Route Logo" 
            className="w-10 h-10 rounded-xl object-cover" 
          />
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Route Posts
          </span>
        </Link>

        {UserLogin ? (
          <>
            <div className="hidden md:flex items-center bg-slate-200/60 p-1 rounded-full gap-1 border border-slate-200/50">
              <NavLink to="/" className={navLinkClass}>
                <HiOutlineHome className="text-xl" />
                <span>Feed</span>
              </NavLink>
              
              <NavLink to="/profile" className={navLinkClass}>
                <HiOutlineUser className="text-xl" />
                <span>Profile</span>
              </NavLink>

              <NavLink to="/notifications" className={navLinkClass}>
                <span className="relative">
                  <HiOutlineBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-4.5 h-4.5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span>Notifications</span>
              </NavLink>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-sm"
              >
                <img
                  src={userData?.photo ? userData.photo : defaultAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-semibold text-slate-800 text-sm hidden sm:inline">
                  {userData?.name || "User"}
                </span>
                <HiOutlineMenuAlt3 className="text-slate-500 text-lg" />
              </button>

              {isDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 transition-all"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 sm:hidden">
                    <p className="text-sm font-bold text-slate-800">{userData?.name || "User"}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <HiOutlineUser className="text-lg text-slate-500" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    <HiOutlineCog6Tooth className="text-lg text-slate-500" />
                    <span>Settings</span>
                  </Link>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors text-left cursor-pointer"
                  >
                    <FiLogOut className="text-lg text-rose-500" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink to="/register" className="text-slate-600 hover:text-blue-600 font-medium text-sm px-3 py-2">
              Register
            </NavLink>
            <NavLink to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Login
            </NavLink>
          </div>
        )}

      </div>
    </nav>
  );
}