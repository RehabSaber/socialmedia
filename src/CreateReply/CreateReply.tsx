import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FaImage, FaPaperPlane, FaRegSmile, FaTimes } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

interface CreateReplyProps {
  postId: string;
  commentId: string;
  replyingTo?: string;
  userPhoto?: string;
  onSuccess?: () => void;
}

const FALLBACK_PHOTO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='%23e5e7eb'/></svg>";

export default function CreateReply({
  postId,
  commentId,
  replyingTo,
  userPhoto,
  onSuccess,
}: CreateReplyProps) {
  const [content, setContent] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const removeImage = () => {
    setReplyImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const addReplyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem("userToken") ?? "";
      return await axios.post(
        `https://route-posts.routemisr.com/posts/${postId}/comments/${commentId}/replies`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            token,
          },
        }
      );
    },
    onSuccess: async () => {
      setContent("");
      removeImage();
      setShowEmojiPicker(false);
      setErrorMsg(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["commentReplies", commentId] }),
        queryClient.invalidateQueries({ queryKey: ["postComments", postId] }),
        queryClient.invalidateQueries({ queryKey: ["allPosts"] }),
        queryClient.invalidateQueries({ queryKey: ["post", postId] }),
      ]);

      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error adding reply:", error.response?.status, error.response?.data);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      setErrorMsg(`${error.response?.status ?? ""} ${msg}`.trim());
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setReplyImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
  };

  const submit = () => {
    if (addReplyMutation.isPending) return;

    setErrorMsg(null);
    const formData = new FormData();
    formData.append("content", content);
    if (replyImage) formData.append("image", replyImage);

    addReplyMutation.mutate(formData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mt-2">
      {replyingTo && (
        <p className="mb-2 text-xs text-slate-500">Replying to {replyingTo}</p>
      )}

      <div className="flex items-start gap-2">
        <img
          src={userPhoto || FALLBACK_PHOTO}
          alt="me"
          className="mt-1 h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover"
        />

        <div className="relative flex-1 rounded-2xl border border-gray-200 bg-gray-50 p-3 transition focus-within:border-blue-500 focus-within:bg-white">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply..."
            rows={1}
            className="max-h-32 min-h-10 w-full resize-none bg-transparent text-sm text-gray-900 focus:outline-none"
          />

          {imagePreview && (
            <div className="relative mb-2 flex max-h-40 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <img
                src={imagePreview}
                alt="Reply Preview"
                className="max-h-40 w-full object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-30 rounded-xl shadow-xl">
              <EmojiPicker onEmojiClick={onEmojiClick} height={330} width={280} />
            </div>
          )}

          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2">
            <div className="flex items-center gap-3 text-gray-500">
              <label className="cursor-pointer transition hover:text-blue-600">
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
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="transition hover:text-blue-600"
              >
                <FaRegSmile className="text-base text-yellow-500" />
              </button>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={addReplyMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaPaperPlane className="text-xs" />
            </button>
          </div>

          {errorMsg && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}