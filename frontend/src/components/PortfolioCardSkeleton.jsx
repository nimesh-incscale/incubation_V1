import { Skeleton } from "./ui/skeleton";

export default function PortfolioCardSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm" data-testid="portfolio-skeleton">
            <Skeleton className="h-28 w-full rounded-none" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                </div>
            </div>
        </div>
    );
}
