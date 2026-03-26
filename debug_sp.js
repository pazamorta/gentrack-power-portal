import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';

    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password + securityToken,
    });

    const tokenRes = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    const session = await tokenRes.json();
    if (!session.access_token) {
        console.error("Auth failed:", session);
        return;
    }

    const payload = {
        GTCX_Market_Identifier__c: "21102455890124",
        GTCX_Service_Type__c: "Gas",
        GTCX_Annual_Consumption__c: 14500,
        GTCX_Supply_Status__c: "Active"
    };

    console.log("Payload:", payload);

    const res = await fetch(`${session.instance_url}/services/data/v59.0/sobjects/GTCX_Service_Point__c`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Insert failed with status", res.status);
        console.error(errorText);
    } else {
        const data = await res.json();
        console.log("Success:", data);
    }
}

run();
