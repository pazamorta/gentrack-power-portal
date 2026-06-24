import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from 'child_process';

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

// Salesforce sessions cache
let salesforceSessions = {
    primary: null,
    secondary: null
};

/**
 * Authenticate via Salesforce CLI (for local development fallback)
 */
function authenticateViaCLI(alias) {
    try {
        console.log(`🔄 Attempting to authenticate via Salesforce CLI for alias: ${alias}...`);
        const result = execSync(`sf org display -o ${alias} --json`, { encoding: 'utf8' });
        const parsed = JSON.parse(result);
        if (parsed && parsed.status === 0 && parsed.result) {
            const { accessToken, instanceUrl, id } = parsed.result;
            const userId = id ? id.split('/').pop() : null;
            console.log(`✅ Authenticated via CLI for alias: ${alias}`);
            return {
                accessToken,
                instanceUrl,
                userId,
                expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes cache for CLI
            };
        }
    } catch (error) {
        console.warn(`⚠️ Failed to authenticate via CLI for alias: ${alias}: ${error.message}`);
    }
    return null;
}

/**
 * Authenticate with Salesforce for a given environment
 */
async function authenticate(envName = 'primary') {
    // Check if we have a valid cached session
    if (salesforceSessions[envName] && salesforceSessions[envName].expiresAt > Date.now()) {
        return salesforceSessions[envName];
    }

    const suffix = envName === 'secondary' ? '_2' : '';
    const clientId = process.env[`SALESFORCE_CLIENT_ID${suffix}`] || process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env[`SALESFORCE_CLIENT_SECRET${suffix}`] || process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env[`SALESFORCE_LOGIN_URL${suffix}`] || 'https://login.salesforce.com';
    const refreshToken = process.env[`SALESFORCE_REFRESH_TOKEN${suffix}`];
    const username = process.env[`SALESFORCE_USERNAME${suffix}`];
    const password = process.env[`SALESFORCE_PASSWORD${suffix}`];
    const securityToken = process.env[`SALESFORCE_SECURITY_TOKEN${suffix}`] || '';
    const cliAlias = process.env[envName === 'secondary' ? 'SALESFORCE_CLI_ALIAS_SECONDARY' : 'SALESFORCE_CLI_ALIAS_PRIMARY'] || (envName === 'secondary' ? 'DemoCX' : 'GTCX');

    console.log(`🔑 Authenticating Salesforce environment: ${envName} (CLI Alias: ${cliAlias})...`);

    // Method 1: Refresh Token Flow (Recommended)
    if (refreshToken && clientId && clientSecret) {
        try {
            console.log(`🔄 [${envName}] Authenticating via Refresh Token...`);
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
                const identityUrl = data.id;
                const userId = identityUrl ? identityUrl.split('/').pop() : null;

                salesforceSessions[envName] = {
                    accessToken: data.access_token,
                    instanceUrl: data.instance_url,
                    userId: userId,
                    expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
                };
                console.log(`✅ [${envName}] Authenticated with Salesforce (Refresh Token)`);
                return salesforceSessions[envName];
            } else {
                console.warn(`⚠️ [${envName}] Refresh Token authentication failed. Falling back...`);
                const text = await response.text();
                console.error(`Refresh Token Error for ${envName}:`, text);
            }
        } catch (e) {
            console.error(`[${envName}] Refresh Token Network Error:`, e);
        }
    }

    // Method 2: Password Flow (Legacy/Fallback)
    if (username && password && clientId && clientSecret) {
        try {
            console.log(`🔄 [${envName}] Authenticating via Password Flow...`);
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

            if (response.ok) {
                const data = await response.json();
                salesforceSessions[envName] = {
                    accessToken: data.access_token,
                    instanceUrl: data.instance_url,
                    expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
                };
                console.log(`✅ [${envName}] Authenticated with Salesforce (Password Flow)`);
                return salesforceSessions[envName];
            } else {
                console.warn(`⚠️ [${envName}] Password Flow failed. Falling back...`);
                const text = await response.text();
                console.error(`Password Flow Error for ${envName}:`, text);
            }
        } catch (e) {
            console.error(`[${envName}] Password Flow Network Error:`, e);
        }
    }

    // Method 3: CLI Fallback (Development Only)
    console.log(`🔄 [${envName}] Falling back to Salesforce CLI authentication...`);
    const cliSession = authenticateViaCLI(cliAlias);
    if (cliSession) {
        salesforceSessions[envName] = cliSession;
        return cliSession;
    }

    throw new Error(`Salesforce authentication failed for environment: ${envName}. No authentication method succeeded.`);
}

/**
 * Make an authenticated request to Salesforce REST API
 */
async function salesforceRequest(endpoint, options = {}, envName = 'primary') {
    const session = await authenticate(envName);

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
        throw new Error(`Salesforce API error on [${envName}]: ${response.status} - ${errorText}`);
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
async function query(soql, envName = 'primary') {
    const encodedQuery = encodeURIComponent(soql);
    return salesforceRequest(`/services/data/v59.0/query?q=${encodedQuery}`, {}, envName);
}

/**
 * Create a Salesforce record
 */
async function createRecord(objectType, data, envName = 'primary') {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
        envName
    );
}

/**
 * Update a Salesforce record
 */
async function updateRecord(objectType, id, data, envName = 'primary') {
    return salesforceRequest(
        `/services/data/v59.0/sobjects/${objectType}/${id}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
        },
        envName
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
    const envName = req.query.env || 'primary';
    const suffix = envName === 'secondary' ? '_2' : '';
    let loginUrl = process.env[`SALESFORCE_LOGIN_URL${suffix}`] || 'https://login.salesforce.com';
    // Remove trailing slash if present
    if (loginUrl.endsWith('/')) {
        loginUrl = loginUrl.slice(0, -1);
    }
    
    const clientId = process.env[`SALESFORCE_CLIENT_ID${suffix}`] || process.env.SALESFORCE_CLIENT_ID;
    const redirectUri = req.query.redirect_uri || 'http://localhost:3000/oauth/callback';
    
    if (!clientId) {
        return res.status(500).json({ error: `Missing SALESFORCE_CLIENT_ID${suffix} env var` });
    }

    // Pass env in state parameter to retrieve it in callback
    const stateObj = { env: envName, redirect_uri: redirectUri };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    const url = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    
    console.log('----------------------------------------------------');
    console.log(`🔑 Generated Auth URL for [${envName}]:`);
    console.log(url);
    console.log('----------------------------------------------------');
    
    res.json({ url });
});

/**
 * Exchange Authorization Code for Tokens
 * POST /api/auth/exchange
 */
app.post('/api/auth/exchange', async (req, res) => {
    const { code, redirect_uri, state } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Missing code' });
    }

    // Decode state to get env Name
    let envName = 'primary';
    let originalRedirectUri = redirect_uri || 'http://localhost:3000/oauth/callback';
    if (state) {
        try {
            const decodedState = Buffer.from(state, 'base64').toString('utf8');
            const parsedState = JSON.parse(decodedState);
            if (parsedState.env) envName = parsedState.env;
            if (parsedState.redirect_uri) originalRedirectUri = parsedState.redirect_uri;
        } catch (e) {
            console.warn('Could not parse state parameter:', e);
        }
    }

    const suffix = envName === 'secondary' ? '_2' : '';
    const clientId = process.env[`SALESFORCE_CLIENT_ID${suffix}`] || process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env[`SALESFORCE_CLIENT_SECRET${suffix}`] || process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = process.env[`SALESFORCE_LOGIN_URL${suffix}`] || 'https://login.salesforce.com';
    
    console.log(`Using redirect_uri for [${envName}] exchange:`, originalRedirectUri);

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: originalRedirectUri
    });

    try {
        console.log(`🔄 Exchanging Authorization Code for Tokens for [${envName}]...`);
        const response = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Exchange failed for [${envName}]:`, data);
            return res.status(response.status).json(data);
        }

        // Cache the session immediately
        salesforceSessions[envName] = {
            accessToken: data.access_token,
            instanceUrl: data.instance_url,
            expiresAt: Date.now() + 90 * 60 * 1000, // 90 minutes
        };
        
        // Log the Refresh Token for the user
        if (data.refresh_token) {
            console.log('\n===============================================================');
            console.log(`🔐 NEW REFRESH TOKEN OBTAINED FOR [${envName}]`);
            console.log(`Copy this to your .env/Render env vars as SALESFORCE_REFRESH_TOKEN${suffix}:`);
            console.log(data.refresh_token);
            console.log('===============================================================\n');
            
            process.env[`SALESFORCE_REFRESH_TOKEN${suffix}`] = data.refresh_token;
        }

        res.json({ 
            success: true, 
            message: `Authenticated successfully for ${envName}`,
            refresh_token: data.refresh_token,
            env: envName
        });
    } catch (error) {
        console.error(`Exchange error for [${envName}]:`, error);
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
async function getRecordTypeId(sobjectType, developerName, envName = 'primary') {
    try {
        const queryStr = `SELECT Id FROM RecordType WHERE SobjectType = '${sobjectType}' AND DeveloperName = '${developerName}' LIMIT 1`;
        const result = await query(queryStr, envName);
        if (result.totalSize > 0) {
            return result.records[0].Id;
        }
        console.warn(`⚠️ RecordType not found: ${sobjectType} - ${developerName} on [${envName}]`);
        return null;
    } catch (e) {
        console.warn(`Error fetching RecordType on [${envName}]: ${e.message}`);
        return null;
    }
}

/**
 * Helper to create a Lead in a specific environment
 */
async function createLeadInEnv(data, envName) {
    try {
        console.log(`📥 [${envName}] Creating Lead:`, data.companyName);

        // Fetch RecordTypeId for GTCX_B2B_Lead
        const recordTypeId = await getRecordTypeId('Lead', 'GTCX_B2B_Lead', envName);

        // Map form fields to Salesforce Lead fields
        const leadData = {
            FirstName: data.contactName.split(' ')[0],
            LastName: data.contactName.split(' ').slice(1).join(' ') || 'Unknown',
            Company: data.companyName,
            Email: data.email,
            Phone: data.phone,
            Title: data.jobTitle,
            Website: data.website,
            LeadSource: 'Website',
            Status: 'Open - Not Contacted',
            Description: `Created via Web Form. TPI: ${data.userType === 'tpi' ? 'Yes' : 'No'}`,
            GTCX_CompanyRegistrationNumber__c: data.companyNumber
        };

        if (data.userType === 'tpi' && data.tpiIdentifier) {
            leadData.GTCX_TPI__c = '001Dx00001LvqRHIAZ';
        }

        if (recordTypeId) {
            leadData.RecordTypeId = recordTypeId;
        }

        if (data.tpiIdentifier) {
            leadData.Description += `\nTPI Identifier: ${data.tpiIdentifier}`;
        }

        let leadResult;
        try {
            leadResult = await createRecord('Lead', leadData, envName);
        } catch (initialError) {
             // Retry without RecordTypeId if it fails due to record type issues
             if (leadData.RecordTypeId && (initialError.message.includes('INVALID_CROSS_REFERENCE_KEY') || initialError.message.includes('invalid record type') || initialError.message.includes('INSUFFICIENT_ACCESS'))) {
                 console.warn(`⚠️ [${envName}] Creation with RecordTypeId failed. Retrying without RecordTypeId...`);
                 delete leadData.RecordTypeId;
                 leadResult = await createRecord('Lead', leadData, envName);
             } else {
                 throw initialError;
             }
        }

        if (!leadResult.success) {
            throw new Error('Failed to create Lead: ' + JSON.stringify(leadResult.errors));
        }

        console.log(`✅ [${envName}] Created Lead:`, leadResult.id);

        let contentDocumentId = null;
        if (leadResult.success && data.fileContent && data.fileName) {
            console.log(`📎 [${envName}] Attaching LOA file to Lead...`);
            try {
                // 1. Create ContentVersion
                const cvResult = await createRecord('ContentVersion', {
                    Title: data.fileName,
                    PathOnClient: data.fileName,
                    VersionData: data.fileContent,
                    FirstPublishLocationId: leadResult.id // Try auto-link first
                }, envName);

                if (cvResult.success) {
                    console.log(`   [${envName}] ContentVersion created:`, cvResult.id);
                    
                    // 2. Query for ContentDocumentId
                    const cvQuery = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${cvResult.id}'`, envName);
                    contentDocumentId = cvQuery.records[0]?.ContentDocumentId;
                    
                    if (contentDocumentId) {
                        // 3. Explicitly Create ContentDocumentLink (Redundancy for safety)
                        console.log(`   [${envName}] Linking ContentDocument:`, contentDocumentId, 'to Lead:', leadResult.id);
                        try {
                            await createRecord('ContentDocumentLink', {
                                ContentDocumentId: contentDocumentId,
                                LinkedEntityId: leadResult.id,
                                ShareType: 'V' // Viewer permission
                            }, envName);
                            console.log(`   ✅ [${envName}] ContentDocumentLink created successfully`);
                        } catch (linkErr) {
                            // Ignore duplicate link error if FirstPublishLocationId worked
                            if (!linkErr.message.includes('DUPLICATE_VALUE')) {
                                console.warn(`   ⚠️ [${envName}] Failed to create explicit ContentDocumentLink:`, linkErr.message);
                            }
                        }
                    }
                } else {
                    console.error(`   [${envName}] Failed to create ContentVersion:`, cvResult.errors);
                }
            } catch (fileErr) {
                console.error(`   [${envName}] Exception attaching file:`, fileErr);
            }
        }

        return {
            success: true,
            leadId: leadResult.id,
            contentDocumentId,
            message: 'Lead created successfully'
        };
    } catch (err) {
        console.error(`❌ [${envName}] Create Lead error:`, err);
        return {
            success: false,
            error: err.message
        };
    }
}

/**
 * Create a Salesforce Lead (Dual Environments)
 * POST /api/salesforce/lead
 */
app.post('/api/salesforce/lead', async (req, res) => {
    try {
        const data = req.body;
        console.log('📥 Received Lead request. Processing on dual environments...');

        const [primaryResult, secondaryResult] = await Promise.all([
            createLeadInEnv(data, 'primary'),
            createLeadInEnv(data, 'secondary')
        ]);

        if (!primaryResult.success && !secondaryResult.success) {
            return res.status(500).json({
                success: false,
                error: `Both Salesforce environments failed. Primary error: ${primaryResult.error}. Secondary error: ${secondaryResult.error}`
            });
        }

        res.json({
            success: true,
            primary: primaryResult,
            secondary: secondaryResult,
            leadId: primaryResult.leadId || secondaryResult.leadId,
            contentDocumentId: primaryResult.contentDocumentId || secondaryResult.contentDocumentId,
            message: 'Lead creation processed on dual environments'
        });
    } catch (error) {
        console.error('❌ Dual lead creation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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
        if (data.contractStartDate) fieldsToUpdate.GTCX_Estimated_Contract_Start_Date__c = data.contractStartDate;
        if (data.contractLength) {
            // Salesfore Multi-Select picklists require a semicolon separated string
            fieldsToUpdate.GTCX_Duration_Preferences__c = Array.isArray(data.contractLength) 
                ? data.contractLength.join(';') 
                : data.contractLength;
        }
        if (data.onsiteGeneration !== undefined) fieldsToUpdate.GTCX_Onsite_Generation__c = Boolean(data.onsiteGeneration);
        
        // Remove standard/description mappings if they are no longer needed, or keep as fallback? 
        // User asked to update the *following fields*, implying specific mapping. I will remove the old description mappings to keep it clean.
        delete fieldsToUpdate.contractStartDate;
        delete fieldsToUpdate.contractLength;
        delete fieldsToUpdate.onsiteGeneration;

        await updateRecord('Opportunity', id, fieldsToUpdate);
        
        res.json({ success: true, message: 'Opportunity updated successfully' });
    } catch (error) {
        console.error('❌ Update Opportunity error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Helper to process invoice and details in a specific environment
 */
async function processInvoiceInEnv(data, envName) {
    try {
        console.log(`📥 [${envName}] Processing Invoice for:`, data.companyName);

        let accountId;
        let contactId;
        let opportunityId = null;
        let stageName = (data.sites && data.sites.length > 0) ? 'Qualification' : 'Qualification';

        // Helper to get converted status
        const getConvertedStatus = async () => {
            try {
                const statusResult = await query("SELECT MasterLabel FROM LeadStatus WHERE IsConverted=true AND MasterLabel != 'Converted' LIMIT 1", envName);
                if (statusResult.records && statusResult.records.length > 0) {
                    return statusResult.records[0].MasterLabel;
                }
            } catch (e) {
                console.warn(`Could not query specific converted status on [${envName}], falling back.`);
            }
            return 'Qualified';
        };

        // 1. LEAD CONVERSION FLOW
        // If TPI, we do NOT convert the lead, we just update it and attach files.
        if (data.leadId && data.userType !== 'tpi') {
            console.log(`🔄 [${envName}] Starting Standard Lead Conversion for:`, data.leadId);

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
                }, envName);
                console.log(`   [${envName}] Updated Lead with latest details.`);
            } catch (e) {
                console.warn(`   [${envName}] Could not update Lead before conversion:`, e.message);
            }

            // CHECK IF ALREADY CONVERTED
            let isAlreadyConverted = false;
            try {
                const leadStatusQuery = await query(`SELECT IsConverted, ConvertedAccountId, ConvertedContactId, ConvertedOpportunityId FROM Lead WHERE Id = '${data.leadId}'`, envName);
                if (leadStatusQuery.totalSize > 0 && leadStatusQuery.records[0].IsConverted) {
                    console.log(`ℹ️ [${envName}] Lead is ALREADY CONVERTED. Skipping SOAP Conversion.`);
                    const convertedLead = leadStatusQuery.records[0];
                    accountId = convertedLead.ConvertedAccountId;
                    contactId = convertedLead.ConvertedContactId;
                    opportunityId = null; 
                    isAlreadyConverted = true;
                    console.log(`   [${envName}] Reusing existing Account/Contact but FORCING NEW Opportunity:`, accountId, contactId);
                }
            } catch (err) {
                console.error(`[${envName}] Error checking lead conversion status:`, err);
            }

            // B. Perform Conversion (Only if not already converted)
            if (!isAlreadyConverted) {
                const convertedStatus = await getConvertedStatus();
                const session = await authenticate(envName);
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
                            <urn:ownerId>${session.userId || ''}</urn:ownerId>
                            <urn:doNotCreateOpportunity>true</urn:doNotCreateOpportunity>
                         </urn:leadConverts>
                      </urn:convertLead>
                   </soapenv:Body>
                </soapenv:Envelope>
                `;

                console.log(`   [${envName}] Sending SOAP convertLead request...`);
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
                    console.error(`⚠️ [${envName}] Conversion failed:`, responseText);
                    throw new Error('Lead Conversion Failed. SOAP Response: ' + responseText);
                } else {
                    const accountMatch = responseText.match(/<(?:\w+:)?accountId>(.*?)<\/(?:\w+:)?accountId>/i);
                    const contactMatch = responseText.match(/<(?:\w+:)?contactId>(.*?)<\/(?:\w+:)?contactId>/i);
                    const opportunityMatch = responseText.match(/<(?:\w+:)?opportunityId>(.*?)<\/(?:\w+:)?opportunityId>/i);
                    
                    accountId = accountMatch ? accountMatch[1] : null;
                    contactId = contactMatch ? contactMatch[1] : null;
                    opportunityId = opportunityMatch ? opportunityMatch[1] : null;

                    console.log(`      [${envName}] Lead Converted Successfully via SOAP!`);
                    console.log(`   Account:`, accountId, `Contact:`, contactId, `Opp:`, opportunityId);
                }
            }
        }

        // 2. FALLBACK / MANUAL FLOW (If no leadId OR Conversion Failed)
        if (!accountId) {
            const companyNumberSafe = data.companyNumber ? data.companyNumber.replace(/'/g, "\\'") : '';
            const existingAccountsQuery = companyNumberSafe
                ? `SELECT Id FROM Account WHERE Name = '${data.companyName.replace(/'/g, "\\'")}' OR GTCX_CompanyRegistrationNumber__c = '${companyNumberSafe}' LIMIT 1`
                : `SELECT Id FROM Account WHERE Name = '${data.companyName.replace(/'/g, "\\'")}' LIMIT 1`;
            const existingAccounts = await query(existingAccountsQuery, envName);

            const industryMapping = {
                'information technology': 'Technology',
                'financials': 'Banking',
                'health care': 'Healthcare & Life Sciences',
                'communication services': 'Communications',
                'real estate': 'Retail', 
                'utilities': 'Energy'    
            };
            const normalizedIndustry = data.industry ? (industryMapping[data.industry.toLowerCase()] || data.industry) : undefined;

            const accountFields = {
                Industry: normalizedIndustry,
                NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) || undefined : undefined,
                Website: data.website,
                GTCX_Broker_Name__c: data.brokerName || undefined,
                Description: `Created/Updated from Web Form on ${new Date().toISOString()}`
            };

            if (existingAccounts.totalSize > 0) {
                accountId = existingAccounts.records[0].Id;
                await updateRecord('Account', accountId, accountFields, envName);
            } else {
                const accountResult = await createRecord('Account', {
                    Name: data.companyName,
                    Type: 'Prospect',
                    ...accountFields
                }, envName);
                if (!accountResult.success) throw new Error('Failed to create Account: ' + JSON.stringify(accountResult.errors));
                accountId = accountResult.id;
            }
            
            // Contact Logic (Manual)
            if (!contactId && (data.contactName || data.contactEmail)) {
                 const email = data.email || data.contactEmail;
                 const existingContacts = email ? await query(`SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`, envName) : { totalSize: 0 };
                 
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
                     }, envName);
                     if (contactResult.success) contactId = contactResult.id;
                 }
            }
        }

        // 3. POST-CONVERSION / UPDATES
        if (accountId) {
             const industryMapping = {
                 'information technology': 'Technology',
                 'financials': 'Banking',
                 'health care': 'Healthcare & Life Sciences',
                 'communication services': 'Communications',
                 'real estate': 'Retail', 
                 'utilities': 'Energy'
             };
             const normalizedIndustry = data.industry ? (industryMapping[data.industry.toLowerCase()] || data.industry) : undefined;

             await updateRecord('Account', accountId, {
                 Industry: normalizedIndustry,
                 NumberOfEmployees: data.companySize ? parseInt(data.companySize.split('-')[0]) : undefined,
                 GTCX_Legal_Name__c: data.companyName,
                 GTCX_Points_Of_Delivery_Count__c: data.sites?.length || 0,
                 GTCX_Broker_Name__c: data.brokerName || undefined,
                 GTCX_Credit_Score__c: 75
             }, envName);
        }

        // Handle Opportunity
        const estimatedAnnualConsumption = data.annualConsumption || (data.totalConsumption ? data.totalConsumption * 12 : 0);
        const opportunityAmount = estimatedAnnualConsumption * 80;

        let oppRecordTypeId = data.recordTypeId;
        if (!oppRecordTypeId) {
            oppRecordTypeId = await getRecordTypeId('Opportunity', 'Regulated_Electricity', envName);
        }

        const customerSegment = data.customerSegment || (oppRecordTypeId === '012Dx000000GwvuIAC' 
            ? (data.sites && data.sites.length > 1 ? 'I&C Multi Site' : 'I&C Single Site')
            : (data.sites && data.sites.length > 1 ? 'SME Multi Site' : 'SME Single Site'));

        let serviceType = 'Dual Fuel';
        if (data.energyDomains && data.energyDomains.length === 1) {
            const domain = data.energyDomains[0].toLowerCase();
            if (domain.includes('elect')) serviceType = 'Electricity';
            else if (domain.includes('gas')) serviceType = 'Gas';
            else if (domain.includes('water')) serviceType = 'Water';
        }

        const calculateEndDate = (startDate, durationStr) => {
            if (!startDate) return null;
            const date = new Date(startDate);
            if (isNaN(date.getTime())) return null;
            const months = parseInt(durationStr) || 12; 
            date.setMonth(date.getMonth() + months);
            return date.toISOString().split('T')[0];
        };
        const estimatedEndDate = calculateEndDate(data.contractStartDate, data.contractLength);

        const totalVolumeMWh = data.sites?.reduce((acc, site) => {
            const siteVolume = site.meterPoints?.reduce((sAcc, mp) => {
                return sAcc + (parseFloat(mp.annualConsumption) || 0);
            }, 0) || 0;
            return acc + siteVolume;
        }, 0) || 0;

        const margins = data.sites?.map(s => parseFloat(s.marginValue)).filter(v => !isNaN(v)) || [];
        const avgMargin = margins.length > 0 ? (margins.reduce((a, b) => a + b, 0) / margins.length) : 0;

        const opportunityFields = {
            StageName: stageName,
            Amount: opportunityAmount || (data.totalAmount ? data.totalAmount * 12 : undefined),
            CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            GTCX_Customer_Segment__c: customerSegment,
            GTCX_Company_Registration_Number__c: data.companyNumber || undefined,
            LeadSource: 'Website',
            GTCX_Pricing__c: 'G2 Pricing',
            
            GTCX_LOA_Level__c: 1,
            GTCX_LOA_Reference__c: 'Included',
            GTCX_Service_Type__c: serviceType,
            GTCX_Estimated_Contract_End_Date__c: estimatedEndDate,
            GTCX_Estimated_Sites_c__c: data.sites?.length || 0,
            GTCX_TPI_Margin__c: avgMargin,
            GTCX_TPI_Margin_Unit__c: 'p/kwh',
            GTCX_Estimated_Volume_MWh__c: totalVolumeMWh,
            GTCX_TPI_Agent__c: contactId
        };

        if (data.userType === 'tpi' && data.tpiIdentifier) {
            opportunityFields.GTCX_TPI__c = '001Dx00001LvqRHIAZ';
        }

        if (oppRecordTypeId) {
            opportunityFields.RecordTypeId = oppRecordTypeId;
        }

        if (opportunityId) {
            console.log(`[${envName}] Updating converted opportunity:`, opportunityId);
            try {
                await updateRecord('Opportunity', opportunityId, opportunityFields, envName);
            } catch (err) {
                 console.warn(`[${envName}] Initial Opportunity update failed: ${err.message}. Retrying without RecordTypeId...`);
                 if (opportunityFields.RecordTypeId) {
                      const fieldsWithoutRecordType = { ...opportunityFields };
                      delete fieldsWithoutRecordType.RecordTypeId;
                      try {
                         await updateRecord('Opportunity', opportunityId, fieldsWithoutRecordType, envName);
                         console.log(`✅ [${envName}] Retry Opportunity update successful`);
                      } catch (retryErr) {
                          console.error(`❌ [${envName}] Retry Opportunity update failed:`, retryErr);
                      }
                 }
            }
        } else {
            console.log(`[${envName}] Creating new opportunity...`);
            try {
                const oppResult = await createRecord('Opportunity', {
                    Name: `${data.companyName} - ${data.useCase || 'Energy'} Opportunity`,
                    AccountId: accountId,
                    ContactId: contactId,
                    ...opportunityFields
                }, envName);
                if (oppResult.success) opportunityId = oppResult.id;
            } catch (oppError) {
                  if (opportunityFields.RecordTypeId && (oppError.message.includes('INVALID_CROSS_REFERENCE_KEY') || oppError.message.includes('invalid record type') || oppError.message.includes('INSUFFICIENT_ACCESS'))) {
                      console.warn(`⚠️ [${envName}] Opportunity creation with RecordTypeId failed. Retrying...`);
                      delete opportunityFields.RecordTypeId;
                      const retryOppResult = await createRecord('Opportunity', {
                         Name: `${data.companyName} - ${data.useCase || 'Energy'} Opportunity`,
                         AccountId: accountId,
                         ContactId: contactId,
                         ...opportunityFields
                      }, envName);
                      if (retryOppResult.success) opportunityId = retryOppResult.id;
                   } else {
                       throw new Error(`Opportunity Creation Failed: ${oppError.message}`);
                   }
             }
        }

        // Opportunity Contact Role
        if (opportunityId && contactId) {
            try {
                const existingRoleQuery = await query(`SELECT Id FROM OpportunityContactRole WHERE OpportunityId = '${opportunityId}' AND ContactId = '${contactId}'`, envName);
                const roleName = data.userType === 'tpi' ? 'TPI' : 'Business User';

                if (existingRoleQuery.totalSize === 0) {
                    await createRecord('OpportunityContactRole', {
                        OpportunityId: opportunityId,
                        ContactId: contactId,
                        Role: roleName,
                        IsPrimary: true
                    }, envName);
                } else {
                    await updateRecord('OpportunityContactRole', existingRoleQuery.records[0].Id, {
                        Role: roleName
                    }, envName);
                }
            } catch (roleErr) {
                console.error(`[${envName}] Failed to manage OpportunityContactRole:`, roleErr.message);
            }
        }

        // Sites and Service Points
        const createdProperties = [];
        const createdServicePoints = [];

        if (data.sites && data.sites.length > 0) {
            for (const site of data.sites) {
                const postcode = site.postcodeComponent || site.postcode || '';
                const street = site.addressComponent || site.address || '';
                const fallbackId = (site.meterPoints && site.meterPoints[0] && site.meterPoints[0].mpan)
                    ? site.meterPoints[0].mpan
                    : `Property ${postcode || 'Unknown'}`;
                const propertyName = (site.name && !site.name.includes('Unknown Site') && site.name.trim() !== '')
                    ? site.name
                    : fallbackId;

                const parseTaxExemption = (val) => {
                    if (!val) return undefined;
                    const str = val.toString().toLowerCase().trim();
                    if (['true', 'yes', 'y', '1'].includes(str)) return 1;
                    if (['false', 'no', 'n', '0'].includes(str)) return 0;
                    return isNaN(parseFloat(str)) ? undefined : parseFloat(str);
                };

                let propertyAccountId;
                try {
                    const subAccountResult = await createRecord('Account', {
                        Name: propertyName,
                        ParentId: accountId,
                        Type: 'Prospect',
                        BillingStreet: street,
                        BillingCity: site.city || '',
                        BillingPostalCode: postcode,
                        BillingCountry: site.country || 'GB'
                    }, envName);
                    if (subAccountResult.success) {
                        propertyAccountId = subAccountResult.id;
                    }
                } catch (accErr) {
                    console.warn(`   [${envName}] Property Sub-Account creation failed: ${accErr.message}`);
                }

                let propertyId;
                try {
                    const propertyResult = await createRecord('GTCX_Property__c', {
                        Name: propertyName,
                        GTCX_Account__c: propertyAccountId || accountId,
                        GTCX_Address__Street__s: street,
                        GTCX_Address__City__s: site.city || '',
                        GTCX_Address__CountryCode__s: site.country || 'GB',
                        GTCX_Address__PostalCode__s: postcode,
                        GTCX_Type__c: site.propertyType || "Site"
                    }, envName);
                    
                    if (propertyResult.success || propertyResult.id) {
                        propertyId = propertyResult.id || propertyResult.id;
                        createdProperties.push({ id: propertyId, name: propertyName });
                    }
                } catch (propErr) {
                    console.error(`[${envName}] Failed to create GTCX_Property__c:`, propErr.message);
                    continue;
                }

                if (propertyId) {
                    try {
                        const siteData = {
                            GTCX_Property__c: propertyId,
                            GTCX_Opportunity__c: opportunityId,
                            GTCX_Start_Date__c: site.startDate || data.contractStartDate
                        };
                        if (site.endDate) {
                            siteData.GTCX_End_Date__c = site.endDate;
                        } else if (data.contractStartDate && data.contractLength) {
                            siteData.GTCX_End_Date__c = estimatedEndDate;
                        }
                        if (site.product) siteData.GTCX_Product__c = site.product;
                        const marginValue = site.marginValue ? parseFloat(site.marginValue) : NaN;
                        if (!isNaN(marginValue)) siteData.GTCX_Margin_Value__c = marginValue;
                        const taxExemption = parseTaxExemption(site.taxExemption);
                        if (taxExemption !== undefined) siteData.GTCX_Tax_Exemption__c = taxExemption;
                        const paymentTerm = site.paymentTerm ? parseInt(site.paymentTerm) : NaN;
                        if (!isNaN(paymentTerm)) siteData.GTCX_Payment_Term__c = paymentTerm;

                        await createRecord('GTCX_Site__c', siteData, envName);
                    } catch (assocErr) {
                         console.error(`   [${envName}] Failed to create GTCX_Site__c:`, assocErr.message);
                    }

                    if (site.meterPoints && site.meterPoints.length > 0) {
                        for (const meterPoint of site.meterPoints) {
                            const marketIdentifier = meterPoint.meterNumber || '';
                            let rawFuel = (meterPoint.fuelType || 'Electricity').toLowerCase();
                            let normalizedFuel = 'Electricity';
                            if (rawFuel.includes('gas')) normalizedFuel = 'Gas';
                            else if (rawFuel.includes('water')) normalizedFuel = 'Water';
                            
                            const fuelType = normalizedFuel;
                            let annualConsumptionNum = meterPoint.annualConsumption ? parseFloat(meterPoint.annualConsumption) : undefined;
                            if (isNaN(annualConsumptionNum) && data.totalConsumption) annualConsumptionNum = parseFloat(data.totalConsumption);
                            if (isNaN(annualConsumptionNum)) annualConsumptionNum = undefined;

                            let supplyStatus = undefined;
                            if (meterPoint.supplyStatus) {
                                const statusStr = meterPoint.supplyStatus.toLowerCase();
                                const validStatuses = {
                                    'not supplied': 'Not Supplied',
                                    'onboarding': 'Onboarding',
                                    'registered': 'Registered',
                                    'rejected': 'Rejected',
                                    'new': 'New'
                                };
                                if (statusStr.includes('active') && !statusStr.includes('inactive')) {
                                    supplyStatus = 'Registered';
                                } else if (statusStr.includes('inactive')) {
                                    supplyStatus = 'Not Supplied';
                                } else {
                                    supplyStatus = validStatuses[statusStr] || undefined;
                                }
                            }

                            try {
                                const servicePointResult = await createRecord('GTCX_Service_Point__c', {
                                    GTCX_Market_Identifier__c: marketIdentifier,
                                    GTCX_Service_Type__c: fuelType,
                                    GTCX_Property__c: propertyId,
                                    GTCX_Annual_Consumption__c: annualConsumptionNum,
                                    GTCX_Product_Preference__c: meterPoint.productPreference || undefined,
                                    GTCX_Duration_Options__c: meterPoint.durationOptions || undefined,
                                    GTCX_Contact_Name__c: meterPoint.contactName || undefined,
                                    GTCX_Contact_Email__c: meterPoint.contactEmail || undefined,
                                    GTCX_Contact_Phone__c: meterPoint.contactPhone || undefined,
                                    GTCX_Company_Number__c: meterPoint.companyNumber || undefined,
                                    GTCX_Supply_Status__c: supplyStatus
                                }, envName);

                                if (servicePointResult.success || servicePointResult.id) {
                                    createdServicePoints.push({ id: servicePointResult.id || servicePointResult.id, mpan: marketIdentifier });
                                }
                            } catch (spError) {
                                console.error(`[${envName}] Failed to create Service Point for MPAN ${marketIdentifier}:`, spError.message);
                            }
                        }
                    }
                }
            }
        }
        
        // File Upload
        let fileId;
        if (data.fileContent && data.fileName && (accountId || opportunityId || data.leadId)) {
            const firstPublishLocationId = accountId || opportunityId || data.leadId;
            try {
                const contentVersionResult = await createRecord('ContentVersion', {
                    Title: data.fileName,
                    PathOnClient: data.fileName,
                    VersionData: data.fileContent,
                    FirstPublishLocationId: firstPublishLocationId 
                }, envName);

                if (contentVersionResult.success) {
                    fileId = contentVersionResult.id;
                    const cvQuery = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${fileId}'`, envName);
                    if (cvQuery.totalSize > 0) {
                        const contentDocumentId = cvQuery.records[0].ContentDocumentId;
                        const secondaryLinkId = (firstPublishLocationId === accountId) ? opportunityId : accountId;
                        if (secondaryLinkId) {
                            await createRecord('ContentDocumentLink', {
                                ContentDocumentId: contentDocumentId,
                                LinkedEntityId: secondaryLinkId,
                                ShareType: 'V',
                                Visibility: 'AllUsers'
                            }, envName);
                        }
                    }
                }
            } catch (fileError) {
                console.error(`[${envName}] EXCEPTION during file upload:`, fileError);
            }
        }

        // Recover Opp ID last resort
        if (!opportunityId && accountId) {
            try {
                const finalOppQuery = await query(`SELECT Id FROM Opportunity WHERE AccountId = '${accountId}' ORDER BY CreatedDate DESC LIMIT 1`, envName);
                if (finalOppQuery.totalSize > 0) {
                    opportunityId = finalOppQuery.records[0].Id;
                }
            } catch (err) {
                console.error(`[${envName}] Final Opportunity recovery query failed:`, err.message);
            }
        }

        // Fetch session for response
        const session = await authenticate(envName);
        let contentDocumentId = null;
        if (fileId) {
             try {
                 const docQuery = await query(`SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${fileId}'`, envName);
                 contentDocumentId = docQuery.records[0]?.ContentDocumentId;
             } catch (e) {}
        }

        return {
            success: true,
            records: {
                instanceUrl: session.instanceUrl,
                accountId,
                contactId,
                opportunityId,
                contentDocumentId,
                stage: stageName,
                sitesCreated: createdProperties.length,
                servicePointsCreated: createdServicePoints.length,
                servicePoints: createdServicePoints
            }
        };

    } catch (error) {
        console.error(`❌ [${envName}] processInvoiceInEnv error:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Handle Full Form Submission (Invoice + Details) - Dual Environments
 * POST /api/salesforce/invoice
 */
app.post('/api/salesforce/invoice', async (req, res) => {
    try {
        const data = req.body;
        console.log('[POST] /api/salesforce/invoice - Processing on dual environments');

        const [primaryResult, secondaryResult] = await Promise.all([
            processInvoiceInEnv(data, 'primary'),
            processInvoiceInEnv(data, 'secondary')
        ]);

        if (!primaryResult.success && !secondaryResult.success) {
            return res.status(500).json({
                success: false,
                error: `Both Salesforce environments failed. Primary error: ${primaryResult.error}. Secondary error: ${secondaryResult.error}`
            });
        }

        res.json({
            success: true,
            primary: primaryResult,
            secondary: secondaryResult,
            message: 'Application processed successfully on dual environments',
            records: primaryResult.success ? primaryResult.records : secondaryResult.records
        });

    } catch (error) {
        console.error('❌ Dual invoice processing error:', error);
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

// OS Places API Proxy
app.get('/api/address/lookup', async (req, res) => {
    try {
        const { postcode } = req.query;
        if (!postcode) {
            return res.status(400).json({ error: 'Postcode is required' });
        }

        const apiKey = process.env.OS_API_KEY || process.env.ORDNANCE_SURVEY_API_KEY || process.env.OS_PROJECT_API_KEY;
        if (!apiKey) {
            console.error('❌ OS_API_KEY is missing');
            return res.status(500).json({ error: 'Server configuration error: Missing OS API Key' });
        }

        const osUrl = `https://api.os.uk/search/places/v1/postcode?postcode=${encodeURIComponent(postcode)}&key=${apiKey}`;
        console.log(`🗺️  OS Places Lookup: ${postcode}`);

        const response = await fetch(osUrl);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OS API Error:', response.status, errorText);
            console.log('⚠️ Returning mock address data as fallback');
            return res.json({
                results: [
                    { DPA: { ADDRESS: `1 High Street, London, ${postcode}`, POSTCODE: postcode, POST_TOWN: "London" } },
                    { DPA: { ADDRESS: `2 High Street, London, ${postcode}`, POSTCODE: postcode, POST_TOWN: "London" } },
                    { DPA: { ADDRESS: `3 High Street, London, ${postcode}`, POSTCODE: postcode, POST_TOWN: "London" } }
                ]
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('❌ Address Lookup Error:', error);
        res.status(500).json({ error: error.message });
    }
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

