import { useState, useEffect } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FaRegThumbsUp,
  FaThumbsUp,
  FaRegComment,
  FaShareAlt,
} from "react-icons/fa";

interface LikePostsProps {
  postId: string;
  likesCount?: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount?: number;
  onCommentClick: () => void;
  onShareClick?: () => void;
}

export default function LikePosts({
  postId,
  likesCount = 0,
  isLiked = false,
  commentsCount,
  sharesCount = 0,
  onCommentClick,
  onShareClick,
}: LikePostsProps) {
  const queryClient = useQueryClient();
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);

  useEffect(() => {
    setLocalIsLiked(isLiked);
    setLocalLikesCount(likesCount);
  }, [isLiked, likesCount]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.put(
        `https://route-posts.routemisr.com/posts/${postId}/like`,
        {},
        {
          headers: {
            token: token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (err) => {
      console.error("Error liking post:", err);
      setLocalIsLiked(isLiked);
      setLocalLikesCount(likesCount);
    },
  });

  const handleLikeToggle = () => {
    const nextLiked = !localIsLiked;
    setLocalIsLiked(nextLiked);
    setLocalLikesCount((prev) =>
      nextLiked ? prev + 1 : Math.max(0, prev - 1)
    );
    likeMutation.mutate();
  };

  return (
    <>
      <div className="px-4 py-2.5 flex justify-between items-center text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">
            <FaThumbsUp />
          </span>
          <span>{localLikesCount} likes</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{sharesCount} shares</span>
          <span>{commentsCount} comments</span>
          <Link
            to={`/PostDetails/${postId}`}
            className="text-blue-600 font-semibold hover:underline"
          >
            View details
          </Link>
        </div>
      </div>

      <div className="px-2 py-1 flex justify-around items-center text-sm font-medium gap-1">
        <button
          type="button"
          onClick={handleLikeToggle}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 ${
            localIsLiked
              ? "bg-blue-50 text-blue-600 font-semibold"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {localIsLiked ? (
            <FaThumbsUp className="text-base text-blue-600" />
          ) : (
            <FaRegThumbsUp className="text-base" />
          )}
          <span>Like</span>
        </button>

        <button
          type="button"
          onClick={onCommentClick}
          className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition text-gray-600"
        >
          <FaRegComment className="text-base" />
          <span>Comment</span>
        </button>

        <button
          type="button"
          onClick={onShareClick}
          className="flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition text-gray-600"
        >
          <FaShareAlt className="text-base" />
          <span>Share</span>
        </button>
      </div>
    </>
  );
}