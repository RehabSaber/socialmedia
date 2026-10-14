import { useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiUserPlus, FiUserCheck } from "react-icons/fi";

const API = "https://route-posts.routemisr.com";

interface FollowOrUnfollowProps {

  userId: string;

  isFollowing?: boolean;

  variant?: "profile" | "compact";
  className?: string;

  onChange?: (nowFollowing: boolean) => void;
}

export default function FollowOrUnfollow({
  userId,
  isFollowing = false,
  variant = "profile",
  className = "",
  onChange,
}: FollowOrUnfollowProps) {
  const queryClient = useQueryClient();
  const [following, setFollowing] = useState<boolean>(isFollowing);


  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const token =
        localStorage.getItem("userToken") || localStorage.getItem("token") || "";
      
      return await axios.put(
        `${API}/users/${userId}/follow`,
        {},
        {
          headers: {
            token: token,
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },

    onMutate: () => {
      const previous = following;
      setFollowing(!previous);
      return { previous };
    },

    onError: (_err, _vars, context) => {
      setFollowing(context?.previous ?? false);
    },
    onSuccess: (_data, _vars, context) => {
      onChange?.(!(context?.previous ?? false));
  
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
  });

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0";

  const styles =
    variant === "profile"
      ? `${base} px-5 py-2 text-sm rounded-full ${
          following
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`
      : `${base} gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${
          following
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
        }`;

  const iconSize = variant === "profile" ? "text-base" : "text-sm";

  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className={`${styles} ${className}`}
    >
      {following ? (
        <>
          <FiUserCheck className={iconSize} />
          Unfollow
        </>
      ) : (
        <>
          <FiUserPlus className={iconSize} />
          Follow
        </>
      )}
    </button>
  );
}