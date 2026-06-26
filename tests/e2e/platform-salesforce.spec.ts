import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const apiUrl = process.env.E2E_API_URL || 'https://gentrack-power-portal.onrender.com';

type SalesforceEnvName = 'GTCX' | 'DemoCX';

type SalesforceEnvResult = {
  leadId: string;
  accountId: string;
  opportunityId: string;
  sites: Array<{ id: string; propertyId?: string; servicePointId?: string }>;
  servicePoints: Array<{ id: string; mpan: string }>;
};

type TestPortfolio = {
  stamp: string;
  companyName: string;
  companyNumber: string;
  contactName: string;
  email: string;
  phone: string;
  siteA: string;
  siteB: string;
  mpanA: string;
  mpanB: string;
  csvPath: string;
};

function makePortfolio(csvPath: string): TestPortfolio {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const companyName = `Playwright E2E Portal ${stamp}`;
  const siteA = `${companyName} Site A`;
  const siteB = `${companyName} Site B`;
  const mpanA = `PW${stamp.slice(-8)}A`;
  const mpanB = `PW${stamp.slice(-8)}B`;

  const csv = [
    'Property Name,AddressLine1,City,Postcode,Type,market_identifier,Service Type,Annual Consumption,Product Preference,Duration Options,Supply Status,TPI Margin,Payment Term',
    `${siteA},1 Test Street,London,SW1A 1AA,Site,${mpanA},Electricity,12000,Fixed,24 Months,New,1.5,14`,
    `${siteB},2 Test Avenue,Manchester,M1 1AE,Site,${mpanB},Gas,8000,Flexible,24 Months,New,1.7,14`
  ].join('\n');

  writeFileSync(csvPath, csv);

  return {
    stamp,
    companyName,
    companyNumber: `PWE${stamp.slice(-8)}`,
    contactName: `Playwright Tester ${stamp}`,
    email: `playwright.e2e.${stamp}@example.com`,
    phone: '+441234567890',
    siteA,
    siteB,
    mpanA,
    mpanB,
    csvPath
  };
}

async function chooseSegmentAnswer(page: Page, question: string, answer: 'Yes' | 'No') {
  await page.locator('label', { hasText: question }).locator('..').getByRole('button', { name: answer }).click();
}

async function submitPlatformForm(page: Page, portfolio: TestPortfolio) {
  await page.goto('./#/platform', { waitUntil: 'networkidle' });

  await expect(page.getByRole('heading', { name: 'Company and Contact Information' })).toBeVisible();
  await page.locator('input[name="companyName"]').fill(portfolio.companyName);
  await page.locator('input[name="companyNumber"]').fill(portfolio.companyNumber);
  await page.locator('input[name="website"]').fill('https://example.com');
  await page.locator('input[name="contactName"]').fill(portfolio.contactName);
  await page.locator('input[name="jobTitle"]').fill('Energy Manager');
  await page.locator('input[name="email"]').fill(portfolio.email);
  await page.locator('input[name="phone"]').fill(portfolio.phone);
  await page.locator('label:has-text("I consent") input[type="checkbox"]').check();

  const leadResponsePromise = page.waitForResponse(response => response.url().includes('/api/salesforce/lead'));
  await page.getByRole('button', { name: 'Next' }).click();
  const leadResponse = await leadResponsePromise;
  expect(leadResponse.status(), await leadResponse.text()).toBe(200);
  const leadJson = await leadResponse.json();
  expect(leadJson.success).toBe(true);
  expect(leadJson.GTCX?.leadId).toBeTruthy();
  expect(leadJson.DemoCX?.leadId).toBeTruthy();

  await expect(page.getByRole('heading', { name: 'Business Details' })).toBeVisible();
  await chooseSegmentAnswer(page, 'Do you spend less than', 'No');
  await chooseSegmentAnswer(page, 'Are you looking for just one site', 'No');
  await page.locator('select[name="industry"]').selectOption('Utilities');
  await page.locator('label:has-text("Electricity") input[type="checkbox"]').check();
  await page.locator('label:has-text("Gas") input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Next' }).click();

  await expect(page.getByRole('heading', { name: 'Portfolio Details' })).toBeVisible();
  await page.locator('input[type="file"][accept=".csv"]').setInputFiles(portfolio.csvPath);
  await expect(page.getByText('Successfully loaded 2 sites.')).toBeVisible();

  const invoiceResponsePromise = page.waitForResponse(response => response.url().includes('/api/salesforce/invoice'), {
    timeout: 180_000
  });
  await page.getByRole('button', { name: 'Next' }).click();
  const invoiceResponse = await invoiceResponsePromise;
  expect(invoiceResponse.status(), await invoiceResponse.text()).toBe(200);
  const invoiceJson = await invoiceResponse.json();
  expect(invoiceJson.success).toBe(true);

  const environments: Record<SalesforceEnvName, SalesforceEnvResult> = {
    GTCX: {
      leadId: leadJson.GTCX.leadId,
      accountId: invoiceJson.GTCX.records.accountId,
      opportunityId: invoiceJson.GTCX.records.opportunityId,
      sites: invoiceJson.GTCX.records.sites,
      servicePoints: invoiceJson.GTCX.records.servicePoints
    },
    DemoCX: {
      leadId: leadJson.DemoCX.leadId,
      accountId: invoiceJson.DemoCX.records.accountId,
      opportunityId: invoiceJson.DemoCX.records.opportunityId,
      sites: invoiceJson.DemoCX.records.sites,
      servicePoints: invoiceJson.DemoCX.records.servicePoints
    }
  };

  for (const [env, records] of Object.entries(environments)) {
    expect(records.accountId, `${env} account`).toBeTruthy();
    expect(records.opportunityId, `${env} opportunity`).toBeTruthy();
    expect(records.sites, `${env} sites`).toHaveLength(2);
    expect(records.servicePoints, `${env} service points`).toHaveLength(2);
  }

  await expect(page.getByRole('heading', { name: 'Contract Details' })).toBeVisible();
  await page.getByRole('button', { name: '24 Months' }).click();
  await page.locator('input[name="contractStartDate"]').fill('2026-07-01');
  await page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Onsite Generation' }) })
    .getByRole('button', { name: 'No' })
    .click();

  const updateResponsePromise = page.waitForResponse(response => response.url().includes('/api/salesforce/opportunity/'), {
    timeout: 120_000
  });
  await page.getByRole('button', { name: 'Submit Application' }).click();
  await expect(page.getByRole('heading', { name: 'Application Submitted!' })).toBeVisible({ timeout: 120_000 });
  const updateResponse = await updateResponsePromise;
  expect(updateResponse.status(), await updateResponse.text()).toBe(200);

  return environments;
}

async function soql(request: APIRequestContext, env: SalesforceEnvName, query: string) {
  const response = await request.post(`${apiUrl}/api/salesforce/query`, {
    data: { env, soql: query }
  });
  expect(response.ok(), await response.text()).toBe(true);
  const body = await response.json();
  expect(body.success ?? true, JSON.stringify(body)).toBeTruthy();
  return body.records as Array<Record<string, unknown>>;
}

async function verifySalesforceRecords(
  request: APIRequestContext,
  env: SalesforceEnvName,
  portfolio: TestPortfolio,
  records: SalesforceEnvResult
) {
  const siteObject = env === 'GTCX' ? 'GTCX_Site__c' : 'Site__c';
  const servicePointObject = env === 'GTCX' ? 'GTCX_Service_Point__c' : 'Service_Point__c';
  const siteFields =
    env === 'GTCX'
      ? 'Id, GTCX_Opportunity__c, GTCX_Property__c, GTCX_Service_Point__c, GTCX_Start_Date__c, GTCX_End_Date__c'
      : 'Id, Opportunity__c, Property__c, Service_Point__c, Start_Date__c, End_Date__c';
  const servicePointFields =
    env === 'GTCX'
      ? 'Id, GTCX_Market_Identifier__c, GTCX_Property__c'
      : 'Id, Market_Identifier__c, Property__c, Opportunity__c';

  const leadRows = await soql(
    request,
    env,
    `SELECT Id, Company, Email, IsConverted, ConvertedAccountId FROM Lead WHERE Id = '${records.leadId}'`
  );
  expect(leadRows).toHaveLength(1);
  expect(leadRows[0]).toMatchObject({
    Company: portfolio.companyName,
    Email: portfolio.email,
    IsConverted: true,
    ConvertedAccountId: records.accountId
  });

  const opportunityRows = await soql(
    request,
    env,
    `SELECT Id, Name, AccountId, StageName FROM Opportunity WHERE Id = '${records.opportunityId}'`
  );
  expect(opportunityRows).toHaveLength(1);
  expect(opportunityRows[0]).toMatchObject({
    Name: `${portfolio.companyName} - Energy Opportunity`,
    AccountId: records.accountId,
    StageName: 'Qualification'
  });

  const accountRows = await soql(
    request,
    env,
    `SELECT Id, Name, ParentId FROM Account WHERE Name LIKE '${portfolio.companyName}%' ORDER BY CreatedDate ASC`
  );
  expect(accountRows.map(row => row.Name)).toEqual(
    expect.arrayContaining([portfolio.companyName, portfolio.siteA, portfolio.siteB])
  );

  const siteIds = records.sites.map(site => site.id);
  const siteRows = await soql(
    request,
    env,
    `SELECT ${siteFields} FROM ${siteObject} WHERE Id IN ('${siteIds.join("','")}') ORDER BY CreatedDate ASC`
  );
  expect(siteRows).toHaveLength(2);

  const servicePointIds = records.servicePoints.map(servicePoint => servicePoint.id);
  const servicePointRows = await soql(
    request,
    env,
    `SELECT ${servicePointFields} FROM ${servicePointObject} WHERE Id IN ('${servicePointIds.join("','")}') ORDER BY CreatedDate ASC`
  );
  expect(servicePointRows).toHaveLength(2);

  const marketIdentifierField = env === 'GTCX' ? 'GTCX_Market_Identifier__c' : 'Market_Identifier__c';
  expect(servicePointRows.map(row => row[marketIdentifierField])).toEqual(
    expect.arrayContaining([portfolio.mpanA, portfolio.mpanB])
  );
}

test('platform form creates leads, opportunities, sites, and service points in GTCX and DemoCX', async ({
  page,
  request
}, testInfo) => {
  const portfolio = makePortfolio(testInfo.outputPath(`portfolio-${Date.now()}.csv`));
  const recordsByEnv = await submitPlatformForm(page, portfolio);

  await verifySalesforceRecords(request, 'GTCX', portfolio, recordsByEnv.GTCX);
  await verifySalesforceRecords(request, 'DemoCX', portfolio, recordsByEnv.DemoCX);
});
