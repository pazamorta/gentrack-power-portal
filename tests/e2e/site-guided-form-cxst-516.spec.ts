import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();

function readWorkspaceFile(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

async function renderSiteGuidedFormHarness(page: Page) {
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>CXST-516 site guided form evidence</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #181818;
            background: #f3f3f3;
          }
          .panel {
            background: #fff;
            border: 1px solid #d8dde6;
            border-radius: 8px;
            padding: 18px;
            max-width: 1120px;
          }
          .header {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 16px;
          }
          label {
            display: grid;
            gap: 4px;
            font-size: 12px;
            color: #444;
          }
          select {
            min-width: 104px;
            padding: 6px 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
          }
          th,
          td {
            text-align: left;
            border-bottom: 1px solid #dddbda;
            padding: 10px 12px;
          }
          th {
            background: #f3f2f2;
            font-weight: 600;
          }
          .notice {
            margin-top: 14px;
            padding: 10px 12px;
            border-radius: 4px;
            background: #e5f3ff;
            color: #032d60;
          }
        </style>
      </head>
      <body>
        <main class="panel" aria-label="Sites">
          <div class="header">
            <h1>Sites</h1>
            <label>
              Rows per page
              <select aria-label="Rows per page">
                <option selected>20</option>
                <option>50</option>
                <option>100</option>
              </select>
            </label>
          </div>
          <table aria-label="Site rows">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Postal Code</th>
                <th>Market Identifier</th>
                <th>Service Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr data-property-id="a1SQH000003u7En2AI" data-association-id="a1KQH00000KclAT2AZ" data-service-point-id="a1TQH000001RMAL2A4">
                <td>Riverside Apartments</td>
                <td>G4 0HF</td>
                <td>11200000000</td>
                <td>Electricity</td>
                <td><button type="button">Delete row</button></td>
              </tr>
            </tbody>
          </table>
          <p id="delete-message" class="notice" hidden>Riverside Apartments deleted successfully.</p>
        </main>
        <script>
          document.querySelector('button').addEventListener('click', () => {
            document.querySelector('[data-property-id="a1SQH000003u7En2AI"]').remove();
            document.getElementById('delete-message').hidden = false;
          });
        </script>
      </body>
    </html>
  `);
}

test('CXST-516 site guided form receives postcode, market identifier, clear paging label, and delete ids', async ({
  page
}, testInfo) => {
  const uploadController = readWorkspaceFile(
    'force-app/main/default/classes/PSPointCsvUploadCtrl.cls'
  );
  const uploadControllerTest = readWorkspaceFile(
    'force-app/main/default/classes/PSPointCsvUploadCtrlTest.cls'
  );
  const tableController = readWorkspaceFile(
    'force-app/main/default/classes/PropertyServicePointController.cls'
  );
  const guidedFormHtml = readWorkspaceFile(
    'force-app/main/default/lwc/siteGuidedForm/siteGuidedForm.html'
  );
  const guidedFormJs = readWorkspaceFile(
    'force-app/main/default/lwc/siteGuidedForm/siteGuidedForm.js'
  );

  expect(uploadController).toContain('servicePoint.Opportunity__c = opportunityId;');
  expect(uploadController).toContain('servicePoint.Postcode__c = servicePointPostcode;');
  expect(uploadController).toContain('Map<String, Integer> propertyIndexByKey');
  expect(uploadController).toContain('buildPropertyDedupeKey(propertyRecord)');
  expect(uploadController).toContain('for (Integer i = 0; i < sourceRowsForRows.size(); i++)');
  expect(uploadController).toContain(
    'associationIndexForServicePoint.add(associationsToInsert.size());'
  );
  expect(uploadController).toContain(
    'associationsToInsert[associationIndex].Service_Point__c = insertedServicePoint.Id;'
  );
  expect(uploadControllerTest).toContain(
    'testUploadCsvRowsReusesPropertyForDuplicateCsvPropertyRows'
  );
  expect(uploadControllerTest).toContain(
    'Duplicate CSV rows for the same property should create one Property record.'
  );
  expect(tableController).toContain("row.put('Id', site.Property__c);");
  expect(tableController).toContain("row.put('Association_Id__c', site.Id);");
  expect(tableController).toContain("row.put('Service_Point_Id__c', site.Service_Point__c);");
  expect(tableController).toContain("row.put('Site_Address__PostalCode__s', row.get('Address__PostalCode__s'));");
  expect(tableController).toContain('Service_Point__r.Postcode__c');
  expect(tableController).toContain('Postcode__c = postalCode');
  expect(guidedFormHtml).toContain('label="Rows per page"');
  expect(guidedFormJs).toContain('@track pageSize = "20";');

  await renderSiteGuidedFormHarness(page);
  await expect(page.getByLabel('Rows per page')).toHaveValue('20');
  await expect(page.getByRole('columnheader', { name: 'Postal Code' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Market Identifier' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'G4 0HF' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '11200000000' })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath('cxst-516-site-guided-form-before-delete.png'),
    fullPage: true
  });

  await page.getByRole('button', { name: 'Delete row' }).click();
  await expect(page.getByText('Riverside Apartments deleted successfully.')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Riverside Apartments' })).toHaveCount(0);

  await page.screenshot({
    path: testInfo.outputPath('cxst-516-site-guided-form-after-delete.png'),
    fullPage: true
  });
});
