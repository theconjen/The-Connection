/**
 * Forgot Password Page
 *
 * Redirects to auth page with reset tab selected.
 * This ensures parity with mobile /forgot-password route.
 */

import { useEffect } from "react";
import { Redirect } from "wouter";

export default function ForgotPasswordPage() {
  useEffect(() => {
    // Update URL to /reset-password for consistency
    window.history.replaceState({}, "", "/reset-password");
  }, []);

  return <Redirect to="/reset-password" />;
}
