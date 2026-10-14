interface CommentType {
  _id: string;
  content: string;
  image?: string;
  commentCreator: {
    name: string;
    photo: string;
  };
  createdAt: string;
}

interface TopCommentProps {
  topComment?: CommentType | null;
  commentsCount?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function TopComment({
  topComment,
  commentsCount = 0,
  isExpanded = false,
  onToggle,
}: TopCommentProps) {
  
  if (!topComment || isExpanded) return null;

  return (
    <div className="mx-4 mb-4 mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        Top comment
      </p>

      <div className="flex items-start gap-3">
        <img
          src={
            topComment.commentCreator?.photo || "https://via.placeholder.com/40"
          }
          alt={topComment.commentCreator?.name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0 rounded-2xl bg-white px-4 py-2.5 shadow-sm">
          <p className="text-sm font-bold text-gray-900">
            {topComment.commentCreator?.name}
          </p>

          {topComment.content && (
            <p className="wrap-break-word text-sm text-gray-700">
              {topComment.content}
            </p>
          )}

          {topComment.image && (
            <img
              src={topComment.image}
              alt="comment content"
              className="mt-2 max-h-40 rounded-lg object-contain"
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-3 text-sm font-bold text-blue-600 hover:underline"
      >
        View all comments
      </button>
    </div>
  );
}