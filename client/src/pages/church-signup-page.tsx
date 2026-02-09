import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Church, ArrowLeft } from "lucide-react";
import { z } from "zod";

const createOrganizationSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  denomination: z.string().optional(),
});

type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;

export default function ChurchSignupPage() {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: "",
    description: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    denomination: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const response = await apiRequest("/api/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orgs/directory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/inbox-entitlements"] });
      toast({
        title: "Success!",
        description: "Your church account has been created successfully.",
      });
      // Navigate to the public org profile using slug
      navigate(`/orgs/${organization.slug}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create church account",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof CreateOrganizationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = createOrganizationSchema.parse(formData);
      setErrors({});
      createOrganizationMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path[0] as string | undefined;
          if (field) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7f5] to-[#eef2ee] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-[#5C6B5E] hover:text-[#4a5a4c]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-[#5C6B5E] rounded-full flex items-center justify-center mb-4">
              <Church className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create Your Church Account
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Connect your church community with powerful digital tools for growth and engagement
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Church/Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Grace Community Church"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Brief description of your church and mission"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="denomination">Denomination</Label>
                  <Input
                    id="denomination"
                    value={formData.denomination}
                    onChange={(e) => handleInputChange("denomination", e.target.value)}
                    placeholder="e.g., Baptist, Methodist, Non-denominational"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      placeholder="https://yourchurch.com"
                      className={errors.website ? "border-red-500" : ""}
                    />
                    {errors.website && <p className="text-sm text-red-500">{errors.website}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="123 Faith Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Springfield"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="IL"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="62701"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={createOrganizationMutation.isPending}
                  className="w-full bg-[#5C6B5E] hover:bg-[#4a5a4c]"
                >
                  {createOrganizationMutation.isPending ? "Creating Account..." : "Create Church Account"}
                </Button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-[#f0f4f0] rounded-lg border border-[#d4ddd4]">
              <h4 className="font-semibold text-[#3d4a3d] mb-2">What's Included with Your Church Account:</h4>
              <ul className="text-sm text-[#5C6B5E] space-y-1">
                <li>• Dedicated church community space</li>
                <li>• Member management and roles</li>
                <li>• Event planning and RSVP tracking</li>
                <li>• Prayer request system</li>
                <li>• Bible study tools and resources</li>
                <li>• Analytics and engagement insights</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}