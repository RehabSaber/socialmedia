import { useContext } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FaRegBookmark, FaRegClock } from "react-icons/fa";
import Loader from "../Loader/Loader";
import SharedPostCard, { getSharedPost } from "../SharePosts/SharedPostCard";
import type { SharedPostData } from "../SharePosts/SharedPostCard";
import { AuthContext } from "../Context/AuthContext";
import TopComment from "../TopComment/TopComment";
import PostComments from "../PostComments/PostComments";
import LikePosts from "../LikePosts/LikePosts";

const BASE_URL = "https://route-posts.routemisr.com";

interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: { name: string; photo: string };
  createdAt: string;
}

export interface BookmarkItem {
  _id?: string;
  id?: string;
  body?: string;
  image?: string;
  createdAt?: string;
  likesCount?: number;
  isLiked?: boolean;
  likes?: string[];
  sharesCount?: number;
  commentsCount?: number;
  topComment?: CommentType | null;
  user?: { name?: string; photo?: string; username?: string };
  sharedPost?: SharedPostData | string | null;
  originalPost?: SharedPostData | string | null;
  sharedFrom?: SharedPostData | string | null;
}

function authHeaders() {
  const token = localStorage.getItem("userToken") || "";
  return { token, Authorization: `Bearer ${token}` };
}

function getPostId(p: BookmarkItem): string {
  return String(p._id || p.id || "");
}

function makeUsername(user?: { name?: string; username?: string }) {
  if (!user) return "";
  if (user.username) return `@${user.username}`;
  return user.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "";
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function fetchBookmarks(): Promise<BookmarkItem[]> {
  const res = await axios.get(`${BASE_URL}/users/bookmarks`, {
    headers: authHeaders(),
  });
  const body = res.data;
  const list =
    body?.data?.bookmarks ||
    body?.bookmarks ||
    body?.data?.posts ||
    body?.data ||
    [];
  return Array.isArray(list) ? list : [];
}

export function useBookmarks() {
  return useQuery<BookmarkItem[], Error>({
    queryKey: ["myBookmarks"],
    queryFn: fetchBookmarks,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      return await axios.put(
        `${BASE_URL}/posts/${postId}/bookmark`,
        {},
        { headers: authHeaders() }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
    onError: (err) => {
      console.error("Error toggling bookmark:", err);
    },
  });
}

function SavedPostCard({ post }: { post: BookmarkItem }) {
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  const author = post.user;
  const postId = getPostId(post);
  const shared = getSharedPost(post);

  const currentUserId = userData?._id || userData?.id;
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const commentsCount = post.commentsCount ?? 0;
  const isLiked =
    post.isLiked ??
    Boolean(currentUserId && post.likes?.includes(String(currentUserId)));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <img
            src={author?.photo || "https://via.placeholder.com/40"}
            alt={author?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {author?.name}
            </p>
            <p className="text-xs text-gray-500">{makeUsername(author)}</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <FaRegClock /> {formatDate(post.createdAt)}
        </span>
      </div>

      {post.body && (
        <div className="px-4 pb-3">
          <p className="text-gray-900 text-sm leading-relaxed wrap-break-word">
            {post.body}
          </p>
        </div>
      )}

      {shared && <SharedPostCard shared={shared} />}

      {!shared && post.image && (
        <div className="w-full bg-black/5 flex justify-center items-center">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}

      <div className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
          <FaRegBookmark /> Saved
        </span>
      </div>

      {postId && (
        <>
          <LikePosts
            postId={postId}
            likesCount={likesCount}
            isLiked={isLiked}
            commentsCount={commentsCount}
            sharesCount={post.sharesCount}
            onCommentClick={() => navigate(`/PostDetails/${postId}`)}
          />

          <TopComment topComment={post.topComment} />

          {commentsCount > 1 && (
            <PostComments postId={postId} commentsCount={commentsCount} />
          )}
        </>
      )}
    </div>
  );
}

export default function BookmarksPosts() {
  const { data: posts = [], isLoading, isError, error } = useBookmarks();

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <div className="text-center my-10 text-red-500 font-bold">
        Error: {error?.message || "Could not load saved posts"}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-bold text-slate-900">
          <FaRegBookmark className="text-blue-600" /> Saved posts
        </h1>
        <span className="bg-blue-50 text-blue-600 text-xs font-bold rounded-full px-3 py-1.5">
          {posts.length}
        </span>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-10">
          You haven't saved any posts yet.
        </p>
      ) : (
        posts.map((post) => (
          <SavedPostCard key={getPostId(post)} post={post} />
        ))
      )}
    </div>
  );
}