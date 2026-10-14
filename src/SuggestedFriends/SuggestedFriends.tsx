import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { HiUsers } from "react-icons/hi";
import FollowOrUnfollow from "../FolloworUnfollow/FolloworUnfollow";

interface SuggestedUser {
  _id: string;
  name?: string;
  username?: string;
  photo?: string;
  followersCount?: number;
  isFollowing?: boolean;
}

const SEARCH_LIMIT = 100;

export default function SuggestedFriends() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState(10);

  const isCommunityPage = location.pathname === "/community";

  const token = localStorage.getItem("token") || localStorage.getItem("userToken");

  const trimmedSearch = searchTerm.trim();


  const effectiveLimit = trimmedSearch ? Math.max(limit, SEARCH_LIMIT) : limit;

  const {
    data: users = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<SuggestedUser[]>({
    queryKey: ["suggestedFriends", effectiveLimit],
  
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await axios.get(
        `https://route-posts.routemisr.com/users/suggestions?limit=${effectiveLimit}`,
        {
          headers: {
            token: token,
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      const list = res.data?.data?.suggestions || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) => {
    if (!trimmedSearch) return true;
    const search = trimmedSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(search) ||
      u.username?.toLowerCase().includes(search)
    );
  });

  const displayedUsers = isCommunityPage
    ? filteredUsers
    : filteredUsers.slice(0, 5);


  const hasMore = !trimmedSearch && safeUsers.length >= limit;

  return (
   
    <aside className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 font-sans sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-4 text-gray-800 shrink-0">
        <HiUsers className="text-xl text-blue-600" />
        <h3 className="font-bold text-base">
          {isCommunityPage ? "All Suggested Friends" : "Suggested Friends"}
        </h3>
      </div>

      <div className="relative mb-4 shrink-0">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search friends..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {isLoading && (
        <div className="py-8 text-center text-gray-500 text-sm">
          Loading suggestions...
        </div>
      )}

      {isError && (
        <div className="py-4 text-center text-red-500 text-sm">
          Failed to load suggestions: {(error as Error)?.message}
        </div>
      )}

      {!isLoading && !isError && (
    
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {displayedUsers.length > 0 ? (
            displayedUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-3 overflow-hidden min-w-0"
                >
                  <img
                    src={user.photo || "https://via.placeholder.com/150"}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100 shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="text-sm font-semibold text-gray-900 truncate hover:underline">
                      {user.name || "Unknown"}
                    </h4>
                    {user.username && (
                      <p className="text-xs text-gray-500 truncate">
                        @{user.username}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {user.followersCount ?? 0} followers
                    </p>
                  </div>
                </Link>

                <FollowOrUnfollow
                  userId={user._id}
                  isFollowing={user.isFollowing}
                  variant="compact"
                />
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-gray-400 py-4">
              No users found
            </p>
          )}

          {!isCommunityPage && filteredUsers.length > 5 && (
            <Link
              to="/community"
              className="w-full mt-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-xs rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              View more
            </Link>
          )}

          {isCommunityPage && hasMore && (
            <button
              onClick={() => setLimit((prev) => prev + 10)}
              disabled={isFetching}
              className="w-full mt-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium text-xs rounded-xl flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
            >
              {isFetching ? "Loading..." : "Load more users"}
            </button>
          )}
        </div>
      )}
    </aside>
  );
}