import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { MapPin, Wallet, BadgeIndianRupee, Sparkles, Building2, Hash } from "lucide-react";
import { formatINR, initialsOf } from "../lib/format";

const Stat = ({ label, value, accent = false, icon: Icon }) => (
    <div
        className={`rounded-lg border p-4 ${
            accent
                ? "border-saffron/30 bg-saffron/10"
                : "border-border bg-secondary/30"
        }`}
    >
        <div className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest ${accent ? "text-saffron" : "text-muted-foreground"}`}>
            {Icon && <Icon className="h-3 w-3" />}
            {label}
        </div>
        <div className="mt-1 font-heading text-xl font-bold tabular-nums">{value}</div>
    </div>
);

const KV = ({ k, v }) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{k}</div>
        <div className="text-sm text-right max-w-[60%] break-words">{v ?? "—"}</div>
    </div>
);

export default function DetailModal({ item, onClose }) {
    const [imgFailed, setImgFailed] = useState(false);
    const open = !!item;

    if (!item) return null;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) {
                    setImgFailed(false);
                    onClose();
                }
            }}
        >
            <DialogContent
                className="max-w-3xl p-0 overflow-hidden gap-0"
                data-testid="detail-modal"
            >
                {/* Hero */}
                <div className="relative h-36 w-full overflow-hidden bg-secondary">
                    {item.image && !imgFailed ? (
                        <img
                            src={item.image}
                            alt={item.incubator_name}
                            className="h-full w-full object-cover"
                            onError={() => setImgFailed(true)}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-grid-fade" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute bottom-3 left-5 right-5 flex items-end gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-background font-heading font-bold text-primary">
                            {initialsOf(item.incubator_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="font-heading text-[17px] font-bold leading-tight truncate">
                                {item.incubator_name}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-1.5 text-xs mt-0.5">
                                <MapPin className="h-3 w-3" /> {item.city}
                                {item.city && item.state ? ", " : ""}
                                {item.state}
                            </DialogDescription>
                        </div>
                        {!!item.evaluation && (
                            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-mono">
                                <Sparkles className="h-3 w-3 text-saffron" /> {item.evaluation}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto thin-scroll">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="mb-4 grid w-full grid-cols-3">
                            <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="financial" data-testid="tab-financial">Financial</TabsTrigger>
                            <TabsTrigger value="meta" data-testid="tab-meta">Metadata</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4">
                            <DialogHeader className="text-left">
                                <h4 className="font-heading text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                    About
                                </h4>
                            </DialogHeader>
                            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                                {item.description || "No description available."}
                            </p>

                            {item.sectors_list?.length > 0 && (
                                <div>
                                    <div className="mt-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                                        Sectors
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.sectors_list.map((s) => (
                                            <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="financial" className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Stat label="First Approved" value={formatINR(item.first_total_approved_amt)} icon={Wallet} />
                                <Stat label="Re-apply Approved" value={formatINR(item.reapply_total_approved_amt)} icon={Wallet} />
                                <Stat label="Total Remaining" value={formatINR(item.totalRemainingAmount)} icon={BadgeIndianRupee} />
                                <Stat label="Grant Remaining" value={formatINR(item.totalGrantremainingAmount)} accent icon={BadgeIndianRupee} />
                            </div>

                            <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-1">
                                <KV k="First approved (raw)" v={`₹${item.first_total_approved_amt?.toLocaleString("en-IN")}`} />
                                <KV k="Re-apply approved (raw)" v={`₹${item.reapply_total_approved_amt?.toLocaleString("en-IN")}`} />
                                <KV k="Total remaining (raw)" v={`₹${item.totalRemainingAmount?.toLocaleString("en-IN")}`} />
                                <KV k="Grant remaining (raw)" v={`₹${item.totalGrantremainingAmount?.toLocaleString("en-IN")}`} />
                            </div>
                        </TabsContent>

                        <TabsContent value="meta" className="space-y-1">
                            <div className="rounded-lg border border-border bg-secondary/30 p-4">
                                <KV k="Portfolio ID" v={<span className="font-mono">#{item.id}</span>} />
                                <KV k="Incubator User ID" v={<span className="font-mono">{item.incubator_user_id ?? "—"}</span>} />
                                <KV k="Evaluation Score" v={item.evaluation || "—"} />
                                <KV k="State" v={item.state || "—"} />
                                <KV k="City" v={item.city || "—"} />
                                {/* <KV k="Image URL" v={
                                    item.image
                                        ? <a href={item.image} target="_blank" rel="noreferrer" className="underline underline-offset-4 break-all">{item.image}</a>
                                        : "—"
                                } /> */}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-muted-foreground">
                                <Hash className="h-3.5 w-3.5" /> Source · Startup India Seed Fund
                                <Building2 className="h-3.5 w-3.5 ml-3" /> Incubator
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
