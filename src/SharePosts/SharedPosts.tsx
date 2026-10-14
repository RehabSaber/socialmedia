import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaTimes } from "react-icons/fa";

const BASE_URL = "https://route-posts.routemisr.com";

function authHeaders() {
  const token = localStorage.getItem("userToken") || "";
  return {
    token,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

interface SharePostsProps {
  post: {
    _id?: string;
    id?: string;
    body?: string;
    image?: string;
    user?: { name?: string; photo?: string; username?: string };
  };
  onClose: () => void;
}

function makeUsername(user?: { name?: string; username?: string }) {
  if (!user) return "";
  if (user.username) return `@${user.username}`;
  return user.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "";
}

export default function SharePosts({ post, onClose }: SharePostsProps) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const postId = String(post._id || post.id);

  const { mutate, isPending, error } = useMutation({
    mutationFn: async () => {
      const res = await axios.post(
        `${BASE_URL}/posts/${postId}/share`,
        { body },
        { headers: authHeaders() }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] }); // الهوم
      queryClient.invalidateQueries({ queryKey: ["myPosts"] }); // البروفايل
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-slate-900">Share post</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say something about this..."
            rows={3}
            className="w-full border border-gray-200 rounded-2xl p-4 text-sm resize-none outline-none focus:border-blue-500"
          />

          <div className="border border-gray-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={post.user?.photo || "https://via.placeholder.com/40"}
                alt={post.user?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-sm text-slate-900 leading-tight">
                  {post.user?.name}
                </p>
                <p className="text-xs text-gray-500">{makeUsername(post.user)}</p>
              </div>
            </div>

            {post.body && (
              <p className="text-sm text-slate-900 mb-3">{post.body}</p>
            )}

            {post.image && (
              <img
                src={post.image}
                alt="Post"
                className="w-full max-h-72 object-contain rounded-xl bg-black/5"
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {(error as Error).message || "Failed to share post"}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-slate-800 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isPending ? "Sharing..." : "Share now"}
          </button>
        </div>
      </div>
    </div>
  );
}