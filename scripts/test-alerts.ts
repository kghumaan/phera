import { sendContactAlert, sendFeatureRequestAlert } from '../lib/email/alerts';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ---- Mock Resend so no real emails are sent ----
// We intercept the Resend module and replace emails.send with a no-op.
const resendModule = require('resend');
const OriginalResend = resendModule.Resend;
resendModule.Resend = class MockResend {
    emails = {
        send: async (payload: any) => {
            console.log('  📧 [MOCK] Email would be sent:');
            console.log(`     To: ${payload.to}`);
            console.log(`     Subject: ${payload.subject}`);
            console.log('     (No real email dispatched)');
            return { data: { id: 'mock-email-id' }, error: null };
        },
    };
};

// ---- Tests ----

async function testContact() {
    console.log('🧪 Testing CONTACT alert (mocked)...');
    const result = await sendContactAlert({
        name: 'Test Runner (Antigravity)',
        email: 'test@example.com',
        phone: '+1 234 567 890',
        message: 'This is a test message — no real email should be sent.',
    });
    return result;
}

async function testFeatureRequest() {
    console.log('🧪 Testing FEATURE REQUEST alert (mocked)...');
    const result = await sendFeatureRequestAlert({
        userEmail: 'testuser@example.com',
        content: 'Dark mode support for the wedding website preview!',
        weddingId: 'test-wedding-123',
    });
    return result;
}

async function runTests() {
    console.log('--- Alert Tests (emails mocked) ---\n');

    const contactResult = await testContact();
    console.log(contactResult.success ? '  ✅ Contact alert: PASSED' : `  ❌ Contact alert: FAILED (${contactResult.error})`);

    console.log('');

    const featureResult = await testFeatureRequest();
    console.log(featureResult.success ? '  ✅ Feature request alert: PASSED' : `  ❌ Feature request alert: FAILED (${featureResult.error})`);

    console.log('\n--- Done ---');
}

runTests();
