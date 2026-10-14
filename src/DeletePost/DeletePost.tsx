import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface DeletePostProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeletePost({ postId, isOpen, onClose }: DeletePostProps) {
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("userToken") || "";
      
   
      return await axios.delete(`https://route-posts.routemisr.com/posts/${postId}`, {
        headers: {
          token: token,
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      onClose();
    
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
    onError: (err: any) => {
      console.error("Error deleting post:", err);
      alert(err?.response?.data?.message || "Error");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
  
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-gray-100">
        
      
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Confirm action</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <div className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <FaExclamationTriangle className="text-xl" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Delete this post?</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              This post will be permanently removed from your profile and feed.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={deletePostMutation.isPending}
            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletePostMutation.isPending}
            onClick={() => deletePostMutation.mutate()}
            className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {deletePostMutation.isPending ? "Deleting..." : "Delete post"}
          </button>
        </div>

      </div>
    </div>
  );
}