/**
 * Contact Information Page
 * Apple Store requirement: published contact information
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Mail, MessageCircle, Clock, Shield, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600">
          Get in touch with our team for support, feedback, or questions about The Connection.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              General Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              For general questions, technical support, or feedback about the platform.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <a href="mailto:support@theconnection.app" className="text-blue-600 hover:underline">
                  support@theconnection.app
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Response time:</span>
                <span className="text-gray-600">Within 24 hours</span>
              </div>
            </div>
            <Button asChild>
              <a href="mailto:support@theconnection.app">
                Send Email
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Content Moderation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Content Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Report inappropriate content, harassment, or safety concerns.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <a href="mailto:moderation@theconnection.app" className="text-blue-600 hover:underline">
                  moderation@theconnection.app
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Response time:</span>
                <span className="text-gray-600">Within 24 hours</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Urgent Safety Issues:</strong> For immediate safety concerns, 
                please use the in-app reporting feature for fastest response.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="mailto:moderation@theconnection.app">
                Report Issue
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Business Inquiries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Business Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Partnerships, ministry collaborations, or business opportunities.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <a href="mailto:business@theconnection.app" className="text-blue-600 hover:underline">
                  business@theconnection.app
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Response time:</span>
                <span className="text-gray-600">Within 48 hours</span>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href="mailto:business@theconnection.app">
                Send Inquiry
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Technical Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-600" />
              Technical Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              App bugs, login problems, or technical difficulties.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <a href="mailto:tech@theconnection.app" className="text-blue-600 hover:underline">
                  tech@theconnection.app
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Response time:</span>
                <span className="text-gray-600">Within 12 hours</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Include your device type, app version, and 
                steps to reproduce the issue for faster troubleshooting.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="mailto:tech@theconnection.app">
                Report Bug
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mailing Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-gray-600">
              <p>The Connection</p>
              <p>1234 Faith Avenue</p>
              <p>Suite 567</p>
              <p>Christian Valley, CV 12345</p>
              <p>United States</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines & Safety</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-gray-600">
              We are committed to maintaining a safe, respectful, and Christ-centered community. 
              Our moderation team reviews all reports within 24 hours and takes appropriate action 
              to ensure community standards are upheld.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/community-guidelines">
                  Community Guidelines
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/privacy-policy">
                  Privacy Policy
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/terms-of-service">
                  Terms of Service
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}