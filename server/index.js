import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";


dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://pazamorta.github.io',
    process.env.FRONTEND_URL
].filter(Boolean);

// Allow Private Network Access for GitHub Pages -> Localhost
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url} - Origin: ${req.headers.origin}`);
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});

// Explicit OPTIONS handler for preflight transparency
app.options('*', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Salesforce session cache
let salesforceSession = null;

/**
 * Authenticate with Salesforce using OAuth 2.0 Password Flow
 * Credentials are kept secure on the server
 */
async function authenticate() {
    // Check if we have a valid cached session
    if (salesforceSession && salesforceSession.expiresAt > Date.now()) {
        return salesforceSession;
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const refreshToken = process.env.SALESFORCE_REFRESH_TOKEN;

    // Method 1: Refresh Token Flow (Recommended)
    if (refreshToken && clientId && clientSecret) {
        try {
            console.log('🔄 Authenticating via Refresh Token...');
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken
            });

            const response = await fetch(`${loginUrl}/services/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            if (response.ok) {
                const data = await response.json();
                const identityUrl = data.id; // e.g., https://login.salesforce.com/id/00D.../005...
                const userId = identityUrl ? identityUrl.split('/').pop() : null;

                salesforceSession = {
                    accessToken: data.access_token,
                    instanceUrl: data.instance_url,
                    userId: userId,
                    expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
                };
                console.log('✅ Authenticated with Salesforce (Refresh Token)');
                return salesforceSession;
            } else {
                console.warn('⚠️ Refresh Token authentication failed. Falling back to password flow...');
                const text = await response.text();
                console.error('Refresh Token Error:', text);
            }
        } catch (e) {
            console.error('Refresh Token Network Error:', e);
        }
    }

    // Method 2: Password Flow (Legacy/Fallback)
    console.log('🔄 Authenticating via Password Flow...');
    
    const username = process.env.SALESFORCE_USERNAME;
    const password = process.env.SALESFORCE_PASSWORD;
    const securityToken = process.env.SALESFORCE_SECURITY_TOKEN || '';

    const missingCredentials = [];
    if (!clientId) missingCredentials.push('SALESFORCE_CLIENT_ID');
    if (!clientSecret) missingCredentials.push('SALESFORCE_CLIENT_SECRET');
    if (!username) missingCredentials.push('SALESFORCE_USERNAME');
    if (!password) missingCredentials.push('SALESFORCE_PASSWORD');

    if (missingCredentials.length > 0) {
        throw new Error(`Salesforce credentials not configured. Missing: ${missingCredentials.join(', ')}`);
    }

    const params = new URLSearchParams({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password + securityToken,
    });

    const response = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Salesforce authentication failed: ${errorText}`);
    }

    const data = await response.json();

    // Cache the session
    salesforceSession = {
        accessToken: data.access_token,
        instanceUrl: data.instance_url,
        expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
    };

    console.log('✅ Authenticated with Salesforce (Password Flow)');
    return salesforceSession;
}

/**
 * Make an authenticated request to Salesforce REST API
 */
async function salesforceRequest(endpoint, options = {}) {
    const session = await authenticate();

    const url = `${session.instanceUrl}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'Sforce-Duplicate-Rule-Header': 'allowSave=true',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Salesforce API error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses (like PATCH requests)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return null;
}

/**
 * Query Salesforce using SOQL
 */
async function query(soql) {
    const encodedQuery = encodeURIComponent(soql);
    return salesforceRequest(`/services/data/v59.0/query?q=${encodedQuery}`);
}

/**
 * Create a Salesforce record
 */
async function createRecord(objectType, data) {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        }
    );
}

/**
 * Update a Salesforce record
 */
async function updateRecord(objectType, id, data) {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}/${id}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
        }
    );
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Salesforce proxy server is running' });
});

/**
 * Get OAuth Authorization URL
 * GET /api/auth/url
 */
app.get('/api/auth/url', (req, res) => {
    let loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    // Remove trailing slash if present
    if (loginUrl.endsWith('/')) {
        loginUrl = loginUrl.slice(0, -1);
    }
    
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const redirectUri = req.query.redirect_uri || 'https://localhost:3000/oauth/callback';
    
    if (!clientId) {
        return res.status(500).json({ error: 'Missing SALESFORCE_CLIENT_ID env var' });
    }

    const url = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    
    console.log('----------------------------------------------------');
    console.log('🔑 Generated Auth URL:');
    console.log(url);
    console.log('----------------------------------------------------');
    
    res.json({ url });
});

/**
 * Exchange Authorization Code for Tokens
 * POST /api/auth/exchange
 */
app.post('/api/auth/exchange', async (req, res) => {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Missing code' });
    }

    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    
    // Check if redirect_uri was passed, otherwise try to guess or use default
    const finalRedirectUri = redirect_uri || 'http://localhost:3000/oauth/callback';
    
    console.log('Using redirect_uri for exchange:', finalRedirectUri);

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: finalRedirectUri
    });

    try {
        console.log('🔄 Exchanging Authorization Code for Tokens...');
        const response = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Exchange failed:', data);
            return res.status(response.status).json(data);
        }

        // Cache the session immediately
        salesforceSession = {
            accessToken: data.access_token,
            instanceUrl: data.instance_url,
            expiresAt: Date.now() + 90 * 60 * 1000,
        };
        
        // Log the Refresh Token for the user
        if (data.refresh_token) {
            console.log('\n===============================================================');
            console.log('🔐 NEW REFRESH TOKEN OBTAINED');
            console.log('Copy this to your .env.local as SALESFORCE_REFRESH_TOKEN:');
            console.log(data.refresh_token);
            console.log('===============================================================\n');
            
            process.env.SALESFORCE_REFRESH_TOKEN = data.refresh_token;
        }

        res.json({ 
            success: true, 
            message: 'Authenticated successfully',
            refresh_token: data.refresh_token 
        });
    } catch (error) {
        console.error('Exchange error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create Salesforce records from invoice data
 * POST /api/salesforce/invoice
 */
/**
 * Helper to get RecordTypeId by DeveloperName
 */
async function getRecordTypeId(sobjectType, developerName) {
    try {
        const queryStr = `SELECT Id FROM RecordType WHERE SobjectType = '${sobjectType}' AND DeveloperName = '${developerName}' LIMIT 1`;
        const result = await query(queryStr);
        if (result.totalSize > 0) {
            return result.records[0].Id;
        }
        console.warn(`⚠️ RecordType not found: ${sobjectType} - ${developerName}`);
        return null;
    } catch (e) {
        console.warn(`Error fetching RecordType: ${e.message}`);
        return null;
    }
}

/**
 * Create a Salesforce Lead
 * POST /api/salesforce/lead
 */
app.post('/api/salesforce/lead', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Received Lead data:', data.companyName);

        // Fetch RecordTypeId for GTCX_B2B_Lead
        const recordTypeId = await getRecordTypeId('Lead', 'GTCX_B2B_Lead');

        // Map form fields to Salesforce Lead fields
        const leadData = {
            FirstName: data.contactName.split(' ')[0],
            LastName: data.contactName.split(' ').slice(1).join(' ') || 'Unknown',
            Company: data.companyName,
            Email: data.email,
            Phone: data.phone,
            Title: data.jobTitle,
            Website: data.website,
            LeadSource: 'Web',
            Status: 'Open - Not Contacted',
            Description: `Created via Web Form. TPI: ${data.userType === 'tpi' ? 'Yes' : 'No'}`
        };

        if (recordTypeId) {
            leadData.RecordTypeId = recordTypeId;
        }

        if (data.tpiIdentifier) {
            leadData.Description += `\nTPI Identifier: ${data.tpiIdentifier}`;
        }

        let leadResult;
        try {
            leadResult = await createRecord('Lead', leadData);
        } catch (initialError) {
             // Retry without RecordTypeId if it fails due to record type issues
             if (leadData.RecordTypeId && initialError.message.includes('INVALID_CROSS_REFERENCE_KEY') || initialError.message.includes('invalid record type') || initialError.message.includes('INSUFFICIENT_ACCESS')) {
                 console.warn('⚠️ Creation with RecordTypeId failed. Retrying without RecordTypeId...');
                 delete leadData.RecordTypeId;
                 leadResult = await createRecord('Lead', leadData);
             } else {
                 throw initialError;
             }
        }

        if (!leadResult.success) {
            throw new Error('Failed to create Lead: ' + JSON.stringify(leadResult.errors));
        }

        console.log('✅ Created Lead:', leadResult.id);

        res.json({
            success: true,
            leadId: leadResult.id,
            message: 'Lead created successfully'
        });

    } catch (error) {
        console.error('❌ Create Lead error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Handle Full Form Submission (Invoice + Details)
 * POST /api/salesforce/invoice
 * Also handles Lead Conversion logic if leadId is present
 */
/**
 * Handle Full Form Submission (Invoice + Details)
 * POST /api/salesforce/invoice
 * Uses Standard Lead Conversion if leadId is present
 */
/**
 * Update an Opportunity
 * PATCH /api/salesforce/opportunity/:id
 */
app.patch('/api/salesforce/opportunity/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        console.log(`[PATCH] Updating Opportunity ${id}`, data);

        // Map frontend fields to Salesforce fields if necessary
        const fieldsToUpdate = {
            ...data
        };
        
        // Handle specific mappings
        if (data.contractStartDate) fieldsToUpdate.CloseDate = data.contractStartDate;
        if (data.contractLength) fieldsToUpdate.Description = (fieldsToUpdate.Description || '') + `\nContract Length: ${data.contractLength}`;
        if (data.onsiteGeneration !== undefined) fieldsToUpdate.Description = (fieldsToUpdate.Description || '') + `\nOnsite Generation: ${data.onsiteGeneration ? 'Yes' : 'No'}`;

        await updateRecord('Opportunity', id, fieldsToUpdate);
        
        res.json({ success: true, message: 'Opportunity updated successfully' });
    } catch (error) {
        console.error('❌ Update Opportunity error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Handle Full Form Submission (Invoice + Details)
 * POST /api/salesforce/invoice
 * Uses Standard Lead Conversion if leadId is present
 */
app.post('/api/salesforce/invoice', async (req, res) => {
    try {
        const data = req.body;
        console.log('[POST] /api/salesforce/invoice - Origin:', req.headers.origin);
        console.log('📥 Received Form Submission:', data.companyName);
        console.log('   Payload Keys:', Object.keys(data));
        console.log('   Has fileContent:', !!data.fileContent);
        console.log('   Has fileName:', !!data.fileName);
        console.log('   Lead ID:', data.leadId);

        let accountId;
        let contactId;
        let opportunityId;
        let stageName = (data.sites && data.sites.length > 0) ? 'Qualification' : 'Prospecting';

        // Helper to get converted status
        const getConvertedStatus = async () => {
            const statusResult = await query("SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true LIMIT 1");
            return statusResult.records[0]?.MasterLabel || 'Closed - Converted';
        };

        // 1. LEAD CONVERSION FLOW
        if (data.leadId) {
            console.log('🔄 Starting Standard Lead Conversion for:', data.leadId);

            // A. Update Lead first with latest form data to ensure mapping is accurate
            try {
                await updateRecord('Lead', data.leadId, {
                    Company: data.companyName,
                    FirstName: data.contactName ? data.contactName.split(' ')[0] : (data.contactFirstName || undefined),
                    LastName: data.contactName ? data.contactName.split(' ').slice(1).join(' ') : (data.contactLastName || undefined),
                    Email: data.email || data.contactEmail,
                    Phone: data.phone || data.contactPhone,
                    Title: data.jobTitle,
                    Website: data.website,
                    NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) : undefined,
                    Industry: data.industry,
                    Description: `Updated from Form before conversion.\nUse Case: ${data.useCase}\nBudget: ${data.budget}`
                });
                console.log('   Updated Lead with latest details.');
            } catch (e) {
                console.warn('   Could not update Lead before conversion (might be already converted?):', e.message);
            }

            // B. Perform Conversion
            const convertedStatus = await getConvertedStatus();
            // B. Perform Conversion via SOAP API (since REST LeadConvert is not standard)
            // const convertedStatus = await getConvertedStatus(); // Already declared
            
            const session = await authenticate();
            const soapXml = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
               <soapenv:Header>
                  <urn:SessionHeader>
                     <urn:sessionId>${session.accessToken}</urn:sessionId>
                  </urn:SessionHeader>
                  <urn:DuplicateRuleHeader>
                     <urn:allowSave>true</urn:allowSave>
                  </urn:DuplicateRuleHeader>
               </soapenv:Header>
               <soapenv:Body>
                  <urn:convertLead>
                     <urn:leadConverts>
                        <urn:convertedStatus>${convertedStatus}</urn:convertedStatus>
                        <urn:leadId>${data.leadId}</urn:leadId>
                        <urn:ownerId>${session.userId}</urn:ownerId>
                        <urn:doNotCreateOpportunity>false</urn:doNotCreateOpportunity>
                        <urn:opportunityName>${data.companyName} - ${data.useCase || 'Energy'} Opportunity</urn:opportunityName>
                     </urn:leadConverts>
                  </urn:convertLead>
               </soapenv:Body>
            </soapenv:Envelope>
            `;

            console.log('   Sending SOAP convertLead request...');
            const conversionResponse = await fetch(`${session.instanceUrl}/services/Soap/c/59.0`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml',
                    'SOAPAction': '""'
                },
                body: soapXml
            });

            const responseText = await conversionResponse.text();

            if (!conversionResponse.ok || responseText.includes('success>false<')) {
                console.error('⚠️ Conversion failed:', responseText);
                throw new Error('Lead Conversion Failed. SOAP Response: ' + responseText);
            } else {
                // Parse IDs from XML using simple Regex
                const accountMatch = responseText.match(/<accountId>(.*?)<\/accountId>/);
                const contactMatch = responseText.match(/<contactId>(.*?)<\/contactId>/);
                const opportunityMatch = responseText.match(/<opportunityId>(.*?)<\/opportunityId>/);
                
                accountId = accountMatch ? accountMatch[1] : null;
                contactId = contactMatch ? contactMatch[1] : null;
                opportunityId = opportunityMatch ? opportunityMatch[1] : null;

                console.log('✅ Lead Converted Successfully via SOAP!');
                console.log('   Account:', accountId, 'Contact:', contactId, 'Opp:', opportunityId);
            }
        }

        // 2. FALLBACK / MANUAL FLOW (If no leadId OR Conversion Failed)
        if (!accountId) {
             // ... [Existing manual logic for Account/Contact creation] ...
             // Update Account Logic
            const existingAccountsQuery = `SELECT Id FROM Account WHERE Name = '${data.companyName.replace(/'/g, "\\'")}' LIMIT 1`;
            const existingAccounts = await query(existingAccountsQuery);

            const accountFields = {
                Industry: data.industry ? data.industry.charAt(0).toUpperCase() + data.industry.slice(1) : undefined,
                NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) || undefined : undefined,
                Website: data.website,
                Description: `Created/Updated from Web Form on ${new Date().toISOString()}`
            };

            if (existingAccounts.totalSize > 0) {
                accountId = existingAccounts.records[0].Id;
                await updateRecord('Account', accountId, accountFields);
            } else {
                const accountResult = await createRecord('Account', {
                    Name: data.companyName,
                    Type: 'Prospect',
                    ...accountFields
                });
                if (!accountResult.success) throw new Error('Failed to create Account: ' + JSON.stringify(accountResult.errors));
                accountId = accountResult.id;
            }
            
            // Contact Logic (Manual)
            if (!contactId && (data.contactName || data.contactEmail)) {
                 // ... [Reuse existing Contact logic] ...
                 const email = data.email || data.contactEmail;
                 const existingContacts = email ? await query(`SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`) : { totalSize: 0 };
                 
                 if (existingContacts.totalSize > 0) {
                     contactId = existingContacts.records[0].Id;
                 } else {
                     const contactResult = await createRecord('Contact', {
                         AccountId: accountId,
                         FirstName: data.contactName ? data.contactName.split(' ')[0] : data.contactFirstName,
                         LastName: (data.contactName ? data.contactName.split(' ').slice(1).join(' ') : data.contactLastName) || 'Unknown',
                         Email: email,
                         Phone: data.phone || data.contactPhone,
                         Title: data.jobTitle
                     });
                     if (contactResult.success) contactId = contactResult.id;
                 }
            }
        }

        // 3. POST-CONVERSION / UPDATES
        // Even if converted, we might need to update the Opportunity or Account with extra fields that didn't map
        
        // Update Account with any extra form data that might not have mapped
        if (accountId) {
             await updateRecord('Account', accountId, {
                 Industry: data.industry,
                 NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) : undefined
             });
        }

        // Handle Opportunity (Create if manual, Update if converted)
        // Calculate Amount based on Annual Consumption * £80 (Our Rate) if available, else extrapolate
        const estimatedAnnualConsumption = data.annualConsumption || (data.totalConsumption ? data.totalConsumption * 12 : 0);
        const opportunityAmount = estimatedAnnualConsumption * 80;

        // Fetch RecordTypeId for Regulated_Electricity
        const oppRecordTypeId = await getRecordTypeId('Opportunity', 'Regulated_Electricity');

        const opportunityFields = {
            StageName: stageName,
            Amount: opportunityAmount || (data.totalAmount ? data.totalAmount * 12 : undefined),
            CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            Description: `Generated from Web Form.\nUse Case: ${data.useCase}\nTimeline: ${data.timeline}\nBudget: ${data.budget}\nPortfolio Size: ${data.portfolioSize}\n`
        };

        if (oppRecordTypeId) {
            opportunityFields.RecordTypeId = oppRecordTypeId;
        }

        if (opportunityId) {
            // Update existing converted opportunity
            console.log('Updating converted opportunity:', opportunityId);
            try {
                await updateRecord('Opportunity', opportunityId, opportunityFields);
            } catch (err) {
                 console.warn(`Initial Opportunity update failed: ${err.message}. Retrying without RecordTypeId...`);
                 
                 // If the error is related to RecordTypeId, retry without it
                 if (opportunityFields.RecordTypeId) {
                     const fieldsWithoutRecordType = { ...opportunityFields };
                     delete fieldsWithoutRecordType.RecordTypeId;
                     try {
                        await updateRecord('Opportunity', opportunityId, fieldsWithoutRecordType);
                        console.log('✅ Retry Opportunity update successful (without RecordTypeId)');
                     } catch (retryErr) {
                         console.error('❌ Retry Opportunity update failed:', retryErr);
                         // Don't throw here, partial success is better than total failure?
                         // Actually, if we can't update the contract details, it might be critical.
                         // But for now, let's log and proceed to Site creation.
                     }
                 } else {
                     console.error('❌ Opportunity update failed (no RecordTypeId to remove):', err);
                 }
            }
        } else {
            // Create new if manual flow
            console.log('Creating new opportunity...');
            try {
                const oppResult = await createRecord('Opportunity', {
                    Name: `${data.companyName} - ${data.useCase || 'Energy'} Opportunity`,
                    AccountId: accountId,
                    ContactId: contactId,
                    ...opportunityFields
                });
                if (oppResult.success) opportunityId = oppResult.id;
            } catch (oppError) {
                 // Retry without RecordTypeId for Opportunity as well
                 if (opportunityFields.RecordTypeId && (oppError.message.includes('INVALID_CROSS_REFERENCE_KEY') || oppError.message.includes('invalid record type') || oppError.message.includes('INSUFFICIENT_ACCESS'))) {
                     console.warn('⚠️ Opportunity creation with RecordTypeId failed. Retrying without RecordTypeId...');
                     delete opportunityFields.RecordTypeId;
                     const retryOppResult = await createRecord('Opportunity', {
                        Name: `${data.companyName} - ${data.useCase || 'Energy'} Opportunity`,
                        AccountId: accountId,
                        ContactId: contactId,
                        ...opportunityFields
                     });
                     if (retryOppResult.success) opportunityId = retryOppResult.id;
                 } else {
                     console.error('Failed to create Opportunity:', oppError);
                     // Proceed without opp? No, better to let it fail or log
                 }
            }
        }

        // 4. SITES AND SERVICE POINTS (Common Logic)
        const createdPremises = [];
        const createdServicePoints = [];

        if (data.sites && data.sites.length > 0) {
            console.log(`Processing ${data.sites.length} sites...`);
            for (const site of data.sites) {
                const premisesResult = await createRecord('vlocity_cmt__Premises__c', {
                    Name: site.name || 'Site',
                    vlocity_cmt__StreetAddress__c: site.address || undefined,
                    vlocity_cmt__Status__c: 'Active',
                    vlocity_cmt__PremisesType__c: 'Commercial'
                });

                if (premisesResult.success) {
                    const premisesId = premisesResult.id;
                    createdPremises.push({ id: premisesId, name: site.name });

                    if (site.meterPoints && site.meterPoints.length > 0) {
                        for (const meterPoint of site.meterPoints) {
                            const servicePointResult = await createRecord('GTCX_Service_Point__c', {
                                Name: meterPoint.meterNumber || 'Service Point',
                                GTCX_Fuel_Type__c: meterPoint.fuelType || 'Electricity',
                                GTCX_Postcode__c: meterPoint.postcode || undefined,
                                GTCX_Opportunity__c: opportunityId,
                                GTCX_Annual_Consumption__c: meterPoint.annualConsumption || data.totalConsumption || undefined,
                                GTCX_Product_Preference__c: meterPoint.productPreference || undefined,
                                GTCX_Duration_Options__c: meterPoint.durationOptions || undefined,
                                GTCX_Contact_Name__c: meterPoint.contactName || undefined,
                                GTCX_Contact_Email__c: meterPoint.contactEmail || undefined,
                                GTCX_Contact_Phone__c: meterPoint.contactPhone || undefined,
                                GTCX_Company_Number__c: meterPoint.companyNumber || undefined
                            });
                            if (servicePointResult.success) {
                                createdServicePoints.push({ id: servicePointResult.id, mpan: meterPoint.mpan });
                            }
                        }
                    }
                }
            }
        }
        
        // 5. FILE UPLOAD
        let fileId;
        console.log('--- FILE UPLOAD SECTION ---');
        console.log('Has File Content:', !!data.fileContent);
        console.log('Has File Name:', !!data.fileName);
        console.log('Has Account ID:', !!accountId);
        console.log('Has Opportunity ID:', !!opportunityId);
        
        if (data.fileContent && data.fileName && (accountId || opportunityId)) {
            console.log('Attempting to upload file to Salesforce...');
            
            // Determine the primary location for the file
            // Prefer Account if available, fallback to Opportunity
            const firstPublishLocationId = accountId || opportunityId;
            
            // 1. Create ContentVersion
            try {
                const contentVersionResult = await createRecord('ContentVersion', {
                    Title: data.fileName,
                    PathOnClient: data.fileName,
                    VersionData: data.fileContent,
                    FirstPublishLocationId: firstPublishLocationId 
                });
                console.log('ContentVersion Create Result:', JSON.stringify(contentVersionResult));

                if (contentVersionResult.success) {
                    fileId = contentVersionResult.id;
                    const contentVersionId = contentVersionResult.id;
                    console.log('File uploaded successfully. ID:', contentVersionId);

                    // 2. Query ContentDocumentId
                    const cvQuery = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${contentVersionId}'`);
                    console.log('ContentDocument Query Result:', JSON.stringify(cvQuery));
                    if (cvQuery.totalSize > 0) {
                        const contentDocumentId = cvQuery.records[0].ContentDocumentId;
                        console.log('Found ContentDocumentId:', contentDocumentId);
                        
                        // 3. Link to the OTHER record if both exist
                        // If we published to Account, link to Opportunity. If we published to Opportunity, link to Account.
                        const secondaryLinkId = (firstPublishLocationId === accountId) ? opportunityId : accountId;
                        
                        if (secondaryLinkId) {
                            console.log(`Linking file to secondary record: ${secondaryLinkId}`);
                            const linkResult = await createRecord('ContentDocumentLink', {
                                ContentDocumentId: contentDocumentId,
                                LinkedEntityId: secondaryLinkId,
                                ShareType: 'V',
                                Visibility: 'AllUsers'
                            });
                            console.log('Secondary Link Result:', JSON.stringify(linkResult));
                        }
                    } else {
                        console.warn('Could not find ContentDocumentId for uploaded version.');
                    }
                } else {
                    console.error('Failed to create ContentVersion:', contentVersionResult.errors);
                }
            } catch (fileError) {
                console.error('EXCEPTION during file upload:', fileError);
            }
        } else {
            console.warn('SKIPPING FILE UPLOAD: Missing file content, filename, or record IDs.', {
                hasContent: !!data.fileContent,
                hasName: !!data.fileName,
                hasAccount: !!accountId,
                hasOpp: !!opportunityId
            });
        }

        // Response
        const session = await authenticate();
        res.json({
            success: true,
            message: 'Application processed successfully via Lead Conversion',
            records: {
                instanceUrl: session.instanceUrl,
                accountId,
                contactId,
                opportunityId,
                contentDocumentId: fileId ? (await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${fileId}'`)).records[0]?.ContentDocumentId : null,
                stage: stageName,
                sitesCreated: createdPremises.length,
                servicePointsCreated: createdServicePoints.length,
                servicePoints: createdServicePoints
            }
        });

    } catch (error) {
        console.error('❌ Salesforce integration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Generic SOQL query endpoint (for testing/debugging)
 * POST /api/salesforce/query
 */
app.post('/api/salesforce/query', async (req, res) => {
    try {
        const { soql } = req.body;
        
        if (!soql) {
            return res.status(400).json({ error: 'SOQL query is required' });
        }

        const result = await query(soql);
        res.json(result);
    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// AI Proxy Endpoint
app.post('/api/ai/generate', async (req, res) => {
    try {
        const { prompt, image, media, model = "gemini-2.5-flash", systemInstruction, responseModalities, speechConfig } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY is not set in environment variables.');
            return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY missing' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelInstance = genAI.getGenerativeModel({ 
            model: model,
            systemInstruction: systemInstruction 
        });

        const parts = [];

        // Add media part if available
        const mediaInput = media || image;
        if (mediaInput && mediaInput.mimeType && mediaInput.data) {
            parts.push({ 
                inlineData: { 
                    mimeType: mediaInput.mimeType, 
                    data: mediaInput.data 
                } 
            });
        }
        
        if (prompt) {
            parts.push({ text: prompt });
        }

        console.log(`🤖 AI Request: ${model} | Media: ${!!mediaInput}`);

        const result = await modelInstance.generateContent({
            contents: [{ role: 'user', parts }],
            generationConfig: {
                responseModalities: responseModalities,
                speechConfig: speechConfig
            }
        });

        const response = result.response;
        const text = response.text() || "";

        res.json({ 
            text,
            candidates: response.candidates 
        });

    } catch (error) {
        console.error('❌ AI Proxy Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate content' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Salesforce proxy server running on http://localhost:${PORT}`);
    console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

