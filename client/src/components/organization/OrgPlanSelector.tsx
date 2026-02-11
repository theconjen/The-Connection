/**
 * Organization Plan Selector - Upgrade/downgrade church plan
 * Shows available plans with features and allows owners to change
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, Loader2, Sparkles, Building2, Crown, CreditCard, ExternalLink, Info } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  limits: { label: string; value: string }[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with basic features",
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Church profile in directory",
      "Basic sermon uploads",
      "Public leadership page",
    ],
    limits: [
      { label: "Sermons", value: "10" },
      { label: "Meeting requests", value: "None" },
    ],
  },
  {
    id: "stewardship",
    name: "Stewardship",
    description: "Perfect for growing churches",
    icon: <Sparkles className="h-6 w-6" />,
    highlighted: true,
    features: [
      "Everything in Free",
      "Ad-free sermon viewing",
      "Pastoral meeting requests",
      "Ordination programs",
    ],
    limits: [
      { label: "Sermons", value: "100" },
      { label: "Meeting requests", value: "50/month" },
    ],
  },
  {
    id: "partner",
    name: "Partner",
    description: "For established ministries",
    icon: <Crown className="h-6 w-6" />,
    features: [
      "Everything in Stewardship",
      "Private community wall",
      "Private communities",
      "Unlimited everything",
    ],
    limits: [
      { label: "Sermons", value: "Unlimited" },
      { label: "Meeting requests", value: "Unlimited" },
    ],
  },
];

interface OrgPlanSelectorProps {
  orgId: number;
}

export function OrgPlanSelector({ orgId }: OrgPlanSelectorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  // Check if Stripe is configured
  const { data: stripeConfig } = useQuery({
    queryKey: ["/api/stripe/config"],
    queryFn: async () => {
      const response = await fetch("/api/stripe/config", { credentials: "include" });
      if (!response.ok) return { configured: false };
      return response.json();
    },
  });

  // Fetch current billing info
  const { data: billing, isLoading } = useQuery({
    queryKey: ["/api/org-admin", orgId, "billing"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${orgId}/billing`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return { tier: "free", status: "inactive" };
        throw new Error("Failed to fetch billing");
      }
      return response.json();
    },
  });

  // Stripe checkout mutation (for upgrades)
  const checkoutMutation = useMutation({
    mutationFn: async (tier: string) => {
      // apiRequest throws on non-OK responses
      const response = await apiRequest("POST", `/api/stripe/checkout/${orgId}`, { tier });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation (for downgrades to free)
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/stripe/cancel/${orgId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", orgId, "billing"] });
      toast({
        title: "Subscription canceled",
        description: data.message || "Your church is now on the Free plan.",
      });
      setConfirmPlan(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Direct update mutation (fallback when Stripe not configured)
  const updatePlanMutation = useMutation({
    mutationFn: async (tier: string) => {
      const response = await apiRequest("PATCH", `/api/org-admin/${orgId}/billing`, { tier });
      return response.json();
    },
    onSuccess: (_, tier) => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", orgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", orgId, "billing"] });
      toast({
        title: "Plan updated",
        description: `Your church is now on the ${PLANS.find(p => p.id === tier)?.name} plan.`,
      });
      setConfirmPlan(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Billing portal mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/stripe/portal/${orgId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to open billing portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentTier = billing?.tier || "free";
  const hasSubscription = billing?.stripeSubscriptionId;
  const isPending = checkoutMutation.isPending || cancelMutation.isPending || updatePlanMutation.isPending;

  const handleSelectPlan = (planId: string) => {
    if (planId === currentTier) return;
    setConfirmPlan(planId);
  };

  const handleConfirmChange = () => {
    if (!confirmPlan) return;

    const upgrading = isUpgrade(confirmPlan);

    if (upgrading && stripeConfig?.configured) {
      // Use Stripe Checkout for upgrades
      checkoutMutation.mutate(confirmPlan);
    } else if (!upgrading && confirmPlan === "free") {
      // Cancel subscription for downgrades to free
      cancelMutation.mutate();
    } else {
      // Direct update (fallback or Stripe not configured)
      updatePlanMutation.mutate(confirmPlan);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUpgrade = (planId: string) => {
    const tierOrder = ["free", "stewardship", "partner"];
    return tierOrder.indexOf(planId) > tierOrder.indexOf(currentTier);
  };

  const confirmPlanData = PLANS.find(p => p.id === confirmPlan);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Church Plan</CardTitle>
          <CardDescription>
            Choose the plan that best fits your church's needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing Portal Access */}
          {hasSubscription && stripeConfig?.configured && (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Manage payment methods, invoices, and billing details</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Billing Portal
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stripe not configured notice (dev mode) */}
          {!stripeConfig?.configured && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Payment processing is not configured. Plan changes will be applied directly.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentTier;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-6 ${
                    plan.highlighted
                      ? "border-primary shadow-md"
                      : "border-border"
                  } ${isCurrent ? "bg-muted/50" : ""}`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      Popular
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge variant="secondary" className="absolute -top-2 right-4">
                      Current
                    </Badge>
                  )}

                  <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      plan.highlighted ? "bg-primary/10 text-primary" : "bg-muted"
                    }`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <ul className="mb-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-4 space-y-1 text-xs text-muted-foreground">
                    {plan.limits.map((limit, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{limit.label}</span>
                        <span className="font-medium">{limit.value}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : plan.highlighted ? "default" : "outline"}
                    disabled={isCurrent || isPending}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrent ? (
                      "Current Plan"
                    ) : isUpgrade(plan.id) ? (
                      "Upgrade"
                    ) : (
                      "Downgrade"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmPlan && isUpgrade(confirmPlan) ? "Upgrade" : "Downgrade"} to {confirmPlanData?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPlan && isUpgrade(confirmPlan) ? (
                <>
                  {stripeConfig?.configured ? (
                    <>You'll be redirected to complete payment securely via Stripe.</>
                  ) : (
                    <>
                      You'll get access to additional features including:{" "}
                      {confirmPlanData?.features.slice(-2).join(", ")}.
                    </>
                  )}
                </>
              ) : (
                <>
                  {hasSubscription ? (
                    <>Your subscription will be canceled at the end of the current billing period.</>
                  ) : (
                    <>You may lose access to some features. Make sure you've backed up any data
                    that depends on your current plan's features.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmChange}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : confirmPlan && isUpgrade(confirmPlan) && stripeConfig?.configured ? (
                "Continue to Payment"
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
