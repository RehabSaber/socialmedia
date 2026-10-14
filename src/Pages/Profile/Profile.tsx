import { useState, useContext } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FaRegEnvelope,
  FaRegFileAlt,
  FaRegBookmark,
  FaRegClock,
} from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import Loader from "./../../Loader/Loader";
import SharedPostCard, {
  getSharedPost,
} from "../../SharePosts/SharedPostCard";
import type { SharedPostData } from "../../SharePosts/SharedPostCard";
import { AuthContext } from "../../Context/AuthContext";
import TopComment from "./../../TopComment/TopComment";
import PostComments from "./../../PostComments/PostComments";
import LikePosts from "./../../LikePosts/LikePosts";
import UploadProfilePhoto from "../../UploadProfilePhoto/UploadProfilePhoto";

const BASE_URL = "https://route-posts.routemisr.com";

interface ProfileUser {
  _id?: string;
  id?: string;
  name: string;
  username?: string;
  email?: string;
  photo?: string;
  cover?: string;
  followers?: unknown[];
  following?: unknown[];
  followersCount?: number;
  followingCount?: number;
  bookmarksCount?: number;
}

interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: { name: string; photo: string };
  createdAt: string;
}

interface ProfilePost {
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

function getPostId(p: ProfilePost): string {
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

async function fetchMyProfile(): Promise<ProfileUser> {
  const res = await axios.get(`${BASE_URL}/users/profile-data`, {
    headers: authHeaders(),
  });
  const body = res.data;
  return body?.data?.user || body?.user || body?.data || body;
}

async function fetchBookmarks(): Promise<ProfilePost[]> {
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

async function fetchMyPosts(userId: string): Promise<ProfilePost[]> {
  const res = await axios.get(`${BASE_URL}/users/${userId}/posts`, {
    headers: authHeaders(),
  });
  const body = res.data;
  const list = body?.data?.posts || body?.posts || body?.data || [];
  return Array.isArray(list) ? list : [];
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="w-32 sm:w-36 shrink-0 bg-white/90 border border-gray-200 rounded-2xl px-4 py-5 text-center">
      <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function SideStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
      <p className="text-[11px] font-bold tracking-wide text-blue-700 uppercase">
        {label}
      </p>
      <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function PostCard({
  post,
  fallbackUser,
}: {
  post: ProfilePost;
  fallbackUser: ProfileUser;
}) {
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  const author = post.user?.name ? post.user : fallbackUser;
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
        <div className="px-4 pb-4">
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

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrorObj,
  } = useQuery<ProfileUser, Error>({
    queryKey: ["myProfile"],
    queryFn: fetchMyProfile,
  });

  const userId = profile?._id || profile?.id;

  const { data: myPosts = [], isLoading: postsLoading } = useQuery<
    ProfilePost[],
    Error
  >({
    queryKey: ["myPosts", userId],
    queryFn: () => fetchMyPosts(String(userId)),
    enabled: Boolean(userId),
  });

  const { data: bookmarks = [], isLoading: bookmarksLoading } = useQuery<
    ProfilePost[],
    Error
  >({
    queryKey: ["myBookmarks"],
    queryFn: fetchBookmarks,
  });

  if (profileLoading) return <Loader />;

  if (profileError || !profile) {
    return (
      <div className="text-center my-10 text-red-500 font-bold">
        Error: {profileErrorObj?.message || "Could not load your profile"}
      </div>
    );
  }

  const followersCount =
    profile.followersCount ?? profile.followers?.length ?? 0;
  const followingCount =
    profile.followingCount ?? profile.following?.length ?? 0;
  const bookmarksCount = profile.bookmarksCount ?? bookmarks.length;
  const postsCount = myPosts.length;

  const visiblePosts = activeTab === "posts" ? myPosts : bookmarks;
  const tabLoading = activeTab === "posts" ? postsLoading : bookmarksLoading;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm">
        <div
          className="h-56 w-full bg-cover bg-center bg-linear-to-r from-[#1e293b] via-[#2b5278] to-[#6b9ac4]"
          style={
            profile.cover
              ? { backgroundImage: `url(${profile.cover})` }
              : undefined
          }
        />

        <div className="relative -mt-20 mx-4 sm:mx-8 mb-8 bg-white/95 backdrop-blur rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0 xl:flex-1">
              <UploadProfilePhoto photo={profile.photo} name={profile.name} />

              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight wrap-break-word">
                  {profile.name}
                </h1>
                <p className="text-lg text-slate-500">{makeUsername(profile)}</p>
                <span className="inline-flex items-center gap-2 mt-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 whitespace-nowrap">
                  <FiUsers /> Route Posts member
                </span>
              </div>
            </div>

            <div className="flex gap-3 self-start xl:self-auto shrink-0">
              <StatBox label="Followers" value={followersCount} />
              <StatBox label="Following" value={followingCount} />
              <StatBox label="Bookmarks" value={bookmarksCount} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 min-h-44">
              <h2 className="font-bold text-slate-900 mb-3">About</h2>
              <div className="space-y-3 text-slate-600 text-sm">
                {profile.email && (
                  <p className="flex items-center gap-3">
                    <FaRegEnvelope className="text-slate-500" /> {profile.email}
                  </p>
                )}
                <p className="flex items-center gap-3">
                  <FiUsers className="text-slate-500" /> Active on Route Posts
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <SideStat label="My posts" value={postsCount} />
              <SideStat label="Saved posts" value={bookmarksCount} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "posts"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaRegFileAlt /> My Posts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "saved"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FaRegBookmark /> Saved
          </button>
        </div>

        <span className="bg-blue-50 text-blue-600 text-xs font-bold rounded-full px-3 py-1.5">
          {visiblePosts.length}
        </span>
      </div>

      {tabLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : visiblePosts.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-10">
          {activeTab === "posts"
            ? "You haven't posted anything yet."
            : "You haven't saved any posts yet."}
        </p>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard key={getPostId(post)} post={post} fallbackUser={profile} />
          ))}
        </div>
      )}
    </div>
  );
}