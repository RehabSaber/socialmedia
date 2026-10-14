import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaChevronDown, FaEllipsisH, FaPen, FaTrashAlt } from "react-icons/fa";
import { AuthContext } from "../Context/AuthContext";
import EditComment from "../EditComment/EditComment";
import LikeComment from "../LikeComment/LikeComment";
import DeleteComment from "./../DleteComment/DeleteComment";
import CreateReply from "../CreateReply/CreateReply";

interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: {
    _id?: string;
    id?: string;
    name: string;
    photo: string;
  };
  createdAt: string;
  likes?: string[];
  likesCount?: number;
  isLiked?: boolean;
}

interface PostCommentsProps {
  postId: string;
  commentsCount?: number;
  onClose?: () => void;
}

type SortType = "relevant" | "newest";

const COMMENTS_LIMIT = 50;

const FALLBACK_PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23e5e7eb'/></svg>";

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

function getLikes(c: CommentType): number {
  return c.likesCount ?? c.likes?.length ?? 0;
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
  } catch {
    return null;
  }
}

async function fetchComments(postId: string): Promise<CommentType[]> {
  const token = localStorage.getItem("userToken") || "";
  const response = await axios.get(
    `https://route-posts.routemisr.com/posts/${postId}/comments?page=1&limit=${COMMENTS_LIMIT}`,
    {
      headers: {
        token,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const body = response.data;
  return (
    body?.data?.comments ||
    body?.comments ||
    (Array.isArray(body?.data) ? body.data : [])
  );
}

async function fetchReplies(
  postId: string,
  commentId: string
): Promise<CommentType[]> {
  const token = localStorage.getItem("userToken") || "";
  const response = await axios.get(
    `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies`,
    {
      headers: {
        token,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const body = response.data;
  return (
    body?.data?.replies ||
    body?.replies ||
    (Array.isArray(body?.data) ? body.data : [])
  );
}

function ReplyItem({
  reply,
  postId,
  parentCommentId,
  isMine,
  currentUserId,
}: {
  reply: CommentType;
  postId: string;
  parentCommentId: string;
  isMine: boolean;
  currentUserId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const likesCount = getLikes(reply);
  const isLiked =
    reply.isLiked ??
    Boolean(currentUserId && reply.likes?.includes(String(currentUserId)));

  const name = reply.commentCreator?.name || "User";

  if (isEditing) {
    return (
      <div className="flex gap-2">
        <img
          src={reply.commentCreator?.photo || FALLBACK_PHOTO}
          alt={name}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <EditComment
            postId={postId}
            commentId={reply._id}
            initialContent={reply.content}
            initialImage={reply.image}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["commentReplies", parentCommentId],
              });
              setIsEditing(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <img
        src={reply.commentCreator?.photo || FALLBACK_PHOTO}
        alt={name}
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />

      <div className="min-w-0">
        <div className="inline-block max-w-full rounded-2xl bg-slate-100 px-3 py-2">
          <p className="text-xs font-bold text-gray-900">{name}</p>
          <p className="text-[11px] text-slate-500">
            {formatRelativeTime(reply.createdAt)}
          </p>

          {reply.content && (
            <p className="wrap-break-word mt-0.5 text-sm text-gray-800">
              {reply.content}
            </p>
          )}

          {reply.image && (
            <img
              src={reply.image}
              alt="reply content"
              className="mt-2 max-h-60 rounded-xl object-cover"
            />
          )}

          <div className="mt-1.5 flex items-center gap-3 text-xs font-medium text-slate-500">
            <LikeComment
              postId={postId}
              commentId={reply._id}
              parentCommentId={parentCommentId}
              likesCount={likesCount}
              isLiked={isLiked}
            />

            {isMine && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200"
                  aria-label="More options"
                >
                  <FaEllipsisH />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 top-full z-30 mt-1 w-36 rounded-xl border border-gray-100 bg-white py-1.5 text-sm shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsEditing(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left font-medium text-slate-700 transition hover:bg-gray-50"
                    >
                      <FaPen className="text-slate-500" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setIsDeleting(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left font-medium text-red-600 transition hover:bg-gray-50"
                    >
                      <FaTrashAlt className="text-red-500" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isDeleting && (
        <DeleteComment
          postId={postId}
          commentId={reply._id}
          parentCommentId={parentCommentId}
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}

function CommentReplies({
  postId,
  commentId,
  isMyComment,
  currentUserId,
}: {
  postId: string;
  commentId: string;
  isMyComment: (c: CommentType) => boolean;
  currentUserId?: string | null;
}) {
  const { data: replies = [], isLoading } = useQuery<CommentType[], Error>({
    queryKey: ["commentReplies", commentId],
    queryFn: () => fetchReplies(postId, commentId),
  });

  if (isLoading) {
    return <p className="text-xs text-slate-500">Loading replies...</p>;
  }

  if (replies.length === 0) {
    return <p className="text-xs text-slate-500">No replies yet.</p>;
  }

  return (
    <div className="space-y-3">
      {replies.map((reply) => (
        <ReplyItem
          key={reply._id}
          reply={reply}
          postId={postId}
          parentCommentId={commentId}
          isMine={isMyComment(reply)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  isMine,
  currentUserId,
  isMyComment,
}: {
  comment: CommentType;
  postId: string;
  isMine: boolean;
  currentUserId?: string | null;
  isMyComment: (c: CommentType) => boolean;
}) {
  const { userData } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const name = comment.commentCreator?.name || "User";
  const username = `@${name.toLowerCase().replace(/\s+/g, "")}`;
  const time = formatRelativeTime(comment.createdAt);

  const likesCount = getLikes(comment);
  const isLiked =
    comment.isLiked ??
    Boolean(currentUserId && comment.likes?.includes(String(currentUserId)));


  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex gap-3">
      <img
        src={comment.commentCreator?.photo || FALLBACK_PHOTO}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <EditComment
            postId={postId}
            commentId={comment._id}
            initialContent={comment.content}
            initialImage={comment.image}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <>
            <div className="inline-block max-w-full rounded-2xl bg-slate-100 px-4 py-2.5">
              <p className="text-sm font-bold text-gray-900">{name}</p>
              <p className="text-xs text-slate-500">
                {username} · {time}
              </p>

              {comment.content && (
                <p className="wrap-break-word mt-1 text-sm text-gray-800">
                  {comment.content}
                </p>
              )}

              {comment.image && (
                <img
                  src={comment.image}
                  alt="comment content"
                  className="mt-2 max-h-72 rounded-xl object-cover"
                />
              )}
            </div>

            <div className="mt-1 flex items-center justify-between px-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-4">
                <span>{time}</span>

                <LikeComment
                  postId={postId}
                  commentId={comment._id}
                  likesCount={likesCount}
                  isLiked={isLiked}
                />

                <button
                  type="button"
                  onClick={() => setShowReplies((v) => !v)}
                  className={`hover:underline ${
                    showReplies ? "text-blue-600" : ""
                  }`}
                >
                  {showReplies ? "Hide replies" : "Reply"}
                </button>
              </div>

              {isMine && (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200"
                    aria-label="More options"
                  >
                    <FaEllipsisH />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-gray-100 bg-white py-1.5 text-sm shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left font-medium text-slate-700 transition hover:bg-gray-50"
                      >
                        <FaPen className="text-slate-500" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setIsDeleting(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left font-medium text-red-600 transition hover:bg-gray-50"
                      >
                        <FaTrashAlt className="text-red-500" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {showReplies && (
              <div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-3">
                <CommentReplies
                  postId={postId}
                  commentId={comment._id}
                  isMyComment={isMyComment}
                  currentUserId={currentUserId}
                />

                <CreateReply
                  postId={postId}
                  commentId={comment._id}
                  replyingTo={name}
                  userPhoto={userData?.photo}
                />
              </div>
            )}
          </>
        )}
      </div>

      {isDeleting && (
        <DeleteComment
          postId={postId}
          commentId={comment._id}
          isOpen={isDeleting}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}

export default function PostComments({ postId, onClose }: PostCommentsProps) {
  const { userData } = useContext(AuthContext);
  const [sort, setSort] = useState<SortType>("relevant");

  const currentUserId = getUserIdFromToken() || userData?._id || userData?.id;

  const {
    data: comments = [],
    isLoading,
    isError,
  } = useQuery<CommentType[], Error>({
    queryKey: ["postComments", postId],
    queryFn: () => fetchComments(postId),
  });

  const sortedComments = useMemo(() => {
    const list = [...comments];
    const time = (c: CommentType) => new Date(c.createdAt).getTime();

    if (sort === "newest") return list.sort((a, b) => time(b) - time(a));
    
    return list.sort((a, b) => getLikes(b) - getLikes(a) || time(a) - time(b));
  }, [comments, sort]);

  const isMyComment = (c: CommentType) => {
    const creatorId = c.commentCreator?._id || c.commentCreator?.id;
    return Boolean(
      (currentUserId &&
        creatorId &&
        String(currentUserId) === String(creatorId)) ||
        (userData?.name &&
          c.commentCreator?.name &&
          userData.name === c.commentCreator.name)
    );
  };

  return (
    <div className="mx-4 mb-4 mt-2 space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-800">Comments</h3>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">
            {comments.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Hide
            </button>
          )}

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-9 text-sm font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="relevant">Most relevant</option>
              <option value="newest">Newest</option>
            </select>
            <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-700" />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      )}

      {isError && (
        <p className="py-4 text-center text-sm text-red-500">
          Couldn't load comments. Try again.
        </p>
      )}

      {!isLoading && !isError && sortedComments.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">
          No comments yet.
        </p>
      )}

      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            postId={postId}
            isMine={isMyComment(comment)}
            currentUserId={currentUserId ? String(currentUserId) : null}
            isMyComment={isMyComment}
          />
        ))}
      </div>
    </div>
  );
}