import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LikeCommentProps {
  postId: string;
  commentId: string;
  parentCommentId?: string;
  likesCount: number;
  isLiked: boolean;
}

export default function LikeComment({
  postId,
  commentId,
  parentCommentId,
  likesCount,
  isLiked,
}: LikeCommentProps) {
  const queryClient = useQueryClient();
  const [optimistic, setOptimistic] = useState<{
    liked: boolean;
    count: number;
  } | null>(null);

  const liked = optimistic ? optimistic.liked : isLiked;
  const count = optimistic ? optimistic.count : likesCount;

  const likeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.put(
        `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/like`,
        {},
        {
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onMutate: () => {
      setOptimistic({
        liked: !liked,
        count: liked ? Math.max(count - 1, 0) : count + 1,
      });
    },
    onError: (error) => {
      console.error("Error toggling comment like:", error);
      setOptimistic(null);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["postComments", postId] }),
        parentCommentId
          ? queryClient.invalidateQueries({
              queryKey: ["commentReplies", parentCommentId],
            })
          : Promise.resolve(),
      ]);
      setOptimistic(null); 
    },
  });

  return (
    <button
      type="button"
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isPending}
      className={`hover:underline disabled:cursor-wait ${
        liked ? "font-bold text-blue-600" : ""
      }`}
    >
      Like ({count})
    </button>
  );
}