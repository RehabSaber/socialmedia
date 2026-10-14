import { Link } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";

export interface SharedPostData {
  _id?: string;
  id?: string;
  body?: string;
  image?: string;
  user?: { name?: string; photo?: string; username?: string };
}


export function getSharedPost(post: {
  sharedPost?: SharedPostData | string | null;
  originalPost?: SharedPostData | string | null;
  sharedFrom?: SharedPostData | string | null;
}): SharedPostData | null {
  const candidate = post.sharedPost || post.originalPost || post.sharedFrom;
  if (candidate && typeof candidate === "object") return candidate;
  return null;
}

function makeUsername(user?: { name?: string; username?: string }) {
  if (!user) return "";
  if (user.username) return `@${user.username}`;
  return user.name ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "";
}

export default function SharedPostCard({ shared }: { shared: SharedPostData }) {
  const originalId = shared._id || shared.id;

  return (
    <div className="mx-4 mb-4 border border-gray-200 rounded-2xl overflow-hidden bg-slate-50/50">
      <div className="p-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <img
            src={shared.user?.photo || "https://via.placeholder.com/40"}
            alt={shared.user?.name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {shared.user?.name}
            </p>
            <p className="text-xs text-gray-500">{makeUsername(shared.user)}</p>
          </div>
        </div>

        {originalId && (
          <Link
            to={`/postdetails/${originalId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            Original Post <FaExternalLinkAlt size={11} />
          </Link>
        )}
      </div>

      {shared.body && (
        <p className="px-4 pb-3 text-sm text-gray-900 wrap-break-word">
          {shared.body}
        </p>
      )}

      {shared.image && (
        <div className="w-full bg-black/5 flex justify-center items-center">
          <img
            src={shared.image}
            alt="Original post"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}
    </div>
  );
}