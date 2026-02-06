/**
 * React Query hooks for Churches/Organizations
 * Mobile uses ONLY server-provided booleans, never computes tier
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { orgsAPI, myChurchesAPI, leaderInboxAPI } from '../lib/apiClient';

// Types matching server responses (capabilities are BOOLEAN-only, never tier)
export interface OrgCapabilities {
  userRole: 'visitor' | 'attendee' | 'member' | 'moderator' | 'admin' | 'owner';
  canRequestMembership: boolean;
  canRequestMeeting: boolean;
  canViewPrivateWall: boolean;
  canViewPrivateCommunities: boolean;
  hasPendingMembershipRequest: boolean;
}

export interface PublicOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  publicPhone?: string | null;
  publicAddress?: string | null;
  city?: string | null;
  state?: string | null;
  publicZipCode?: string | null;
  denomination?: string | null;
  mission?: string | null;
  serviceTimes?: string | null;
  congregationSize?: number | null;
}

export interface OrgProfileResponse {
  organization: PublicOrganization;
  capabilities: OrgCapabilities;
  communities: any[];
  upcomingEvents: any[];
}

export interface ChurchAffiliation {
  id: number;
  organizationId?: number;
  freeTextName?: string;
  roleLabel?: string;
  visibility: 'public' | 'private';
  organization?: PublicOrganization;
}

export interface MembershipRequest {
  id: number;
  organizationId: number;
  userId: number;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  organization?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface MeetingRequest {
  id: number;
  organizationId: number;
  requesterId: number;
  reason: string;
  status: 'new' | 'in_progress' | 'closed';
  createdAt: string;
  requester: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  organization?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface LeaderEntitlements {
  showLeaderInbox: boolean;
  leaderOrgs: number[];
  leaderInboxHasMeetingsTab: boolean;
}

// --- Organization Directory ---

export function useOrgsDirectory(options?: {
  q?: string;
  state?: string;
  denomination?: string;
}) {
  return useInfiniteQuery({
    queryKey: ['orgs-directory', options?.q, options?.state, options?.denomination],
    queryFn: async ({ pageParam }) => {
      return orgsAPI.getDirectory({
        cursor: pageParam as string | undefined,
        q: options?.q,
        state: options?.state,
        denomination: options?.denomination,
        limit: 20,
      });
    },
    getNextPageParam: (lastPage: { nextCursor: string | null }) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
}

export function useOrgProfile(slug: string) {
  return useQuery<OrgProfileResponse>({
    queryKey: ['org-profile', slug],
    queryFn: () => orgsAPI.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useOrgSearch(query: string) {
  return useQuery({
    queryKey: ['org-search', query],
    queryFn: () => orgsAPI.search(query),
    enabled: query.length >= 2,
  });
}

// --- My Churches (Soft Affiliations) ---

export function useMyChurches() {
  return useQuery<ChurchAffiliation[]>({
    queryKey: ['my-churches'],
    queryFn: () => myChurchesAPI.getAll(),
  });
}

export function useAddChurch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { organizationId?: number; freeTextName?: string }) =>
      myChurchesAPI.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-churches'] });
    },
  });
}

export function useRemoveChurch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (affiliationId: number) => myChurchesAPI.remove(affiliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-churches'] });
    },
  });
}

// --- Membership Requests ---

export function useRequestMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => orgsAPI.requestMembership(slug),
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', slug] });
    },
  });
}

// --- Meeting Requests ---

export function useRequestMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      orgsAPI.requestMeeting(slug, reason),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['org-profile', slug] });
    },
  });
}

// --- Leader Inbox ---

export function useLeaderEntitlements() {
  return useQuery<LeaderEntitlements>({
    queryKey: ['leader-entitlements'],
    queryFn: () => leaderInboxAPI.getEntitlements(),
  });
}

export function useMembershipRequests() {
  return useQuery<MembershipRequest[]>({
    queryKey: ['leader-inbox', 'memberships'],
    queryFn: () => leaderInboxAPI.getMembershipRequests(),
  });
}

export function useApproveMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => leaderInboxAPI.approveMembership(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-inbox', 'memberships'] });
      queryClient.invalidateQueries({ queryKey: ['leader-entitlements'] });
    },
  });
}

export function useDeclineMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => leaderInboxAPI.declineMembership(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-inbox', 'memberships'] });
    },
  });
}

export function useMeetingRequests() {
  return useQuery<MeetingRequest[]>({
    queryKey: ['leader-inbox', 'meetings'],
    queryFn: () => leaderInboxAPI.getMeetingRequests(),
  });
}

export function useUpdateMeetingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      status,
      notes,
    }: {
      requestId: number;
      status: 'in_progress' | 'closed';
      notes?: string;
    }) => leaderInboxAPI.updateMeetingStatus(requestId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leader-inbox', 'meetings'] });
    },
  });
}
