import { PackageOpen, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";

export default function EmptyState({ onReset }) {
    return (
        <div
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/20 px-6 py-20 text-center"
            data-testid="empty-state"
        >
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-background">
                <PackageOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-2xl font-bold">No portfolios found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Try widening your filter ranges, clearing chips, or searching with a broader keyword.
            </p>
            <Button
                onClick={onReset}
                className="mt-6 gap-2"
                data-testid="empty-reset-btn"
            >
                <RotateCcw className="h-4 w-4" /> Reset all filters
            </Button>
        </div>
    );
}
