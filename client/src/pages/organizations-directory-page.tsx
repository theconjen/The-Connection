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
import { Search, MapPin, Users, Church, X, Navigation, Filter } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

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

// Church traditions with their denominations - matching mobile app
const CHURCH_TRADITIONS = [
  {
    id: 'protestant',
    label: 'Protestant',
    denominations: [
      'Evangelical', 'Non-Denominational', 'Bible Church',
      'Baptist', 'Southern Baptist', 'American Baptist', 'First Baptist',
      'African Methodist Episcopal',
      'Lutheran',
      'Presbyterian', 'PCA', 'Orthodox Presbyterian',
      'Anglican',
      'Reformed', 'Dutch Reformed',
      'Pentecostal', 'Assembly of God',
      'Church of God', 'Church of God in Christ',
      'Charismatic', 'Vineyard',
      'Nazarene', 'Wesleyan', 'Holiness',
      'Evangelical Free', 'Evangelical Covenant',
      'Christian & Missionary Alliance',
      'Congregational',
      'Mennonite', 'Brethren',
    ],
  },
  {
    id: 'catholic',
    label: 'Catholic',
    denominations: [
      'Roman Catholic', 'Catholic',
      'Byzantine Catholic', 'Ukrainian Catholic',
      'Maronite Catholic', 'Melkite Catholic',
      'Chaldean Catholic', 'Syro-Malabar',
    ],
  },
  {
    id: 'orthodox',
    label: 'Orthodox',
    denominations: [
      'Eastern Orthodox', 'Greek Orthodox', 'Russian Orthodox',
      'Serbian Orthodox', 'Romanian Orthodox', 'Bulgarian Orthodox',
      'Antiochian Orthodox', 'Orthodox Church in America',
      'Coptic Orthodox', 'Ethiopian Orthodox', 'Eritrean Orthodox',
      'Armenian Apostolic', 'Syriac Orthodox',
      'Assyrian Church of the East', 'Ancient Church of the East',
    ],
  },
];

// Helper to get congregation size label
const getCongregationSizeLabel = (size: number | null | undefined) => {
  if (!size) return null;
  if (size < 100) return 'Small';
  if (size < 500) return 'Medium';
  return 'Large';
};

export default function OrganizationsDirectoryPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [selectedTradition, setSelectedTradition] = useState<string | null>(null);
  const [denominationFilter, setDenominationFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [userLocation, setUserLocation] = useState<{ city: string; state: string } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Get user's location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding - simple approach with nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            if (data.address) {
              const state = data.address.state || data.address.region;
              const city = data.address.city || data.address.town || data.address.village;
              if (city && state) {
                setUserLocation({ city, state });
                // Auto-set state filter to user's state
                const stateAbbrev = getStateAbbreviation(state);
                if (stateAbbrev && stateFilter === "all") {
                  setStateFilter(stateAbbrev);
                }
              }
            }
          } catch {
            // Geocoding failed silently
          }
        },
        () => {
          // Geolocation not available or denied
        }
      );
    }
  }, []);

  // Helper to get state abbreviation
  const getStateAbbreviation = (stateName: string): string | null => {
    if (!stateName) return null;
    if (stateName.length === 2) return stateName.toUpperCase();
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    };
    return stateMap[stateName] || null;
  };

  // Get denominations for selected tradition
  const currentTradition = selectedTradition
    ? CHURCH_TRADITIONS.find(t => t.id === selectedTradition)
    : null;

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
  const hasActiveFilters = searchQuery || (stateFilter && stateFilter !== "all") || selectedTradition || (denominationFilter && denominationFilter !== "all");

  const clearFilters = () => {
    setSearchQuery("");
    setStateFilter("all");
    setSelectedTradition(null);
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

      {/* Search and Filter Toggle */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? "secondary" : "outline"}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(hasActiveFilters && "ring-2 ring-primary ring-offset-2")}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Location indicator */}
      {userLocation && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Navigation className="h-4 w-4 text-primary" />
          <span>
            Showing churches near <span className="font-medium text-foreground">{userLocation.city}, {userLocation.state}</span>
          </span>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            {/* Church Traditions */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Tradition</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedTradition ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedTradition(null); setDenominationFilter("all"); }}
                >
                  All
                </Button>
                {CHURCH_TRADITIONS.map((tradition) => (
                  <Button
                    key={tradition.id}
                    variant={selectedTradition === tradition.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTradition(selectedTradition === tradition.id ? null : tradition.id);
                      setDenominationFilter("all");
                    }}
                  >
                    {tradition.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Denominations - Show when tradition is selected */}
            {currentTradition && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  {currentTradition.label} Denominations
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={denominationFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setDenominationFilter("all")}
                  >
                    All {currentTradition.label}
                  </Button>
                  {currentTradition.denominations.map((denom) => (
                    <Button
                      key={denom}
                      variant={denominationFilter === denom ? "secondary" : "ghost"}
                      size="sm"
                      className="text-xs"
                      onClick={() => setDenominationFilter(denominationFilter === denom ? "all" : denom)}
                    >
                      {denom}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Location Filter */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Location</h4>
              <div className="flex flex-wrap gap-2">
                {userLocation && (
                  <Button
                    variant={stateFilter === getStateAbbreviation(userLocation.state) ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      const abbrev = getStateAbbreviation(userLocation.state);
                      setStateFilter(stateFilter === abbrev ? "all" : abbrev || "all");
                    }}
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Near me
                  </Button>
                )}
                <Button
                  variant={stateFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStateFilter("all")}
                >
                  Anywhere
                </Button>
                {US_STATES.slice(0, 10).map((state) => (
                  <Button
                    key={state}
                    variant={stateFilter === state ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setStateFilter(stateFilter === state ? "all" : state)}
                  >
                    {state}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => {
                    // Could open a modal with all states, for now just toggle showing more
                  }}
                >
                  More states...
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="mr-1 h-4 w-4" />
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            {allOrganizations.map((org) => {
              const sizeLabel = getCongregationSizeLabel(org.congregationSize);
              const isNearby = userLocation && org.city?.toLowerCase() === userLocation.city.toLowerCase();

              return (
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

                    {/* Community indicators */}
                    {(sizeLabel || isNearby) && (
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        {sizeLabel && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {sizeLabel} community
                          </Badge>
                        )}
                        {isNearby && (
                          <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                            <Navigation className="h-3 w-3 mr-1" />
                            Near you
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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

      {/* Subtle CTA for church registration */}
      <div className="mt-12 pt-8 border-t border-border/50">
        <p className="text-center text-sm text-muted-foreground">
          Don't see your church?{" "}
          <a
            href="/church-signup"
            className="text-primary hover:underline"
          >
            Register your organization
          </a>
        </p>
      </div>
    </div>
  );
}
