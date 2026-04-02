"use client";

import {
  STADIUM_NO_LISTINGS_AVAILABILITY,
  stadiumListingAvailabilityFromListings,
  stadiumListingSummariesFromListings,
  type StadiumListingAvailability,
  type StadiumListingSummaries,
} from "@/lib/stadium-listing-availability";
import {
  filterListingsByStadiumSelection,
  type ListingRowForScope,
  type StadiumMapSelection,
} from "@/lib/stadium-selection-scope";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  selection: StadiumMapSelection | null;
  setSelection: (s: StadiumMapSelection | null) => void;
  baseAvailability: StadiumListingAvailability | undefined;
  displaySummaries: StadiumListingSummaries;
};

const StadiumSelectionContext = createContext<Ctx | null>(null);

export function useStadiumSelection(): Ctx | null {
  return useContext(StadiumSelectionContext);
}

type ProviderProps = {
  rawListings: ListingRowForScope[];
  children: ReactNode;
};

export function StadiumSelectionProvider({ rawListings, children }: ProviderProps) {
  const [selection, setSelection] = useState<StadiumMapSelection | null>(null);

  const baseAvailability = useMemo(
    () =>
      rawListings.length === 0
        ? STADIUM_NO_LISTINGS_AVAILABILITY
        : stadiumListingAvailabilityFromListings(rawListings),
    [rawListings]
  );

  const filteredRaw = useMemo(
    () => filterListingsByStadiumSelection(rawListings, selection, baseAvailability),
    [rawListings, selection, baseAvailability]
  );

  const displaySummaries = useMemo(
    () => stadiumListingSummariesFromListings(filteredRaw),
    [filteredRaw]
  );

  const value = useMemo(
    () => ({
      selection,
      setSelection,
      baseAvailability,
      displaySummaries,
    }),
    [selection, baseAvailability, displaySummaries]
  );

  return <StadiumSelectionContext.Provider value={value}>{children}</StadiumSelectionContext.Provider>;
}
