import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

/** Reusable multi-select with searchable command palette + chip summary. */
export default function MultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = "Select…",
    testid = "multiselect",
    maxChips = 2,
}) {
    const [open, setOpen] = useState(false);
    const valueSet = new Set(value);

    const toggle = (v) => {
        const next = valueSet.has(v) ? value.filter((x) => x !== v) : [...value, v];
        onChange(next);
    };

    const remove = (v, e) => {
        e.stopPropagation();
        onChange(value.filter((x) => x !== v));
    };

    const shown = value.slice(0, maxChips);
    const more = value.length - shown.length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    data-testid={`${testid}-trigger`}
                    className={cn(
                        "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    )}
                >
                    <div className="flex flex-wrap gap-1 min-w-0">
                        {value.length === 0 && (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                        {shown.map((v) => (
                            <Badge
                                key={v}
                                variant="secondary"
                                className="max-w-[140px] truncate gap-1 pr-1 font-normal"
                            >
                                <span className="truncate">{v}</span>
                                <span
                                    role="button"
                                    onClick={(e) => remove(v, e)}
                                    className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded hover:bg-foreground/10"
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </Badge>
                        ))}
                        {more > 0 && (
                            <Badge variant="outline" className="font-normal">+{more}</Badge>
                        )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground shrink-0" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                data-testid={`${testid}-content`}
            >
                <Command shouldFilter>
                    <CommandInput placeholder="Search…" className="h-9" />
                    <CommandList className="thin-scroll max-h-64">
                        <CommandEmpty>Nothing found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((opt) => {
                                const checked = valueSet.has(opt.value);
                                return (
                                    <CommandItem
                                        key={opt.value}
                                        value={opt.label}
                                        onSelect={() => toggle(opt.value)}
                                        className="cursor-pointer"
                                        data-testid={`${testid}-option-${opt.value}`}
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                                                checked
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border"
                                            )}
                                        >
                                            {checked && <Check className="h-3 w-3" />}
                                        </div>
                                        <span className="truncate">{opt.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
