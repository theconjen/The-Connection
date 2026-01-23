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
          appID: "AN976FH68W.app.theconnection.mobile",
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
        "AN976FH68W.app.theconnection.mobile"
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
          "95:1C:8E:86:12:57:43:72:71:6D:CC:F6:A4:AB:67:1D:58:7D:36:AD:84:2F:B7:FB:35:28:92:7B:AC:44:01:C7"
        ]
      }
    }
  ];

  res.json(assetLinks);
});

export default router;
