"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ReviewData = {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
};

type ReviewSectionProps = {
  tmdbId: number;
  mediaType: string;
  title: string;
  reviews: ReviewData[];
  currentUserId?: string;
};

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= (hover || value);
        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHover(starValue)}
            onMouseLeave={() => !readonly && setHover(0)}
            className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <Star
              className={`h-5 w-5 ${isFilled ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-bold text-zinc-400">{value || hover}/10</span>
    </div>
  );
}

export function ReviewSection({ tmdbId, mediaType, title, reviews: initialReviews, currentUserId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingUserReview = reviews.find(r => r.user.id === currentUserId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !content.trim()) {
      toast.error("Please add a rating and write a review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, mediaType, title, content: content.trim(), rating })
      });

      if (!res.ok) throw new Error("Failed to submit review");

      const data = await res.json();
      setReviews(prev => {
        const filtered = prev.filter(r => r.user.id !== currentUserId);
        return [{
          ...data.review,
          user: { id: currentUserId!, username: "You", avatarUrl: null }
        }, ...filtered];
      });
      setContent("");
      setRating(0);
      toast.success("Review submitted!");
    } catch {
      toast.error("Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Reviews & Ratings</h2>
          <p className="text-sm text-zinc-400">{reviews.length} review{reviews.length !== 1 ? "s" : ""} from friends</p>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1.5">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-black text-amber-400">{avgRating}/10</span>
          </div>
        )}
      </div>

      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm font-bold text-zinc-300">
            {existingUserReview ? "Update your review" : "Write a review"}
          </p>
          <StarRating value={rating} onChange={setRating} />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What did you think?"
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !rating || !content.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-flame px-4 py-2 text-sm font-bold text-white hover:bg-[#ff674d] disabled:opacity-50 transition"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {existingUserReview ? "Update Review" : "Submit Review"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {reviews.map(review => (
          <div key={review.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-400">
                {review.user.avatarUrl ? (
                  <img src={review.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  review.user.username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">@{review.user.username}</p>
                <p className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">{review.rating}/10</span>
              </div>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{review.content}</p>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-8 text-center">
            <p className="text-sm text-zinc-500">No reviews yet. Be the first to review!</p>
          </div>
        )}
      </div>
    </section>
  );
}
