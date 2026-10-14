import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "https://route-posts.routemisr.com";
const FALLBACK_AVATAR =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";


const postRoute = (id: string) => `/PostDetails/${id}`;
const profileRoute = (id: string) => `/profile/${id}`;

const getToken = () =>
  localStorage.getItem("userToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("user") ||
  "";

const isRead = (item: any) =>
  Boolean(item.isRead ?? item.read ?? item.status === "read");

const getType = (item: any) =>
  String(item.type || item.action || "").toLowerCase();

const getActionText = (item: any) => {
  const type = getType(item);
  if (type.includes("like")) return "liked your post";
  if (type.includes("comment") || type.includes("reply")) return "commented on your post";
  if (type.includes("share")) return "shared your post";
  if (type.includes("follow")) return "started following you";
  return item.body || item.message || item.text || "interacted with your post";
};

const getUser = (item: any) => {
  const u =
    [item.actor, item.sender, item.actionUser, item.user].find(
      (x) => x && typeof x === "object"
    ) || {};
  const rawId =
    u._id ||
    u.id ||
    (typeof item.actor === "string" ? item.actor : undefined) ||
    (typeof item.sender === "string" ? item.sender : undefined) ||
    (typeof item.user === "string" ? item.user : undefined);
  return {
    id: rawId ? String(rawId) : "",
    name: u.name || u.first_name || item.userName || "User",
    photo: u.photo || u.profilePhoto || u.avatar || item.userPhoto || FALLBACK_AVATAR,
  };
};

const getPostId = (item: any) => {
  const candidates = [
    item.entityId,
    item.postId,
    typeof item.post === "string" ? item.post : item.post?._id || item.post?.id,
    item.entity?._id,
    item.entity?.id,
  ];
  const found = candidates.find(Boolean);
  return found ? String(found) : "";
};

const getPostBody = (item: any) =>
  item.post?.body || item.entity?.body || item.postBody || "";

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

function TypeIcon({ type }: { type: string }) {
  if (type.includes("like"))
    return (
      <span className="w-6 h-6 rounded-full border border-red-200 bg-red-50 text-red-500 flex items-center justify-center">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      </span>
    );
  if (type.includes("share"))
    return (
      <span className="w-6 h-6 rounded-full border border-green-200 bg-green-50 text-green-500 flex items-center justify-center">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.31l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
      </span>
    );
  return (
    <span className="w-6 h-6 rounded-full border border-blue-200 bg-blue-50 text-blue-500 flex items-center justify-center">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = getToken();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await axios.get(`${API}/notifications?page=1&limit=50`, { headers: { token } })).data,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: async () =>
      (await axios.get(`${API}/notifications/unread-count`, { headers: { token } })).data,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
  };

  const markAllAsReadMutation = useMutation({
    mutationFn: () => axios.patch(`${API}/notifications/read-all`, {}, { headers: { token } }),
    onSuccess: refresh,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      axios.patch(`${API}/notifications/${id}/read`, {}, { headers: { token } }),
    onSuccess: refresh,
  });

  const rawList =
    data?.data?.notifications || data?.notifications || data?.data || data?.results || data;
  const all: any[] = Array.isArray(rawList) ? rawList : [];
  const list = filter === "unread" ? all.filter((i) => !isRead(i)) : all;

  const unreadCount =
    unreadData?.count ??
    unreadData?.data?.count ??
    unreadData?.unreadCount ??
    all.filter((i) => !isRead(i)).length;

 
  const handleClick = (item: any) => {
    if (!isRead(item)) markAsReadMutation.mutate(item._id || item.id);

    const postId = getPostId(item);
    const { id: userId } = getUser(item);

    if (postId && !getType(item).includes("follow")) {
      navigate(postRoute(postId));
    } else if (userId) {
      navigate(profileRoute(userId));
    }
  };

  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    if (userId) navigate(profileRoute(userId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Realtime updates for likes, comments, shares, and follows.
          </p>
        </div>
        <button
          onClick={() => markAllAsReadMutation.mutate()}
          className="text-sm font-semibold text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 px-4 py-2 rounded-xl transition border border-gray-200 cursor-pointer"
        >
          ✓ Mark all as read
        </button>
      </div>

   
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition cursor-pointer ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({all.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
            filter === "unread" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                filter === "unread" ? "bg-white text-blue-600" : "bg-blue-600 text-white"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

  
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {list.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-medium">
            {filter === "unread" ? "No unread notifications." : "No notifications available right now."}
          </div>
        ) : (
          list.map((item) => {
            const read = isRead(item);
            const type = getType(item);
            const { id: userId, name, photo } = getUser(item);
            const postBody = getPostBody(item);
            const id = item._id || item.id;

            return (
              <div
                key={id}
                onClick={() => handleClick(item)}
                className={`px-4 py-3 flex items-start justify-between gap-3 cursor-pointer transition hover:bg-gray-50 ${
                  !read ? "bg-blue-50/50" : "bg-white"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={photo}
                    alt={name}
                    onClick={(e) => handleUserClick(e, userId)}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 cursor-pointer hover:opacity-80 transition"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">
                      <span
                        onClick={(e) => handleUserClick(e, userId)}
                        className="font-bold cursor-pointer hover:underline hover:text-blue-600"
                      >
                        {name}
                      </span>{" "}
                      <span className="text-gray-700">{getActionText(item)}</span>
                    </p>

                    {postBody && (
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">{postBody}</p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <TypeIcon type={type} />
                      {!read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(id);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          ✓ Mark as read
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">✓ Read</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-gray-400 font-medium">
                    {formatTime(item.createdAt || item.created_at)}
                  </span>
                  {!read && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}