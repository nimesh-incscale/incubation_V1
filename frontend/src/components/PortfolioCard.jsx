import { useState } from "react";
import { MapPin, Sparkles, Wallet, BadgeIndianRupee } from "lucide-react";
import { formatINR, initialsOf } from "../lib/format";
import { Badge } from "./ui/badge";

/** Single portfolio incubator card. */
export default function PortfolioCard({ item, index = 0, onOpen }) {
    const [imgFailed, setImgFailed] = useState(false);
    const sectorChips = item.sectors_list?.slice(0, 2) || [];
    const moreSectors = (item.sectors_list?.length || 0) - sectorChips.length;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="card-lift group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            data-testid={`portfolio-card-${item.id}`}
        >
            {/* Top: logo strip */}
            <div className="relative h-28 w-full overflow-hidden bg-secondary/40">
                {item.image && !imgFailed ? (
                    <img
                        src={item.image}
                        alt={item.incubator_name}
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgFailed(true)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/40">
                        <span className="font-heading text-3xl font-bold text-primary/60">
                            {initialsOf(item.incubator_name)}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/10 to-transparent" />
                {!!item.evaluation && (
                    <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-border bg-background/90 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                        <Sparkles className="h-3 w-3 text-saffron" />
                        {item.evaluation}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <h3 className="font-heading text-[15px] font-bold leading-snug line-clamp-2" title={item.incubator_name}>
                    {item.incubator_name}
                </h3>

                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">
                        {item.city}
                        {item.city && item.state ? ", " : ""}
                        {item.state}
                    </span>
                </div>

                {sectorChips.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {sectorChips.map((s) => (
                            <Badge
                                key={s}
                                variant="secondary"
                                className="rounded-md font-normal text-[11px] bg-secondary text-secondary-foreground"
                            >
                                {s}
                            </Badge>
                        ))}
                        {moreSectors > 0 && (
                            <Badge variant="outline" className="rounded-md text-[11px] font-normal">
                                +{moreSectors}
                            </Badge>
                        )}
                    </div>
                )}

                <div className="mt-auto pt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            <Wallet className="h-3 w-3" /> Approved
                        </div>
                        <div className="mt-1 font-heading text-[15px] font-bold tabular-nums">
                            {formatINR(item.first_total_approved_amt)}
                        </div>
                    </div>
                    <div className="relative rounded-lg border border-saffron/30 bg-saffron/10 px-3 py-2.5">
                        <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-saffron">
                            <BadgeIndianRupee className="h-3 w-3" /> Grant left
                        </div>
                        <div className="mt-1 font-heading text-[15px] font-bold tabular-nums text-foreground">
                            {formatINR(item.totalGrantremainingAmount)}
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
}
