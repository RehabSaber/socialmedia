import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FaImage, 
  FaPaperPlane, 
  FaRegSmile, 
  FaTimes 
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

interface CreateCommentFormProps {
  postId: string;
  userPhoto?: string;
  userName?: string;
}

export default function CreateCommentForm({ postId, userPhoto, userName }: CreateCommentFormProps) {
  const [content, setContent] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("userToken") || "";
      return await axios.post(
        `https://route-posts.routemisr.com/posts/${postId}/comments`,
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
      setContent("");
      removeImage();
      setShowEmojiPicker(false);
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["postComments", postId] });
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
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

        <form onSubmit={handleSubmit} className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 focus-within:border-blue-500 focus-within:bg-white transition relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Comment as ${firstName}...`}
            className="w-full bg-transparent text-sm text-gray-900 focus:outline-none resize-none min-h-10 max-h-32"
            rows={1}
          />

          {imagePreview && (
            <div className="relative mb-2 rounded-lg overflow-hidden border border-gray-200 max-h-40 bg-gray-50 flex justify-center items-center">
              <img src={imagePreview} alt="Comment Preview" className="object-contain max-h-40 w-full" />
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
              disabled={(!content.trim() && !commentImage) || addCommentMutation.isPending}
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