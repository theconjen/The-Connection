/**
 * Organizations Directory Page (Commons)
 * Public searchable directory of churches and organizations
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Users, Church, X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface PublicOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  denomination?: string | null;
  congregationSize?: number | null;
}

interface DirectoryResponse {
  items: PublicOrganization[];
  nextCursor: string | null;
}

// Common US states for filtering
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

// Common denominations for filtering
const DENOMINATIONS = [
  "Baptist",
  "Catholic",
  "Episcopal",
  "Lutheran",
  "Methodist",
  "Non-denominational",
  "Pentecostal",
  "Presbyterian",
  "Other",
];

export default function OrganizationsDirectoryPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [denominationFilter, setDenominationFilter] = useState<string>("all");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery<DirectoryResponse>({
    queryKey: ["/api/orgs/directory", debouncedSearch, stateFilter, denominationFilter],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam as string);
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (stateFilter && stateFilter !== "all") params.set("state", stateFilter);
      if (denominationFilter && denominationFilter !== "all") params.set("denomination", denominationFilter);

      const response = await fetch(`/api/orgs/directory?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch directory");
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const allOrganizations = data?.pages.flatMap((page) => page.items) ?? [];
  const hasActiveFilters = searchQuery || (stateFilter && stateFilter !== "all") || (denominationFilter && denominationFilter !== "all");

  const clearFilters = () => {
    setSearchQuery("");
    setStateFilter("all");
    setDenominationFilter("all");
  };

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 500
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Find a Church</h1>
        <p className="text-muted-foreground">
          Discover churches and Christian organizations in your area
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-40">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Select value={denominationFilter} onValueChange={setDenominationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Denomination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Denominations</SelectItem>
                  {DENOMINATIONS.map((denom) => (
                    <SelectItem key={denom} value={denom}>
                      {denom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : allOrganizations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No churches found</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "Try adjusting your search or filters"
                  : "No churches have been added to the directory yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allOrganizations.map((org) => (
              <Card
                key={org.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/orgs/${org.slug}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={org.logoUrl || undefined} />
                      <AvatarFallback>
                        <Church className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{org.name}</h3>
                      {(org.city || org.state) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>
                            {[org.city, org.state].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {org.denomination && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {org.denomination}
                        </Badge>
                      )}
                      {org.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {/* End of results */}
          {!hasNextPage && allOrganizations.length > 0 && (
            <p className="text-center text-muted-foreground py-8">
              Showing all {allOrganizations.length} churches
            </p>
          )}
        </>
      )}
    </div>
  );
}
