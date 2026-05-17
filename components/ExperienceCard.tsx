import Image from "next/image";
import StarRating from "./StarRating";
import { CATEGORY_LABELS } from "@/lib/constants";

interface ExperienceCardProps {
  experience: {
    id: string;
    title: string;
    review: string;
    rating: number;
    category: string;
    photoUrl?: string | null;
    experienceDate: string | Date;
    user?: { username: string; nickname?: string | null; profileImage?: string | null };
  };
  showUser?: boolean;
}

export default function ExperienceCard({ experience, showUser = true }: ExperienceCardProps) {
  const displayName = experience.user?.nickname || experience.user?.username || "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {experience.photoUrl && (
        <div className="relative h-44 w-full">
          <Image
            src={experience.photoUrl}
            alt={experience.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        {showUser && experience.user && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700">{displayName}</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-gray-900 text-base leading-snug flex-1">
            {experience.title}
          </h3>
          <span className="shrink-0 text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[experience.category as keyof typeof CATEGORY_LABELS] ?? experience.category}
          </span>
        </div>
        <div className="mb-2">
          <StarRating value={experience.rating} readonly size="sm" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{experience.review}</p>
      </div>
    </div>
  );
}
