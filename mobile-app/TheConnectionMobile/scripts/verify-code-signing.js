#!/usr/bin/env node
import { createSign, createVerify } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifest = JSON.stringify({
  id: 'local-test-update',
  createdAt: new Date().toISOString(),
  runtimeVersion: '1.0.0',
  launchAsset: 'bundle.js',
});

const privateKeyPath = path.join(
  __dirname,
  '..',
  'certs',
  'code-signing',
  'code-signing-private-key.pem'
);
const certificatePath = path.join(
  __dirname,
  '..',
  'certs',
  'code-signing',
  'code-signing-certificate.pem'
);

const privateKey = readFileSync(privateKeyPath, 'utf8');
const certificate = readFileSync(certificatePath, 'utf8');

const signer = createSign('RSA-SHA256');
signer.update(manifest);
signer.end();
const signature = signer.sign(privateKey, 'base64');

const verifier = createVerify('RSA-SHA256');
verifier.update(manifest);
verifier.end();
const verified = verifier.verify(certificate, signature, 'base64');

if (!verified) {
  console.error('Signature validation failed');
  process.exit(1);
}

console.log('Signature validation succeeded with current code-signing certificate.');
console.log('Signature (base64):', signature.slice(0, 16) + '...');
