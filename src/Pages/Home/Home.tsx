import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";  
import axios from "axios";
import Loader from "./../../Loader/Loader";
import {
  FaGlobeAmericas,
  FaEllipsisH,
  FaBookmark,
  FaRegBookmark,
  FaPen,
  FaTrashAlt,
  FaImage,
  FaTimes,
  FaPaperPlane,
  FaRegSmile,
} from "react-icons/fa";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { AuthContext } from "../../Context/AuthContext";
import CreatePost from "./../../CreatePost/CreatePost";
import DeletePost from "../../DeletePost/DeletePost";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";
import TopComment from "./../../TopComment/TopComment";
import PostComments from "./../../PostComments/PostComments";
import LikePosts from "./../../LikePosts/LikePosts";
import {
  useBookmarks,
  useToggleBookmark,
} from "../../BookmarksPosts/BookmarksPosts";
import SharePosts from "../../SharePosts/SharedPosts";
import SharedPostCard, {
  getSharedPost,
} from "../../SharePosts/SharedPostCard";
import type { SharedPostData } from "../../SharePosts/SharedPostCard";

interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: {
    name: string;
    photo: string;
  };
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
  sharedPost?: SharedPostData | string | null;
  originalPost?: SharedPostData | string | null;
  sharedFrom?: SharedPostData | string | null;
}

interface PostsPage {
  posts: PostType[];
  page: number;
  totalPages?: number;
}

const POSTS_PER_PAGE = 10;

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

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

function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem("userToken");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.user || decoded.id || decoded._id || decoded.userId || null;
  } catch (e) {
    return null;
  }
}

function getPostKey(p: PostType): string {
  return String(p._id || p.id);
}

function CreateCommentForm({
  postId,
  userPhoto,
  userName,
}: {
  postId: string;
  userPhoto?: string;
  userName?: string;
}) {
  const [content, setContent] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await axios.post(
        `https://route-posts.routemisr.com/posts/${postId}/comments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        }
      );
    },
    onSuccess: () => {
      setContent("");
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setCommentImage(null);
      setImagePreview(null);
      setShowEmojiPicker(false);
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setCommentImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !commentImage) return;

    const formData = new FormData();
    if (content) formData.append("content", content);
    if (commentImage) formData.append("image", commentImage);

    addCommentMutation.mutate(formData);
  };

  const firstName = userName ? userName.split(" ")[0] : "User";

  return (
    <div className="p-3 bg-white border-t border-gray-100 relative">
      <div className="flex gap-3 items-start">
        <img
          src={userPhoto || "https://via.placeholder.com/40"}
          alt={userName || "User"}
          className="w-9 h-9 rounded-full object-cover border border-gray-200 mt-1"
        />

        <form
          onSubmit={handleSubmit}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-blue-500 focus-within:bg-white transition relative"
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Comment as ${firstName}...`}
            className="w-full bg-transparent text-sm text-gray-900 focus:outline-none resize-none min-h-10 max-h-32"
            rows={1}
          />

          {imagePreview && (
            <div className="relative mb-2 rounded-lg overflow-hidden border border-gray-200 max-h-40 bg-gray-50 flex justify-center items-center">
              <img
                src={imagePreview}
                alt="Comment Preview"
                className="object-contain max-h-40 w-full"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div className="absolute z-30 bottom-14 left-0 shadow-xl rounded-xl">
              <EmojiPicker onEmojiClick={onEmojiClick} height={330} width={280} />
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1">
            <div className="flex items-center gap-3 text-gray-500">
              <label className="cursor-pointer hover:text-blue-600 transition">
                <FaImage className="text-base text-green-500" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-blue-600 transition"
              >
                <FaRegSmile className="text-base text-yellow-500" />
              </button>
            </div>

            <button
              type="submit"
              disabled={
                (!content.trim() && !commentImage) || addCommentMutation.isPending
              }
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <FaPaperPlane className="text-xs" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const { userData } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { data: bookmarks = [] } = useBookmarks();
  const toggleBookmark = useToggleBookmark();

  const savedIds = useMemo(
    () => new Set(bookmarks.map((b) => String(b._id || b.id))),
    [bookmarks]
  );

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState<string>("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);


  const [sharingPost, setSharingPost] = useState<PostType | null>(null);

  const tokenUserId = getUserIdFromToken();
  const currentUserId = tokenUserId || userData?._id || userData?.id;

  async function fetchPostsPage(page: number): Promise<PostsPage> {
    const token = localStorage.getItem("userToken") || "";

    const response = await axios.get(
      `https://route-posts.routemisr.com/posts?limit=${POSTS_PER_PAGE}&page=${page}`,
      {
        headers: {
          token: token,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const body = response.data;
    const posts: PostType[] =
      body?.data?.posts ||
      body?.posts ||
      (Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : []);

    const pagination =
      body?.meta?.pagination || body?.paginationInfo || body?.pagination;
    const totalPages: number | undefined =
      pagination?.numberOfPages || pagination?.totalPages;

    return { posts, page, totalPages };
  }

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery<PostsPage, Error>({
    queryKey: ["allPosts"],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.posts.length === 0) return undefined;

      if (lastPage.totalPages && lastPage.page >= lastPage.totalPages) {
        return undefined;
      }

      if (lastPage.posts.length < POSTS_PER_PAGE) return undefined;

      const previousKeys = new Set(
        allPages.slice(0, -1).flatMap((pg) => pg.posts.map(getPostKey))
      );
      const hasNew = lastPage.posts.some((p) => !previousKeys.has(getPostKey(p)));
      if (!hasNew) return undefined;

      return lastPage.page + 1;
    },
  });

  const posts = useMemo<PostType[]>(() => {
    const seen = new Set<string>();
    const result: PostType[] = [];
    for (const pg of data?.pages ?? []) {
      for (const p of pg.posts) {
        const key = getPostKey(p);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(p);
        }
      }
    }
    return result;
  }, [data]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetchNextPageError
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const updatePostMutation = useMutation({
    mutationFn: async ({
      postId,
      formData,
    }: {
      postId: string;
      formData: FormData;
    }) => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.put(
        `https://route-posts.routemisr.com/posts/${postId}`,
        formData,
        {
          headers: {
            token: token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      setEditingPostId(null);
      setActiveDropdown(null);
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
    onError: (err) => {
      console.error("Error updating post:", err);
    },
  });

  const startEditing = (post: PostType) => {
    const postId = getPostKey(post);
    setEditingPostId(postId);
    setEditBody(post.body);
    setImagePreview(post.image || null);
    setEditImage(null);
    setActiveDropdown(null);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditBody("");
    setEditImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveUpdate = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const formData = new FormData();
    if (editBody) formData.append("body", editBody);
    if (editImage) formData.append("image", editImage);

    updatePostMutation.mutate({ postId, formData });
  };

  if (isLoading) return <Loader />;

  if (isError && posts.length === 0) {
    return (
      <div className="text-center my-8 text-red-500 font-bold">
        Error: {error?.message}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <CreatePost user={userData} />

      {posts.map((post: PostType) => {
        const postId = getPostKey(post);
        const postUserId = post.user?._id || post.user?.id;

        const isMyPost = Boolean(
          (currentUserId &&
            postUserId &&
            String(currentUserId) === String(postUserId)) ||
            (userData?.name && post.user?.name && userData.name === post.user.name)
        );

    
        const profilePath = isMyPost ? "/profile" : `/profile/${postUserId}`;

        const formattedTime = formatRelativeTime(post.createdAt);
        const username = post.user?.name
          ? `@${post.user.name.toLowerCase().replace(/\s+/g, "")}`
          : "";
        const commentsCount = post.commentsCount || 0;
        const isEditingThisPost = editingPostId === postId;
        const isCommentsOpen = activeCommentPostId === postId;
        const isAllCommentsOpen = expandedCommentsPostId === postId;
        const topComment = post.topComment;

        const likesCount = post.likesCount ?? post.likes?.length ?? 0;
        const isLiked =
          post.isLiked ??
          Boolean(currentUserId && post.likes?.includes(String(currentUserId)));

        const isSaved = savedIds.has(postId);

  
        const shared = getSharedPost(post);

        return (
          <div
            key={postId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible relative"
          >
            <div className="p-4 flex justify-between items-start">
              <div className="flex gap-3 items-center">
         
                <Link to={profilePath} className="shrink-0">
                  <img
                    src={post.user?.photo || "https://via.placeholder.com/40"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    alt={post.user?.name}
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
             
                    <Link
                      to={profilePath}
                      className="font-bold text-gray-900 text-sm hover:underline"
                    >
                      {post.user?.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Link to={profilePath} className="hover:underline">
                      {username}
                    </Link>
                    <span>•</span>
                    <span>{formattedTime}</span>
                    <span>•</span>
                    <FaGlobeAmericas className="text-[10px]" />
                    <span className="capitalize">{post.privacy || "Public"}</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDropdown(activeDropdown === postId ? null : postId)
                  }
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <FaEllipsisH />
                </button>

                {activeDropdown === postId && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 text-sm text-gray-700">
                    <button
                      type="button"
                      disabled={toggleBookmark.isPending}
                      onClick={() =>
                        toggleBookmark.mutate(postId, {
                          onSettled: () => setActiveDropdown(null),
                        })
                      }
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition font-medium disabled:opacity-50"
                    >
                      {isSaved ? (
                        <FaBookmark className="text-blue-600" />
                      ) : (
                        <FaRegBookmark className="text-gray-500" />
                      )}
                      {isSaved ? "Unsave post" : "Save post"}
                    </button>

                    {isMyPost && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition font-medium"
                        >
                          <FaPen className="text-gray-500" /> Edit post
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            setDeletingPostId(postId);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-red-600 flex items-center gap-3 transition font-medium"
                        >
                          <FaTrashAlt className="text-red-500" /> Delete post
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isEditingThisPost ? (
              <form
                onSubmit={(e) => handleSaveUpdate(e, postId)}
                className="px-4 pb-4 space-y-3"
              >
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full bg-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-gray-300 resize-none min-h-24 transition"
                />

                {imagePreview && !shared && (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 max-h-60 bg-gray-50 flex justify-center items-center">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="object-contain max-h-60 w-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditImage(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  {!shared ? (
                    <label className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer text-xs font-medium">
                      <FaImage className="text-green-500 text-base" />
                      <span>Change Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  ) : (
                    <span />
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-5 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatePostMutation.isPending}
                      className="px-6 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition disabled:opacity-50"
                    >
                      {updatePostMutation.isPending ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {post.body && (
                  <div className="px-4 pb-3">
                    <p className="text-gray-900 text-sm leading-relaxed">
                      {post.body}
                    </p>
                  </div>
                )}

            
                {shared && <SharedPostCard shared={shared} />}

                {!shared && post.image && (
                  <div className="w-full bg-black/5 flex justify-center items-center">
                    <img
                      src={post.image}
                      className="w-full h-auto max-h-150 object-contain"
                      alt="Post content"
                    />
                  </div>
                )}

                <LikePosts
                  postId={postId}
                  likesCount={likesCount}
                  isLiked={isLiked}
                  commentsCount={commentsCount}
                  sharesCount={post.sharesCount}
                  onCommentClick={() =>
                    setActiveCommentPostId(
                      activeCommentPostId === postId ? null : postId
                    )
                  }
                  onShareClick={() => setSharingPost(post)}
                />

                <TopComment
                  topComment={topComment}
                  commentsCount={commentsCount}
                  isExpanded={isAllCommentsOpen}
                  onToggle={() => setExpandedCommentsPostId(postId)}
                />

                {isAllCommentsOpen && (
                  <PostComments
                    postId={postId}
                    onClose={() => setExpandedCommentsPostId(null)}
                  />
                )}

                {(isCommentsOpen || isAllCommentsOpen) && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <CreateCommentForm
                      postId={postId}
                      userPhoto={userData?.photo}
                      userName={userData?.name}
                    />
                  </div>
                )}
              </>
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
          <p className="text-sm text-red-500 mb-2">
            Error during fetching data
          </p>
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition"
          >
            retry
          </button>
        </div>
      )}

      {hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
        <div className="text-center pb-4">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            className="px-6 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-full transition"
          >
            Load more
          </button>
        </div>
      )}

      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-xs text-gray-400 pb-6">end of posts</p>
      )}

      {posts.length === 0 && !isLoading && (
        <p className="text-center text-sm text-gray-500 py-10">no posts now</p>
      )}

      {deletingPostId && (
        <DeletePost
          postId={deletingPostId}
          isOpen={Boolean(deletingPostId)}
          onClose={() => setDeletingPostId(null)}
        />
      )}

  
      {sharingPost && (
        <SharePosts post={sharingPost} onClose={() => setSharingPost(null)} />
      )}
    </div>
  );
}