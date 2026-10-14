import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface DeleteCommentProps {
  postId: string;
  commentId: string;
  parentCommentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteComment({
  postId,
  commentId,
  parentCommentId,
  isOpen,
  onClose,
}: DeleteCommentProps) {
  const queryClient = useQueryClient();

  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.delete(
        `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
        {
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      if (parentCommentId) {
        queryClient.invalidateQueries({
          queryKey: ["commentReplies", parentCommentId],
        });
      }
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    if (deleteCommentMutation.isPending) return;
    deleteCommentMutation.reset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
     
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">Confirm action</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="text-slate-500 transition hover:text-slate-800"
          >
            <FaTimes />
          </button>
        </div>

       
        <div className="flex items-start gap-4 px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100">
            <FaExclamationTriangle className="text-lg text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Delete this comment?
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              This comment will be permanently removed.
            </p>
            {deleteCommentMutation.isError && (
              <p className="mt-2 text-xs text-red-500">
                Couldn't delete the comment. Try again.
              </p>
            )}
          </div>
        </div>

     
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteCommentMutation.isPending}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2 text-sm font-bold text-slate-800 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deleteCommentMutation.mutate()}
            disabled={deleteCommentMutation.isPending}
            className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteCommentMutation.isPending ? "Deleting..." : "Delete comment"}
          </button>
        </div>
      </div>
    </div>
  );
}