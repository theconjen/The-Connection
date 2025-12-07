# OTA code-signing assets

- `code-signing-certificate.pem` is the public certificate referenced by `expo.updates.codeSigningCertificate`.
- `code-signing-private-key.pem` is generated locally for signing OTA bundles and is intentionally gitignored.
- Use `--keyid main --private-key-path certs/code-signing/code-signing-private-key.pem` when running `eas update` to sign new updates.
- Run `node ../scripts/verify-code-signing.js` from this directory (or via `pnpm dlx node mobile-app/TheConnectionMobile/scripts/verify-code-signing.js`) to confirm the current key pair verifies signatures.
