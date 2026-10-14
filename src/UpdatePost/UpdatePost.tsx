import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  FaGlobeAmericas, 
  FaEllipsisH, 
  FaBookmark, 
  FaPen, 
  FaTrashAlt, 
  FaThumbsUp, 
  FaRegThumbsUp, 
  FaRegComment, 
  FaShareAlt,
  FaImage,
  FaTimes
} from "react-icons/fa";
import { Link } from "react-router-dom";

interface CommentType {
  _id: string;
  content: string;
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
  privacy?: string;
  createdAt: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    username?: string;
    photo: string;
  };
  comments?: CommentType[];
}

interface PostCardProps {
  post: PostType;
  currentUserId?: string;
  formatRelativeTime: (date: string) => string;
}

export default function PostCard({ post, currentUserId, formatRelativeTime }: PostCardProps) {
  const postId = post._id || post.id;
 
  const postUserId = post.user?._id || post.user?.id;
  const isMyPost = Boolean(
    currentUserId && 
    postUserId && 
    String(currentUserId) === String(postUserId)
  );


  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image || null);

  const queryClient = useQueryClient();

  const updatePostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await axios.put(`https://route-posts.routemisr.com/posts/${postId}`, formData, {
        headers: {
          token: localStorage.getItem("userToken"),
          Authorization: `Bearer ${localStorage.getItem("userToken")}`,
        },
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      setShowDropdown(false);
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
    },
    onError: (err) => {
      console.error("Error updating post:", err);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setEditImage(null);
    setImagePreview(null);
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (editBody) formData.append("body", editBody);
    if (editImage) formData.append("image", editImage);

    updatePostMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    setEditBody(post.body);
    setEditImage(null);
    setImagePreview(post.image || null);
    setIsEditing(false);
  };

  const formattedTime = formatRelativeTime(post.createdAt);
  const username = post.user?.name ? `@${post.user.name.toLowerCase().replace(/\s+/g, "")}` : "";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible relative">
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <img
            src={post.user?.photo || "https://via.placeholder.com/40"}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
            alt={post.user?.name}
          />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">{post.user?.name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <span>{username}</span>
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
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"
          >
            <FaEllipsisH />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 text-sm text-gray-700">
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition font-medium"
              >
                <FaBookmark className="text-gray-500" /> Save post
              </button>

              {isMyPost && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition font-medium"
                  >
                    <FaPen className="text-gray-500" /> Edit post
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDropdown(false)}
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

     
      {isEditing ? (
       
        <form onSubmit={handleSaveUpdate} className="px-4 pb-4 space-y-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            className="w-full bg-white rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 border border-gray-300 resize-none min-h-24 transition"
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-gray-200 max-h-60 bg-gray-50 flex justify-center items-center">
              <img src={imagePreview} alt="Preview" className="object-contain max-h-60 w-full" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <label className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer text-xs font-medium">
              <FaImage className="text-green-500 text-base" />
              <span>Change Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>

         
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
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
          <div className="px-4 pb-3">
            <p className="text-gray-900 text-sm leading-relaxed">{post.body}</p>
          </div>

          {post.image && (
            <div className="w-full bg-black/5 flex justify-center items-center">
              <img
                src={post.image}
                className="w-full h-auto max-h-150 object-contain"
                alt="Post content"
              />
            </div>
          )}

     
          <div className="px-4 py-2.5 flex justify-between items-center text-xs text-gray-500 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">
                <FaThumbsUp />
              </span>
              <span>0 likes</span>
            </div>

            <div className="flex items-center gap-3">
              <span>0 shares</span>
              <span>{post.comments?.length || 0} comments</span>
              <Link to={`/PostDetails/${postId}`} className="text-blue-600 font-semibold hover:underline">
                View details
              </Link>
            </div>
          </div>

          <div className="px-2 py-1 flex justify-around items-center text-gray-600 text-sm font-medium">
            <button className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-md transition text-gray-700">
              <FaRegThumbsUp className="text-base" />
              <span>Like</span>
            </button>
            <Link
              to={`/PostDetails/${postId}`}
              className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-md transition text-gray-700"
            >
              <FaRegComment className="text-base" />
              <span>Comment</span>
            </Link>
            <button className="flex-1 py-2 flex items-center justify-center gap-2 hover:bg-gray-50 rounded-md transition text-gray-700">
              <FaShareAlt className="text-base" />
              <span>Share</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}