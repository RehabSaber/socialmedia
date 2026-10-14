import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  FaArrowLeft,
  FaGlobeAmericas,
  FaEllipsisH,
  FaRegBookmark,
  FaBookmark,
  FaRegEdit,
  FaRegTrashAlt,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import Loader from "./../../Loader/Loader";
import { AuthContext } from "../../Context/AuthContext";
import TopComment from "./../../TopComment/TopComment";
import PostComments from "./../../PostComments/PostComments";
import LikePosts from "./../../LikePosts/LikePosts";
import CreateCommentForm from "./../../CreateComment/CreateComment";

const BASE_URL = "https://route-posts.routemisr.com";

interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: { name: string; photo: string };
  createdAt: string;
}

interface PostType {
  _id?: string;
  id?: string;
  body: string;
  image?: string;
  privacy?: "public" | "followers" | "only_me";
  createdAt: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    username?: string;
    photo: string;
  };
  commentsCount?: number;
  topComment?: CommentType | null;
  likesCount?: number;
  isLiked?: boolean;
  likes?: string[];
  sharesCount?: number;
  bookmarked?: boolean;
  isBookmarked?: boolean;
}

interface MyProfile {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  photo?: string;
}

function authHeaders() {
  const token = localStorage.getItem("userToken") || "";
  return { token, Authorization: `Bearer ${token}` };
}

async function fetchMyProfile(): Promise<MyProfile> {
  const res = await axios.get(`${BASE_URL}/users/profile-data`, {
    headers: authHeaders(),
  });
  const body = res.data;
  return body?.data?.user || body?.user || body?.data || body;
}

function formatRelativeTime(dateString: string): string {
  const diffInSeconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (diffInSeconds < 60) return "just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export default function PostDetails() {
  const params = useParams<{ id?: string; postId?: string }>();
  const postId = params.id || params.postId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useContext(AuthContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState("");
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const commentBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery<PostType, Error>({
    queryKey: ["post", postId],
    enabled: Boolean(postId),
    queryFn: async () => {
      const response = await axios.get(`${BASE_URL}/posts/${postId}`, {
        headers: authHeaders(),
      });
      const body = response.data;
      return (body?.data?.post || body?.post || body?.data || body) as PostType;
    },
  });

  const { data: myProfile } = useQuery<MyProfile, Error>({
    queryKey: ["myProfile"],
    queryFn: fetchMyProfile,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
    queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    queryClient.invalidateQueries({ queryKey: ["myPosts"] });
    queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
    queryClient.invalidateQueries({ queryKey: ["myProfile"] });
  };

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      axios.put(
        `${BASE_URL}/posts/${postId}/bookmark`,
        {},
        { headers: authHeaders() }
      ),
    onSuccess: () => {
      setLocalSaved((prev) => {
        const current =
          prev ?? Boolean(post?.bookmarked ?? post?.isBookmarked);
        return !current;
      });
      refreshAll();
    },
    onError: (err) => console.error("Bookmark error:", err),
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      axios.delete(`${BASE_URL}/posts/${postId}`, { headers: authHeaders() }),
    onSuccess: () => {
      setConfirmDelete(false);
      refreshAll();
      navigate(-1);
    },
    onError: (err) => console.error("Delete error:", err),
  });

  const editMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.append("body", editBody);
      return axios.put(`${BASE_URL}/posts/${postId}`, formData, {
        headers: authHeaders(),
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      refreshAll();
    },
    onError: (err) => console.error("Edit error:", err),
  });

  if (isLoading) return <Loader />;

  if (isError || !post) {
    return (
      <div className="text-center my-8 text-red-500 font-bold">
        Error: {error?.message || "Post not found"}
      </div>
    );
  }

  const currentUserId =
    myProfile?._id || myProfile?.id || userData?._id || userData?.id;
  const id = String(post._id || post.id);
  const ownerId = post.user?._id || post.user?.id;

  const sameId = Boolean(
    currentUserId && ownerId && String(currentUserId) === String(ownerId)
  );
  const sameUsername = Boolean(
    myProfile?.username &&
      post.user?.username &&
      myProfile.username === post.user.username
  );
  const isOwner = sameId || sameUsername;

  const username = post.user?.name
    ? `@${post.user.name.toLowerCase().replace(/\s+/g, "")}`
    : "";
  const commentsCount = post.commentsCount || 0;
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;
  const isLiked =
    post.isLiked ??
    Boolean(currentUserId && post.likes?.includes(String(currentUserId)));
  const isSaved = localSaved ?? Boolean(post.bookmarked ?? post.isBookmarked);

  const focusComment = () => {
    commentBoxRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    commentBoxRef.current?.querySelector("textarea")?.focus();
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setConfirmDelete(true);
  };

  const handleStartEdit = () => {
    setMenuOpen(false);
    setEditBody(post.body || "");
    setIsEditing(true);
  };

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
      >
        <FaArrowLeft className="text-xs" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
        <div className="p-4 flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <img
              src={post.user?.photo || "https://via.placeholder.com/40"}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
              alt={post.user?.name}
            />
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {post.user?.name}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>{username}</span>
                <span>•</span>
                <span>{formatRelativeTime(post.createdAt)}</span>
                <span>•</span>
                <FaGlobeAmericas className="text-[10px]" />
                <span className="capitalize">{post.privacy || "Public"}</span>
              </div>
            </div>
          </div>

     
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FaEllipsisH />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    bookmarkMutation.mutate();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition"
                >
                  {isSaved ? <FaBookmark /> : <FaRegBookmark />}
                  {isSaved ? "Unsave post" : "Save post"}
                </button>

                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 transition"
                    >
                      <FaRegEdit /> Edit post
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <FaRegTrashAlt /> Delete post
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="px-4 pb-3 space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm outline-none focus:border-blue-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending || !editBody.trim()}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {editMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          post.body && (
            <div className="px-4 pb-3">
              <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                {post.body}
              </p>
            </div>
          )
        )}

        {isSaved && !isEditing && (
          <div className="px-4 pb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-3 py-1.5">
              <FaBookmark className="text-[10px]" /> Saved
            </span>
          </div>
        )}

        {post.image && (
          <div className="w-full bg-black/5 flex justify-center items-center">
            <img
              src={post.image}
              className="w-full h-auto max-h-150 object-contain"
              alt="Post content"
            />
          </div>
        )}

        <LikePosts
          postId={id}
          likesCount={likesCount}
          isLiked={isLiked}
          commentsCount={commentsCount}
          sharesCount={post.sharesCount}
          onCommentClick={focusComment}
        />

        <div ref={commentBoxRef}>
          <CreateCommentForm
            postId={id}
            userPhoto={myProfile?.photo || userData?.photo}
            userName={myProfile?.name || userData?.name}
          />
        </div>

        <TopComment topComment={post.topComment} />

        {commentsCount > 1 && (
          <PostComments postId={id} commentsCount={commentsCount} />
        )}
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
          onClick={() => !deleteMutation.isPending && setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-slate-900">Confirm action</h3>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMutation.isPending}
                className="text-slate-500 hover:text-slate-800 p-1 transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex items-start gap-4 px-5 py-5">
              <div className="w-11 h-11 shrink-0 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                <FaExclamationTriangle />
              </div>
              <div>
                <p className="font-bold text-slate-900">Delete this post?</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  This post will be permanently removed from your profile and
                  feed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}