import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FaImage, 
  FaSmile, 
  FaPaperPlane, 
  FaGlobeAmericas, 
  FaUserFriends, 
  FaLock, 
  FaTimes, 
  FaChevronDown 
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import type { EmojiClickData } from "emoji-picker-react";

interface UserData {
  _id?: string;
  name?: string;
  photo?: string;
}

interface CreatePostProps {
  user?: UserData | null;
}

export default function CreatePost({ user }: CreatePostProps) {
  const [postBody, setPostBody] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  
  const [privacy, setPrivacy] = useState<"public" | "followers" | "only_me">("public");
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await axios.post(`https://route-posts.routemisr.com/posts`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
    },
    onSuccess: () => {
      setPostBody("");
      removeImage();
      setShowEmojiPicker(false);
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
    onError: (err) => {
      console.error("Error creating post:", err);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setPostImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setPostBody((prev) => prev + emojiData.emoji);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postBody.trim() && !postImage) return;

    const formData = new FormData();
    if (postBody) formData.append("body", postBody);
    if (postImage) formData.append("image", postImage);
    formData.append("privacy", privacy);

    createPostMutation.mutate(formData);
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "";

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative">
      <form onSubmit={handleCreatePost}>
     
        <div className="flex items-center gap-3 mb-3">
          <img
            src={user?.photo || "https://via.placeholder.com/40"}
            alt={user?.name || "User Profile"}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h4 className="font-bold text-gray-900 text-sm leading-tight">
              {user?.name || "Loading..."}
            </h4>

      
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition font-medium"
              >
                {privacy === "public" && (
                  <>
                    <FaGlobeAmericas className="text-[11px]" />
                    <span>Public</span>
                  </>
                )}
                {privacy === "followers" && (
                  <>
                    <FaUserFriends className="text-[11px]" />
                    <span>Followers</span>
                  </>
                )}
                {privacy === "only_me" && (
                  <>
                    <FaLock className="text-[11px]" />
                    <span>Only me</span>
                  </>
                )}
                <FaChevronDown className="text-[9px] ml-0.5 text-gray-400" />
              </button>

        
              {showPrivacyDropdown && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setPrivacy("public"); setShowPrivacyDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 ${privacy === "public" ? "font-bold text-blue-600" : "text-gray-700"}`}
                  >
                    <FaGlobeAmericas /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPrivacy("followers"); setShowPrivacyDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 ${privacy === "followers" ? "font-bold text-blue-600" : "text-gray-700"}`}
                  >
                    <FaUserFriends /> Followers
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPrivacy("only_me"); setShowPrivacyDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 ${privacy === "only_me" ? "font-bold text-blue-600" : "text-gray-700"}`}
                  >
                    <FaLock /> Only me
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

  
        <div className="mb-3">
          <textarea
            value={postBody}
            onChange={(e) => setPostBody(e.target.value)}
            placeholder={`What's on your mind${firstName ? `, ${firstName}` : ''}?`}
            className="w-full bg-gray-50/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-gray-200 resize-none min-h-24 transition"
          />
        </div>

        {imagePreview && (
          <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 max-h-60 bg-gray-50 flex justify-center items-center">
            <img
              src={imagePreview}
              alt="Selected Preview"
              className="object-contain max-h-60 w-full"
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
          <div className="absolute z-30 bottom-16 left-4 shadow-xl rounded-xl">
            <EmojiPicker onEmojiClick={onEmojiClick} height={350} width={300} />
          </div>
        )}

   
        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg cursor-pointer text-sm font-medium transition">
              <FaImage className="text-green-500 text-lg" />
              <span>Photo/video</span>
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
              className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <FaSmile className="text-yellow-500 text-lg" />
              <span>Feeling/activity</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={createPostMutation.isPending || (!postBody.trim() && !postImage)}
            className="bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createPostMutation.isPending ? "Posting..." : "Post"}
            <FaPaperPlane className="text-xs" />
          </button>
        </div>
      </form>
    </div>
  );
}