"use client";

import { useCallback, useRef, useState } from "react";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { PlacePrediction } from "@/types";

interface Props {
  value: string;
  onSelect: (prediction: PlacePrediction) => void;
  placeholder?: string;
}

export function PlacesCombobox({ value, onSelect, placeholder }: Props) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const sessionToken = useRef(crypto.randomUUID());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    const res = await fetch(
      `/api/places-autocomplete?input=${encodeURIComponent(input)}&sessiontoken=${sessionToken.current}`
    );
    if (!res.ok) return;
    const data = await res.json() as { predictions: PlacePrediction[] };
    setPredictions(data.predictions ?? []);
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = (prediction: PlacePrediction) => {
    setQuery(prediction.description);
    setOpen(false);
    setPredictions([]);
    sessionToken.current = crypto.randomUUID(); // rotate token after selection
    onSelect(prediction);
  };

  return (
    <Command className="border border-input rounded-xl shadow-sm overflow-hidden bg-background" shouldFilter={false}>
      <CommandInput
        value={query}
        onValueChange={handleInput}
        placeholder={placeholder ?? "Search for a place..."}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-10"
      />
      {open && (
        <CommandList className="border-t border-border/40">
          {predictions.length === 0 ? (
            <CommandEmpty className="py-4 text-sm text-muted-foreground">No results found</CommandEmpty>
          ) : (
            <CommandGroup>
              {predictions.map((p) => (
                <CommandItem
                  key={p.placeId}
                  value={p.description}
                  onSelect={() => handleSelect(p)}
                  className="cursor-pointer"
                >
                  <span className="truncate">{p.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      )}
    </Command>
  );
}
