import Navbar from "./../Components/Navbar/Navbar";
import Footer from "./../Components/Footer/Footer";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from './../Sidebar/Sidebar';
import SuggestedFriends from './../SuggestedFriends/SuggestedFriends';

export default function Layout() {
  const location = useLocation();
 
  const isFullWidthPage = location.pathname.includes("/profile") || location.pathname.includes("/notifications");

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <div className={`flex gap-6 items-start ${isFullWidthPage ? "justify-center" : ""}`}>
        
          {!isFullWidthPage && (
            <aside className="hidden lg:block w-64 shrink-0 sticky top-20">
              <Sidebar />
            </aside>
          )}

          <section className={`flex-1 min-w-0 ${isFullWidthPage ? "max-w-5xl w-full" : ""}`}>
            <Outlet />
          </section>

          {!isFullWidthPage && (
            <aside className="hidden xl:block w-80 shrink-0 sticky top-20">
              <SuggestedFriends />
            </aside>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}