import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { FaArrowLeft, FaGlobeAmericas } from "react-icons/fa";
import Loader from "../Loader/Loader";
import { AuthContext } from "../Context/AuthContext";
import LikePosts from "../LikePosts/LikePosts";
import TopComment from "../TopComment/TopComment";
import PostComments from "../PostComments/PostComments";
import SharePosts from "../SharePosts/SharedPosts";
import SharedPostCard, { getSharedPost } from "../SharePosts/SharedPostCard";
import FollowOrUnfollow from "../FolloworUnfollow/FolloworUnfollow";

const API = "https://route-posts.routemisr.com";
const POSTS_PER_PAGE = 10;

const profileUrl = (id: string) => `${API}/users/${id}/profile`;
const postsUrl = (id: string, page: number) =>
  `${API}/users/${id}/posts?limit=${POSTS_PER_PAGE}&page=${page}`;

interface ProfileUser {
  _id?: string;
  id?: string;
  name: string;
  username?: string;
  photo: string;
  cover?: string;
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
  followers?: string[];
}

interface PostType {
  _id?: string;
  id?: string;
  body: string;
  image?: string;
  privacy?: string;
  createdAt: string;
  user: { _id?: string; id?: string; name: string; username?: string; photo: string };
  commentsCount?: number;
  topComment?: any;
  likesCount?: number;
  isLiked?: boolean;
  likes?: string[];
  sharesCount?: number;
  sharedPost?: any;
  originalPost?: any;
  sharedFrom?: any;
}

interface PostsPage {
  posts: PostType[];
  page: number;
  totalPages?: number;
}

const authHeaders = () => {
  const token = localStorage.getItem("userToken") || "";
  return { token, Authorization: `Bearer ${token}` };
};

function formatRelativeTime(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}

function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const d = JSON.parse(json);
    return d.user || d.id || d._id || d.userId || null;
  } catch {
    return null;
  }
}

const getPostKey = (p: PostType) => String(p._id || p.id);

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useContext(AuthContext);

  const currentUserId = getUserIdFromToken() || userData?._id || userData?.id;
  const isMyProfile = Boolean(currentUserId && id && String(currentUserId) === String(id));

  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [sharingPost, setSharingPost] = useState<PostType | null>(null);

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<ProfileUser>({
    queryKey: ["userProfile", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await axios.get(profileUrl(id!), { headers: authHeaders() });
      const body = res.data;
      return body?.data?.user ?? body?.data ?? body?.user ?? body;
    },
  });

  const {
    data,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery<PostsPage, Error>({
    queryKey: ["userPosts", id],
    enabled: Boolean(id),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const res = await axios.get(postsUrl(id!, page), { headers: authHeaders() });
      const body = res.data;
      const posts: PostType[] =
        body?.data?.posts ||
        body?.posts ||
        (Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);
      const pagination = body?.meta?.pagination || body?.paginationInfo || body?.pagination;
      const totalPages: number | undefined = pagination?.numberOfPages || pagination?.totalPages;
      return { posts, page, totalPages };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length === 0) return undefined;
      if (lastPage.totalPages && lastPage.page >= lastPage.totalPages) return undefined;
      if (lastPage.posts.length < POSTS_PER_PAGE) return undefined;
      const prev = new Set(allPages.slice(0, -1).flatMap((pg) => pg.posts.map(getPostKey)));
      if (!lastPage.posts.some((p) => !prev.has(getPostKey(p)))) return undefined;
      return lastPage.page + 1;
    },
  });

  const posts = useMemo<PostType[]>(() => {
    const seen = new Set<string>();
    const out: PostType[] = [];
    for (const pg of data?.pages ?? []) {
      for (const p of pg.posts) {
        const k = getPostKey(p);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(p);
        }
      }
    }
    return out;
  }, [data]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const isFollowing = Boolean(
    profile?.isFollowing ?? (currentUserId && profile?.followers?.includes(String(currentUserId)))
  );

  if (profileLoading || postsLoading) return <Loader />;

  if (profileError || !profile) {
    return (
      <div className="text-center my-10">
        <p className="text-red-500 font-bold mb-3">Couldn't load this profile</p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full"
        >
          Back
        </button>
      </div>
    );
  }

  const profileUsername =
    profile.username
      ? `@${profile.username}`
      : `@${profile.name.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="w-full space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
      >
        <FaArrowLeft className="text-[10px]" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div
          className="h-40 sm:h-48 w-full bg-linear-to-r from-[#0f1b3d] via-[#1f3a6e] to-[#5b87b8]"
          style={profile.cover ? { backgroundImage: `url(${profile.cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="px-4 sm:px-6 pb-5">
          <div className="-mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={profile.photo || "https://via.placeholder.com/80"}
                alt={profile.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{profile.name}</h1>
                <p className="text-sm text-gray-500 truncate">{profileUsername}</p>
                {(profile.followersCount !== undefined || profile.followingCount !== undefined) && (
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-semibold text-gray-800">{profile.followersCount ?? 0}</span> followers ·{" "}
                    <span className="font-semibold text-gray-800">{profile.followingCount ?? 0}</span> following
                  </p>
                )}
              </div>
            </div>

        
            {!isMyProfile && id && (
              <FollowOrUnfollow
                userId={id}
                isFollowing={isFollowing}
                variant="profile"
              />
            )}
          </div>
        </div>
      </div>

      {posts.map((post) => {
        const postId = getPostKey(post);
        const shared = getSharedPost(post as any);
        const likesCount = post.likesCount ?? post.likes?.length ?? 0;
        const isLiked =
          post.isLiked ?? Boolean(currentUserId && post.likes?.includes(String(currentUserId)));
        const commentsCount = post.commentsCount || 0;
        const isAllCommentsOpen = expandedCommentsPostId === postId;
        const author = post.user || profile;

        return (
          <div
            key={postId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible relative"
          >
            <div className="p-4 flex gap-3 items-center">
              <img
                src={author.photo || "https://via.placeholder.com/40"}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                alt={author.name}
              />
              <div>
                <p className="font-bold text-gray-900 text-sm">{author.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>{profileUsername}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  <span>•</span>
                  <FaGlobeAmericas className="text-[10px]" />
                  <span className="capitalize">{post.privacy || "Public"}</span>
                </div>
              </div>
            </div>

            {post.body && (
              <div className="px-4 pb-3">
                <p className="text-gray-900 text-sm leading-relaxed">{post.body}</p>
              </div>
            )}

            {shared && <SharedPostCard shared={shared} />}

            {!shared && post.image && (
              <div className="w-full bg-black/5 flex justify-center items-center">
                <img src={post.image} className="w-full h-auto max-h-150 object-contain" alt="Post content" />
              </div>
            )}

            <LikePosts
              postId={postId}
              likesCount={likesCount}
              isLiked={isLiked}
              commentsCount={commentsCount}
              sharesCount={post.sharesCount}
              onCommentClick={() => setExpandedCommentsPostId(isAllCommentsOpen ? null : postId)}
              onShareClick={() => setSharingPost(post)}
            />

            <TopComment
              topComment={post.topComment}
              commentsCount={commentsCount}
              isExpanded={isAllCommentsOpen}
              onToggle={() => setExpandedCommentsPostId(postId)}
            />

            {isAllCommentsOpen && (
              <PostComments postId={postId} onClose={() => setExpandedCommentsPostId(null)} />
            )}
          </div>
        );
      })}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {isFetchNextPageError && (
        <div className="text-center py-4">
          <p className="text-sm text-red-500 mb-2">Error during fetching data</p>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full"
          >
            retry
          </button>
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 pb-6">end of posts</p>
      )}

      {posts.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-10">no posts yet</p>
      )}

      {sharingPost && <SharePosts post={sharingPost as any} onClose={() => setSharingPost(null)} />}
    </div>
  );
}