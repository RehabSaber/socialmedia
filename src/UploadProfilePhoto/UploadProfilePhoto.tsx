import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiCamera, FiMaximize2, FiX } from "react-icons/fi";
import { AuthContext } from "../Context/AuthContext";

const BASE_URL = "https://route-posts.routemisr.com";
const FALLBACK = "https://route-posts.routemisr.com/uploads/default-profile.png";

interface UploadProfilePhotoProps {
  photo?: string;
  name?: string;
  onUploaded?: (newPhotoUrl?: string) => void;
}

async function uploadPhoto(file: File) {
  const token = localStorage.getItem("userToken") || "";
  const formData = new FormData();
  formData.append("photo", file);

  const res = await axios.put(`${BASE_URL}/users/upload-photo`, formData, {
    headers: { token, Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export default function UploadProfilePhoto({
  photo,
  name,
  onUploaded,
}: UploadProfilePhotoProps) {
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    setPreview(null);
  }, [photo]);

 
  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewerOpen]);


  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const mutation = useMutation({
    mutationFn: uploadPhoto,
    onSuccess: async (data) => {
      const newUrl: string | undefined =
        data?.data?.photo || data?.data?.user?.photo || data?.photo;

      setErrorMsg("");


      await auth?.refreshUser?.();

      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      queryClient.invalidateQueries({ queryKey: ["allPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["myBookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["post"] });
      queryClient.invalidateQueries({ queryKey: ["postComments"] });

      onUploaded?.(newUrl);
    },
    onError: (err) => {
      setPreview(null);
      if (axios.isAxiosError(err)) {
        setErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Could not upload the photo. Please try again."
        );
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; 
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file.");
      return;
    }

    setErrorMsg("");
    setPreview(URL.createObjectURL(file));
    mutation.mutate(file);
  };

  const currentSrc = preview || photo || FALLBACK;

  return (
    <>
      <div className="relative group w-32 h-32 shrink-0">
        <img
          src={currentSrc}
          alt={name || "Profile"}
          className={`w-32 h-32 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-blue-100 transition ${
            mutation.isPending ? "opacity-60" : ""
          }`}
        />

        {mutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

    
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label="View photo"
          title="View photo"
          className="absolute bottom-0 left-0 w-9 h-9 rounded-full bg-white text-slate-600 shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:bg-slate-50"
        >
          <FiMaximize2 />
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={mutation.isPending}
          aria-label="Change photo"
          title="Change photo"
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:bg-blue-700 disabled:cursor-not-allowed"
        >
          <FiCamera />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {errorMsg && (
          <p className="absolute top-full left-0 mt-2 w-56 text-xs font-semibold text-red-600">
            {errorMsg}
          </p>
        )}
      </div>

    
      {viewerOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setViewerOpen(false)}
        >
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            aria-label="Close"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xl transition"
          >
            <FiX />
          </button>

          <img
            src={currentSrc}
            alt={name || "Profile"}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </>
  );
}