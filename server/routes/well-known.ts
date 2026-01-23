/**
 * .well-known routes
 *
 * Serves Apple App Site Association and Android Asset Links files
 * for Universal Links and App Links support.
 *
 * These files must be served:
 * - At the exact paths: /.well-known/apple-app-site-association, /.well-known/assetlinks.json
 * - With correct Content-Type headers
 * - Without any redirects
 * - Over HTTPS in production
 */

import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Apple App Site Association for iOS Universal Links
// https://developer.apple.com/documentation/xcode/supporting-associated-domains
router.get('/.well-known/apple-app-site-association', (req, res) => {
  // Must be served as application/json
  res.setHeader('Content-Type', 'application/json');
  // Cache for 1 hour, but allow revalidation
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const aasa = {
    applinks: {
      apps: [],
      details: [
        {
          appID: "TEAM_ID.app.theconnection.mobile",
          paths: [
            "/a/*",
            "/e/*",
            "/p/*",
            "/u/*",
            "/reset-password",
            "/reset-password/*"
          ]
        }
      ]
    },
    webcredentials: {
      apps: [
        "TEAM_ID.app.theconnection.mobile"
      ]
    }
  };

  res.json(aasa);
});

// Android Asset Links for App Links
// https://developer.android.com/training/app-links/verify-android-applinks
router.get('/.well-known/assetlinks.json', (req, res) => {
  // Must be served as application/json
  res.setHeader('Content-Type', 'application/json');
  // Cache for 1 hour, but allow revalidation
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "app.theconnection.mobile",
        sha256_cert_fingerprints: [
          // TODO: Replace with actual SHA256 fingerprint from your signing key
          // Get this using: keytool -list -v -keystore your-release-key.keystore
          "SHA256_FINGERPRINT_HERE"
        ]
      }
    }
  ];

  res.json(assetLinks);
});

export default router;
