import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaImage, FaTimes } from "react-icons/fa";

interface EditCommentProps {
  postId: string;
  commentId: string;
  initialContent: string;
  initialImage?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function EditComment({
  postId,
  commentId,
  initialContent,
  initialImage,
  onCancel,
  onSuccess,
}: EditCommentProps) {
  const queryClient = useQueryClient();

  const [content, setContent] = useState(initialContent);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialImage || null
  );

  const updateCommentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.put(
        `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}`,
        formData,
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
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (newImage && imagePreview) URL.revokeObjectURL(imagePreview);

    setNewImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    if (newImage && imagePreview) URL.revokeObjectURL(imagePreview);
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;

    const formData = new FormData();
    formData.append("content", content);
  
    if (newImage) formData.append("image", newImage);

    updateCommentMutation.mutate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 transition focus-within:border-blue-500 focus-within:bg-white"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Edit your comment..."
        autoFocus
        rows={2}
        className="max-h-32 min-h-10 w-full resize-none bg-transparent text-sm text-gray-900 focus:outline-none"
      />

      {imagePreview && (
        <div className="relative mb-2 flex max-h-48 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={imagePreview}
            alt="Comment preview"
            className="max-h-48 w-full object-contain"
          />
          {newImage && (
            <button
              type="button"
              onClick={() => {
           
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setNewImage(null);
                setImagePreview(initialImage || null);
              }}
              title="Undo new image"
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700">
          <FaImage className="text-base text-green-500" />
          <span>Change Photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              updateCommentMutation.isPending ||
              (!content.trim() && !imagePreview)
            }
            className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateCommentMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {updateCommentMutation.isError && (
        <p className="mt-2 text-xs text-red-500">
          Couldn't update the comment. Try again.
        </p>
      )}
    </form>
  );
}