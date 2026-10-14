import { NavLink } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi";
import { BsStars } from "react-icons/bs";
import { BiGlobe } from "react-icons/bi";
import { FiBookmark } from "react-icons/fi";

export default function Sidebar() {
  const menuItems = [
    { name: "Feed", path: "/", icon: HiOutlineDocumentText },
    { name: "My Posts", path: "/profile", icon: BsStars },
    { name: "Community", path: "/community", icon: BiGlobe },
    { name: "Saved", path: "/saved", icon: FiBookmark },
  ];

  return (
    <>
     
      <aside className="block lg:hidden bg-white rounded-2xl p-3 border border-gray-100 shadow-xs mb-6 w-full">
        <nav className="grid grid-cols-2 gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-50/70 text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                <Icon className="text-base" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

    
      <aside className="hidden lg:block fixed top-24 w-64 bg-white rounded-2xl p-3 border border-gray-100 shadow-xs z-40">
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="text-lg" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}