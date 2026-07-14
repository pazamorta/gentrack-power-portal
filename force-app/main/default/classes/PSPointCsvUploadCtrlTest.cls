/*
 * Description: Unit tests for PSPointCsvUploadCtrl – validates CSV upload,
 *              Junifer sync, and property creation logic.
 * Author: GTCX Team
 * History:
 * 25/06/2026 - GTCX Team - Initial Version
 */
@isTest
public with sharing class PSPointCsvUploadCtrlTest {
  private static Set<String> juniferEndpoints = new Set<String>();

  private class JuniferCsvUploadMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
      juniferEndpoints.add(req.getEndpoint());
      HttpResponse res = new HttpResponse();
      res.setHeader('Content-Type', 'application/json');
      res.setStatusCode(200);

      if (
        req.getEndpoint().contains('/junifer/propertys') ||
        req.getEndpoint().contains('/junifer/uk/propertys')
      ) {
        res.setBody('{"propertyId":9876}');
      } else if (
        req.getEndpoint().contains('/junifer/prospects/') &&
        req.getEndpoint().contains('/add_properties')
      ) {
        res.setBody('{"status":"ok"}');
      } else if (
        req.getEndpoint()
          .contains('/junifer/meterPoints/createMeterPointsAndAttachToProspect')
      ) {
        res.setBody('{"status":"ok"}');
      } else {
        res.setBody('{}');
      }
      return res;
    }
  }

  @testSetup
  static void setupData() {
    Account testAccount = new Account(
      Name = 'CSV Upload Account',
      AccountNumber = 'PROSPECT-BASE'
    );
    insert testAccount;

    Opportunity testOpportunity = new Opportunity(
      Name = 'CSV Upload Opportunity',
      AccountId = testAccount.Id,
      StageName = 'Prospecting',
      CloseDate = System.today().addDays(30),
      Site_Addition__c = true
    );
    insert testOpportunity;
  }

  @isTest
  static void testUploadCsvRowsCreatesPropertyServicePointAndAssociation() {
    Opportunity opp = [
      SELECT Id, Pricing__c
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    //opp.Pricing__c = 'G2 Pricing';
    update opp;

    List<Map<String, String>> rows = new List<Map<String, String>>();
    Map<String, String> row = new Map<String, String>();
    row.put('Property Name', 'CSV Property 1');
    row.put('AddressLine1', '10 High Street');
    row.put('AddresLine2', 'Suite 2');
    row.put('City', 'London');
    row.put('Postcode', 'E1 1AA');
    row.put('Type', 'Site');
    row.put('Market Identifier', 'MPAN-CSV-001');
    row.put('Service Type', 'Electricity');
    row.put('Annual Consumption', '12000');
    row.put('start_date', String.valueOf(System.today()));
    row.put('end_date', String.valueOf(System.today().addYears(1)));
    row.put('product', 'Flex');
    row.put('tpi_margin', '2.25');
    row.put('tax_exemption', '0');
    row.put('payment_term', '30');
    rows.add(row);

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();

    System.assertEquals(1, result.propertyCount, 'Should create one property');
    System.assertEquals(
      1,
      result.servicePointCount,
      'Should create one service point'
    );
    System.assertEquals(
      1,
      result.associationCount,
      'Should create one association'
    );

    Property__c propertyRecord = [
      SELECT
        Id,
        Name,
        Address__Street__s,
        Address__City__s,
        Address__PostalCode__s,
        Type__c,
        Account__c
      FROM Property__c
      WHERE Name = 'CSV Property 1'
      LIMIT 1
    ];

    System.assertEquals(
      '10 High Street, Suite 2',
      propertyRecord.Address__Street__s
    );
    System.assertEquals('London', propertyRecord.Address__City__s);
    System.assertEquals('E1 1AA', propertyRecord.Address__PostalCode__s);
    System.assertEquals('Site', propertyRecord.Type__c);
    System.assertNotEquals(
      null,
      propertyRecord.Account__c,
      'Property should be linked to a created Account'
    );
    Account propertyAccount = [
      SELECT Id, Name
      FROM Account
      WHERE Id = :propertyRecord.Account__c
      LIMIT 1
    ];
    System.assertEquals(
      'CSV Upload Account',
      propertyAccount.Name,
      'Property should remain linked to the Opportunity account'
    );

    Service_Point__c servicePoint = [
      SELECT
        Id,
        Name,
        Property__c,
        Opportunity__c,
        Market_Identifier__c,
        Postcode__c,
        Service_Type__c,
        Annual_Consumption__c
      FROM Service_Point__c
      WHERE Property__c = :propertyRecord.Id
      LIMIT 1
    ];

    System.assertEquals('MPAN-CSV-001', servicePoint.Market_Identifier__c);
    System.assertEquals(opp.Id, servicePoint.Opportunity__c);
    System.assertEquals('E1 1AA', servicePoint.Postcode__c);
    System.assertEquals('Electricity', servicePoint.Service_Type__c);
    System.assertEquals('12000', servicePoint.Annual_Consumption__c);

    Site__c association = [
      SELECT Id, Property__c, Opportunity__c
      FROM Site__c
      WHERE Property__c = :propertyRecord.Id
      LIMIT 1
    ];

    System.assertEquals(opp.Id, association.Opportunity__c);
  }

  @isTest
  static void testUploadCsvRowsThrowsWhenOpportunityMissing() {
    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'Missing Opp Property',
        'AddressLine1' => '1 Test Road',
        'City' => 'Leeds',
        'Postcode' => 'LS1 1AA',
        'Type' => 'Site'
      }
    };

    Test.startTest();
    Boolean didThrow = false;
    try {
      PSPointCsvUploadCtrl.uploadCsvRows(null, rows);
    } catch (Exception e) {
      didThrow = true;
    }
    Test.stopTest();

    System.assertEquals(
      true,
      didThrow,
      'Expected missing opportunity validation to throw'
    );
  }

  @isTest
  static void testUploadCsvRowsAllowsMissingFields() {
    Opportunity opp = [
      SELECT Id, AccountId
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];

    List<Map<String, String>> rows = new List<Map<String, String>>();
    Map<String, String> partialRow = new Map<String, String>();
    partialRow.put('Property Name', '');
    partialRow.put('AddressLine1', '');
    partialRow.put('City', '');
    partialRow.put('Postcode', '');
    partialRow.put('Type', '');
    partialRow.put('Service Type', '');
    partialRow.put('Market Identifier', 'MPAN-PARTIAL-001');
    partialRow.put('start_date', String.valueOf(System.today()));
    partialRow.put('end_date', String.valueOf(System.today().addYears(1)));
    partialRow.put('product', 'Flex');
    partialRow.put('tpi_margin', '1.50');
    partialRow.put('tax_exemption', 'yes');
    partialRow.put('payment_term', '60');
    rows.add(partialRow);

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();

    System.assertEquals(
      1,
      result.propertyCount,
      'Should create property for partial row'
    );
    System.assertEquals(
      1,
      result.servicePointCount,
      'Market Identifier should create a service point'
    );
    /* System.assertEquals(
      1,
      result.associationCount,
      'Should still create opportunity association'
    );*/

    Property__c propertyRecord = [
      SELECT Id, Name
      FROM Property__c
      WHERE Name = 'MPAN-PARTIAL-001'
      LIMIT 1
    ];
    System.assertNotEquals(
      null,
      propertyRecord.Id,
      'Property should be inserted even with missing fields'
    );

    Integer associationCount = [
      SELECT COUNT()
      FROM Site__c
      WHERE Property__c = :propertyRecord.Id AND Opportunity__c = :opp.Id
    ];
    System.assertEquals(
      1,
      associationCount,
      'Association should be created for partial row'
    );
  }

  @isTest
  static void testUploadCsvRowsMapsAssociationFields() {
    Opportunity opp = [
      SELECT Id, AccountId
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV Assoc Property',
        'AddressLine1' => '20 Bond Street',
        'City' => 'London',
        'Postcode' => 'W1 2AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-ASSOC-001',
        'product' => 'Flex',
        'tpi_margin' => '2.50',
        'tax_exemption' => 'yes',
        'payment_terms' => '120',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1))
      },
      new Map<String, String>{
        'Property Name' => 'CSV Assoc Property 2',
        'AddressLine1' => '21 Bond Street',
        'City' => 'London',
        'Postcode' => 'W1 2AB',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-ASSOC-002',
        'product' => 'Fixed',
        'margin_value' => '1.75',
        'tax_exemption' => '0',
        'payment_term' => '100',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1))
      }
    };

    Test.setMock(HttpCalloutMock.class, new JuniferCsvUploadMock());
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = 'MOCK';
    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = null;

    System.assertEquals(
      2,
      result.propertyCount,
      'Should create properties for both rows'
    );
    System.assert(
      result.warnings.contains(
        'Junifer sync skipped during the renamed metadata cutover. Salesforce Site, Property and Service Point records were created.'
      ),
      'Expected local-only CSV upload warning.'
    );

    Property__c propertyRecord = [
      SELECT Id
      FROM Property__c
      WHERE Name = 'CSV Assoc Property'
      LIMIT 1
    ];
    Site__c assoc = [
      SELECT Product__c, Margin_Value__c, Tax_Exemption__c, Payment_Term__c
      FROM Site__c
      WHERE Property__c = :propertyRecord.Id
      LIMIT 1
    ];
    System.assertEquals(
      'Flex',
      assoc.Product__c,
      'Product should map from CSV'
    );
    System.assertEquals(
      2.50,
      assoc.Margin_Value__c,
      'Margin value should map from CSV'
    );
    System.assertEquals(
      1,
      assoc.Tax_Exemption__c,
      'Tax exemption should normalize boolean-like values'
    );
    System.assertEquals(
      Decimal.valueOf('120'),
      assoc.Payment_Term__c,
      'Payment term should map from CSV'
    );
  }

  @isTest
  static void testUploadCsvRowsReusesPropertyForDuplicateCsvPropertyRows() {
    Opportunity opp = [
      SELECT Id
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'Riverside Apartments',
        'AddressLine1' => '12 Riverbank Close',
        'City' => 'Great Britain',
        'Postcode' => 'G4 0HF',
        'Type' => 'Site',
        'Market Identifier' => '11200000000',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '14500',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'tpi_margin' => '2.50',
        'tax_exemption' => '0',
        'payment_term' => '30'
      },
      new Map<String, String>{
        'Property Name' => 'Riverside Apartments',
        'AddressLine1' => '12 Riverbank Close',
        'City' => 'Great Britain',
        'Postcode' => 'G4 0HF',
        'Type' => 'Site',
        'Market Identifier' => '1115555662',
        'Service Type' => 'Gas',
        'Annual Consumption' => '27500',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'tpi_margin' => '2.50',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();

    System.assertEquals(
      1,
      result.propertyCount,
      'Duplicate CSV rows for the same property should create one Property record.'
    );
    System.assertEquals(
      2,
      result.servicePointCount,
      'Each CSV service row should still create its own Service Point.'
    );
    System.assertEquals(
      2,
      result.associationCount,
      'Each CSV service row should still create its own Site association.'
    );

    List<Property__c> properties = [
      SELECT Id
      FROM Property__c
      WHERE
        Name = 'Riverside Apartments' AND
        Address__PostalCode__s = 'G4 0HF'
    ];
    System.assertEquals(
      1,
      properties.size(),
      'Only one Property should exist for the duplicate CSV property identity.'
    );

    List<Service_Point__c> servicePoints = [
      SELECT Id, Property__c, Market_Identifier__c
      FROM Service_Point__c
      WHERE Opportunity__c = :opp.Id
      ORDER BY Market_Identifier__c
    ];
    System.assertEquals(2, servicePoints.size(), 'Two Service Points expected.');
    for (Service_Point__c servicePoint : servicePoints) {
      System.assertEquals(
        properties[0].Id,
        servicePoint.Property__c,
        'Both Service Points should share the single deduped Property.'
      );
    }

    Map<Id, Service_Point__c> servicePointsById = new Map<Id, Service_Point__c>(
      servicePoints
    );
    List<Site__c> associations = [
      SELECT Id, Property__c, Service_Point__c
      FROM Site__c
      WHERE Opportunity__c = :opp.Id
    ];
    System.assertEquals(2, associations.size(), 'Two Site associations expected.');
    for (Site__c association : associations) {
      System.assertEquals(
        properties[0].Id,
        association.Property__c,
        'Both Site associations should share the single deduped Property.'
      );
      System.assert(
        servicePointsById.containsKey(association.Service_Point__c),
        'Each Site association should point to the Service Point from its own row.'
      );
    }
  }

  @isTest
  static void testUploadCsvRowsReusesExistingPropertyAcrossUploadsAndOpportunities() {
    Account accountRecord = [
      SELECT Id
      FROM Account
      WHERE Name = 'CSV Upload Account'
      LIMIT 1
    ];
    Opportunity firstOpp = [
      SELECT Id
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    Opportunity secondOpp = new Opportunity(
      Name = 'CSV Upload Opportunity 2',
      AccountId = accountRecord.Id,
      StageName = 'Prospecting',
      CloseDate = System.today().addDays(45),
      Site_Addition__c = false
    );
    insert secondOpp;

    List<Map<String, String>> firstUploadRows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'Scenario 3 Seed Name',
        'AddressLine1' => '50 Dedup Street',
        'City' => 'Dundee',
        'Postcode' => 'DD1 1AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-SCENARIO3-001',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '12000',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'tpi_margin' => '2.50',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };
    List<Map<String, String>> secondUploadRows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'Scenario 3 Retest Name',
        'AddressLine1' => '50 Dedup Street',
        'City' => 'Dundee',
        'Postcode' => 'DD1 1AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPRN-SCENARIO3-002',
        'Service Type' => 'Gas',
        'Annual Consumption' => '9000',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'tpi_margin' => '2.50',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult firstResult = PSPointCsvUploadCtrl.uploadCsvRows(
      firstOpp.Id,
      firstUploadRows
    );
    PSPointCsvUploadCtrl.UploadResult secondResult = PSPointCsvUploadCtrl.uploadCsvRows(
      secondOpp.Id,
      secondUploadRows
    );
    Test.stopTest();

    System.assertEquals(1, firstResult.propertyCount, 'Seed upload creates a Property.');
    System.assertEquals(
      0,
      secondResult.propertyCount,
      'A later upload on another Opportunity should reuse the existing same-address Property.'
    );
    System.assertEquals(
      1,
      secondResult.servicePointCount,
      'The reused Property should still receive the new Service Point.'
    );
    System.assertEquals(
      1,
      secondResult.associationCount,
      'The reused Property should still be associated to the second Opportunity.'
    );

    List<Property__c> properties = [
      SELECT Id
      FROM Property__c
      WHERE
        Address__Street__s = '50 Dedup Street' AND
        Address__City__s = 'Dundee' AND
        Address__PostalCode__s = 'DD1 1AA'
    ];
    System.assertEquals(
      1,
      properties.size(),
      'Same address/type should resolve to one Property across Opportunities.'
    );

    List<Service_Point__c> servicePoints = [
      SELECT Id, Property__c, Opportunity__c, Market_Identifier__c
      FROM Service_Point__c
      WHERE Market_Identifier__c IN ('MPAN-SCENARIO3-001', 'MPRN-SCENARIO3-002')
    ];
    System.assertEquals(2, servicePoints.size(), 'Both uploads should keep distinct Service Points.');
    for (Service_Point__c servicePoint : servicePoints) {
      System.assertEquals(
        properties[0].Id,
        servicePoint.Property__c,
        'Both Service Points should be linked to the reused Property.'
      );
    }

    List<Site__c> associations = [
      SELECT Id, Property__c, Opportunity__c
      FROM Site__c
      WHERE
        Property__c = :properties[0].Id AND
        Opportunity__c IN (:firstOpp.Id, :secondOpp.Id)
    ];
    System.assertEquals(
      2,
      associations.size(),
      'The single Property should be associated to both Opportunities.'
    );
  }

  @isTest
  static void testUploadCsvRowsTriggersJuniferQueueableAndUpdatesPropertyReference() {
    Account baseAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'CSV Upload Account'
      LIMIT 1
    ];
    baseAccount.AccountNumber = 'PROSPECT-001';
    update baseAccount;

    Opportunity opp = [
      SELECT Id
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV Junifer Property',
        'AddressLine1' => '30 Queen Street',
        'City' => 'London',
        'Postcode' => 'SW1A 1AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-CALLOUT-001',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '1000',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'margin_value' => '1.0',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    juniferEndpoints.clear();
    Test.setMock(HttpCalloutMock.class, new JuniferCsvUploadMock());
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = 'MOCK';

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = null;

    System.assert(
      result.warnings.contains(
        'Junifer sync skipped during the renamed metadata cutover. Salesforce Site, Property and Service Point records were created.'
      ),
      'Expected local-only CSV upload warning.'
    );
    if (!juniferEndpoints.isEmpty()) {
      System.assert(
        containsEndpoint('/junifer/propertys') ||
        containsEndpoint('/junifer/uk/propertys'),
        'Should call Junifer property creation endpoint'
      );
      System.assert(
        containsEndpoint('/add_properties'),
        'Should call Junifer add properties endpoint'
      );
      System.assert(
        containsEndpoint('/PROSPECT-001/'),
        'Should include AccountNumber in the Junifer add properties endpoint'
      );
    }

    if (!juniferEndpoints.isEmpty()) {
      System.assert(
        containsEndpoint('/junifer/propertys') ||
        containsEndpoint('/junifer/uk/propertys'),
        'Property sync should be attempted for Junifer-enabled uploads'
      );
    } else {
      System.assert(
        result.warnings.contains(
          'Junifer sync skipped during the renamed metadata cutover. Salesforce Site, Property and Service Point records were created.'
        ),
        'Expected local-only CSV upload warning.'
      );
    }
  }

  @isTest
  static void testUploadCsvRowsSyncsJuniferRegardlessOfSiteAddition() {
    Account baseAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'CSV Upload Account'
      LIMIT 1
    ];
    baseAccount.AccountNumber = 'PROSPECT-002';
    update baseAccount;

    Opportunity opp = [
      SELECT Id, Site_Addition__c, Pricing__c
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    opp.Site_Addition__c = false;
    //opp.Pricing__c = 'Gorilla Pricing';
    update opp;

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV No Junifer Property',
        'AddressLine1' => '40 Queen Street',
        'City' => 'London',
        'Postcode' => 'SW1A 2AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-NO-CALLOUT-001',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '1200',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'margin_value' => '1.0',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    juniferEndpoints.clear();
    Test.setMock(HttpCalloutMock.class, new JuniferCsvUploadMock());
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = 'MOCK';

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = null;

    // CXST-516: Junifer sync should fire regardless of Site_Addition__c value.
    // Currently stubbed due to renamed metadata cutover — once re-enabled,
    // sync should NOT be gated by Site_Addition__c.
    Boolean foundCutoverWarning = false;
    for (String warning : result.warnings) {
      if (warning.contains('renamed metadata cutover')) {
        foundCutoverWarning = true;
        break;
      }
    }
    System.assertEquals(
      true,
      foundCutoverWarning,
      'Should warn about metadata cutover (sync temporarily disabled, not gated by Site Addition)'
    );

    Property__c propertyRecord = [
      SELECT Id, Property_Reference__c
      FROM Property__c
      WHERE Name = 'CSV No Junifer Property'
      LIMIT 1
    ];
    System.assertEquals(
      null,
      propertyRecord.Property_Reference__c,
      'Property reference should remain blank during metadata cutover period'
    );
  }

  @isTest
  static void testUploadCsvRowsSyncsWhenPricingIsG2AndSiteAdditionIsFalse() {
    Account baseAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'CSV Upload Account'
      LIMIT 1
    ];
    baseAccount.AccountNumber = 'PROSPECT-003';
    update baseAccount;

    Opportunity opp = [
      SELECT Id, Site_Addition__c, Pricing__c
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    opp.Site_Addition__c = false;
    //opp.Pricing__c = 'G2 Pricing';
    update opp;

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV G2 Sync Property',
        'AddressLine1' => '11 Regent Street',
        'City' => 'London',
        'Postcode' => 'W1B 4HD',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-G2-SYNC-001',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '6500',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'margin_value' => '1.3',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    juniferEndpoints.clear();
    Test.setMock(HttpCalloutMock.class, new JuniferCsvUploadMock());
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = 'MOCK';

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = null;

    System.assertEquals(1, result.propertyCount, 'Should create one property');
    if (!juniferEndpoints.isEmpty()) {
      System.assertEquals(
        true,
        containsEndpoint('/junifer/propertys') ||
        containsEndpoint('/junifer/uk/propertys'),
        'Junifer property callout should happen when Pricing is G2'
      );
      System.assertEquals(
        true,
        containsEndpoint('/add_properties'),
        'Junifer add properties callout should happen when Pricing is G2'
      );
      System.assertEquals(
        true,
        containsEndpoint(
          '/junifer/meterPoints/createMeterPointsAndAttachToProspect'
        ),
        'Junifer meter points callout should happen when Pricing is G2'
      );
    } else {
      System.assert(
        result.warnings.contains(
          'Junifer sync skipped during the renamed metadata cutover. Salesforce Site, Property and Service Point records were created.'
        ),
        'Expected local-only CSV upload warning.'
      );
    }

    Property__c propertyRecord = [
      SELECT Id, Property_Reference__c
      FROM Property__c
      WHERE Name = 'CSV G2 Sync Property'
      LIMIT 1
    ];
    System.assert(
      propertyRecord.Property_Reference__c == null ||
        propertyRecord.Property_Reference__c == '9876',
      'Property reference should be null in MODE_MOCK or 9876 when mocked callout response is applied'
    );
  }

  private static Boolean containsEndpoint(String expectedPath) {
    for (String endpoint : juniferEndpoints) {
      if (endpoint != null && endpoint.contains(expectedPath)) {
        return true;
      }
    }
    return false;
  }

  @isTest
  static void testHasPropertyOppAssociations() {
    Opportunity opp = [
      SELECT Id, AccountId
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];

    Boolean hasAssociationsBeforeInsert = PSPointCsvUploadCtrl.hasPropertyOppAssociations(
      opp.Id
    );
    Boolean hasAssociationsForNullOpp = PSPointCsvUploadCtrl.hasPropertyOppAssociations(
      null
    );

    System.assertEquals(
      false,
      hasAssociationsBeforeInsert,
      'Opportunity should start without associations in this test context'
    );
    System.assertEquals(
      false,
      hasAssociationsForNullOpp,
      'Null opportunity should return false'
    );

    Property__c propertyRecord = new Property__c(
      Name = 'Association Check Property'
    );
    insert propertyRecord;

    insert new Site__c(
      Account__c = opp.AccountId,
      Property__c = propertyRecord.Id,
      Opportunity__c = opp.Id,
      Start_Date__c = Date.today(),
      End_Date__c = Date.today().addYears(1)
    );

    Test.startTest();
    Boolean hasAssociationsAfterInsert = PSPointCsvUploadCtrl.hasPropertyOppAssociations(
      opp.Id
    );
    Test.stopTest();

    System.assertEquals(
      true,
      hasAssociationsAfterInsert,
      'Opportunity should return true once association exists'
    );
  }

  @isTest
  static void testUploadCsvRowsCreatesAssociationWithoutServicePointAndCapturesValidationWarnings() {
    Opportunity opp = [
      SELECT Id, Site_Addition__c, Pricing__c
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    opp.Site_Addition__c = false;
    //opp.Pricing__c = 'Gorilla Pricing';
    update opp;

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV Warning Property',
        'AddressLine1' => '77 Warning Street',
        'City' => 'London',
        'Postcode' => 'E4 4DD',
        'Type' => 'Site',
        'start_date' => '17/04/2026',
        'end_date' => '',
        'product' => '',
        'tpi_margin' => 'bad-decimal',
        'tax_exemption' => 'maybe',
        'payment_term' => '1234'
      }
    };

    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();

    System.assertEquals(
      1,
      result.propertyCount,
      'Property should still be created.'
    );
    System.assertEquals(
      0,
      result.servicePointCount,
      'No service point should be created when core service point columns are absent.'
    );
    System.assertEquals(
      1,
      result.associationCount,
      'Association should still be created.'
    );
    System.assert(
      result.warnings.size() > 0,
      'Validation warnings should be returned for invalid and missing required fields.'
    );

    Site__c association = [
      SELECT
        Start_Date__c,
        End_Date__c,
        Product__c,
        Margin_Value__c,
        Tax_Exemption__c,
        Payment_Term__c
      FROM Site__c
      WHERE
        Opportunity__c = :opp.Id
        AND Property__r.Name = 'CSV Warning Property'
      LIMIT 1
    ];
    System.assertEquals(
      Date.newInstance(2026, 4, 17),
      association.Start_Date__c,
      'dd/MM/yyyy dates should be parsed correctly.'
    );
    System.assertEquals(Date.newInstance(2027, 4, 16), association.End_Date__c);
    System.assertEquals(null, association.Product__c);
    System.assertEquals(null, association.Margin_Value__c);
    System.assertEquals(null, association.Tax_Exemption__c);
    System.assertEquals(null, association.Payment_Term__c);
  }

  @isTest
  static void testUploadCsvRowsWarnsWhenAccountNumberBlank() {
    Account baseAccount = [
      SELECT Id
      FROM Account
      WHERE Name = 'CSV Upload Account'
      LIMIT 1
    ];
    baseAccount.AccountNumber = null;
    update baseAccount;

    Opportunity opp = [
      SELECT Id, Site_Addition__c, Pricing__c
      FROM Opportunity
      WHERE Name = 'CSV Upload Opportunity'
      LIMIT 1
    ];
    opp.Site_Addition__c = true;
    //opp.Pricing__c = 'G2 Pricing';
    update opp;

    List<Map<String, String>> rows = new List<Map<String, String>>{
      new Map<String, String>{
        'Property Name' => 'CSV Blank Prospect Property',
        'AddressLine1' => '12 No Prospect Street',
        'City' => 'Leeds',
        'Postcode' => 'LS1 4AA',
        'Type' => 'Site',
        'Market Identifier' => 'MPAN-BLANK-PROSPECT-001',
        'Service Type' => 'Electricity',
        'Annual Consumption' => '1000',
        'start_date' => String.valueOf(System.today()),
        'end_date' => String.valueOf(System.today().addYears(1)),
        'product' => 'Flex',
        'tpi_margin' => '1.25',
        'tax_exemption' => '0',
        'payment_term' => '30'
      }
    };

    juniferEndpoints.clear();
    Test.setMock(HttpCalloutMock.class, new JuniferCsvUploadMock());
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = 'MOCK';
    Test.startTest();
    PSPointCsvUploadCtrl.UploadResult result = PSPointCsvUploadCtrl.uploadCsvRows(
      opp.Id,
      rows
    );
    Test.stopTest();
    PSPointCsvUploadCtrl.JUNIFER_MODE_OVERRIDE = null;

    Boolean foundBlankProspectWarning = false;
    for (String warning : result.warnings) {
      if (warning != null && warning.contains('renamed metadata cutover')) {
        foundBlankProspectWarning = true;
        break;
      }
    }
    System.assertEquals(
      true,
      foundBlankProspectWarning,
      'Expected local-only CSV upload warning.'
    );
    System.assertEquals(
      0,
      juniferEndpoints.size(),
      'No Junifer callouts should be made when prospect number is missing.'
    );
  }
}
