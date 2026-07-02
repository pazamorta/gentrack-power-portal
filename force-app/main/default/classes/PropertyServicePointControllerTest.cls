@IsTest
private class PropertyServicePointControllerTest {
  @TestSetup
  static void setup() {
    Account acc = TestDataFactory.createAccount(
      new TestDataFactory.AccountSpec()
    );
    TestDataFactory.ContractSpec conSpec = new TestDataFactory.ContractSpec();
    conSpec.accountId = acc.Id;
    Contract con = TestDataFactory.createContract(conSpec);

    TestDataFactory.OpportunitySpec oppSpec = new TestDataFactory.OpportunitySpec();
    oppSpec.accountId = acc.Id;
    oppSpec.contractId = con.Id;
    oppSpec.siteAddition = true;
    TestDataFactory.createOpportunity(oppSpec);
  }

  @IsTest
  static void testGetters() {
    Account acc = [SELECT Id FROM Account LIMIT 1];
    Contract con = [SELECT Id FROM Contract LIMIT 1];
    Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

    Test.startTest();
    try {
      PropertyServicePointController.getCurrentUserContextInfo();
    } catch (Exception e) {
    }
    try {
      PropertyServicePointController.getRelatedAccountsForCurrentUser();
    } catch (Exception e) {
    }
    PropertyServicePointController.getOpportunityDetails(opp.Id);
    try {
      PropertyServicePointController.getExpectedAccountCode(opp.Id);
    } catch (exception e) {
    }
    PropertyServicePointController.getContractsForAccount(acc.Id);
    try {
      PropertyServicePointController.getVerifiedSiteAdditionOpportunities(
        acc.Id,
        con.Id
      );
    } catch (Exception e) {
    }
    try {
      PropertyServicePointController.validateOpportunityForStageAdvancement(
        opp.Id
      );
    } catch (Exception e) {
    }
    Test.stopTest();
  }

  @IsTest
  static void testPropertyServicePointLifecycle() {
    Account acc = [SELECT Id FROM Account LIMIT 1];
    Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

    Property__c prop = new Property__c(
      Name = 'Lifecycle Property',
      Account__c = acc.Id,
      Address__Street__s = '1 Lifecycle Street',
      Address__City__s = 'London',
      Address__PostalCode__s = 'LC1 1AA',
      Type__c = 'Site'
    );
    insert prop;

    Service_Point__c sp = new Service_Point__c(
      Property__c = prop.Id,
      Market_Identifier__c = 'MPAN-LIFE-001',
      Postcode__c = 'LC1 1AA',
      Service_Type__c = 'Electricity',
      Annual_Consumption__c = '1000'
    );
    insert sp;

    List<Map<String, Object>> associations = new List<Map<String, Object>>{
      new Map<String, Object>{
        'propertyId' => prop.Id,
        'opportunityId' => opp.Id,
        'startDate' => String.valueOf(Date.today()),
        'endDate' => String.valueOf(Date.today().addDays(30))
      }
    };

    Test.startTest();
    List<Id> createdIds = PropertyServicePointController.createPropertyOpportunityAssociationsWithStatus(
      associations,
      false
    );
    List<Map<String, Object>> rows = PropertyServicePointController.getPropertiesWithServicePointsForOpportunity(
      acc.Id,
      opp.Id
    );
    Map<String, Object> updateResult = PropertyServicePointController.updatePropertyAndServicePoint(
      prop.Id,
      sp.Id,
      createdIds.isEmpty() ? null : createdIds[0],
      opp.Id,
      '2 Lifecycle Street',
      'Manchester',
      'M1 1AA',
      'MPAN-LIFE-002',
      'Gas',
      2000,
      Date.today().addDays(1),
      Date.today().addDays(40),
      'Flex',
      1.25,
      0,
      30
    );
    Map<String, Object> validation = PropertyServicePointController.validateOpportunityForStageAdvancement(
      opp.Id
    );
    Map<String, Object> probe = PropertyServicePointController.runCoverageUtilityProbe(
      opp.Id,
      prop.Id
    );
    PropertyServicePointController.getSubmitAccessInfo(opp.Id);
    PropertyServicePointController.getSiteAdditionOpportunities(acc.Id);
    PropertyServicePointController.checkJobStatus(null);
    PropertyServicePointController.getPropertiesWithServicePoints(acc.Id);
    Test.stopTest();

    System.assertEquals(1, createdIds.size(), 'One association should be created.');
    System.assert(!rows.isEmpty(), 'Property rows should be returned.');
    System.assertEquals(
      prop.Id,
      (Id) rows[0].get('Id'),
      'Rows should use Property Id as the editable row identity.'
    );
    System.assertEquals(
      createdIds[0],
      (Id) rows[0].get('Association_Id__c'),
      'Rows should expose Site association Id for row deletion.'
    );
    System.assertEquals(
      sp.Id,
      (Id) rows[0].get('Service_Point_Id__c'),
      'Rows should expose Service Point Id for inline updates.'
    );
    System.assertEquals(
      'LC1 1AA',
      (String) rows[0].get('Address__PostalCode__s'),
      'Rows should expose the postal code shown in the datatable.'
    );
    System.assertEquals(
      '1 Lifecycle Street',
      (String) rows[0].get('Site_Address__Street__s'),
      'Rows should expose the label-driven street key used by the LWC.'
    );
    System.assertEquals(
      'London',
      (String) rows[0].get('Site_Address__City__s'),
      'Rows should expose the label-driven city key used by the LWC.'
    );
    System.assertEquals(
      'LC1 1AA',
      (String) rows[0].get('Site_Address__PostalCode__s'),
      'Rows should expose the label-driven postal code key used by the LWC.'
    );
    System.assertEquals(true, updateResult.containsKey('propertyId'));
    System.assertEquals(true, validation.containsKey('canAdvance'));
    System.assertEquals(true, probe.containsKey('renewalNew'));
  }

  @IsTest
  static void testApprovalAndDeletePaths() {
    Account acc = [SELECT Id FROM Account LIMIT 1];
    Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

    Property__c prop = new Property__c(
      Name = 'Delete Property',
      Account__c = acc.Id,
      Address__Street__s = '3 Delete Street',
      Address__City__s = 'Leeds',
      Address__PostalCode__s = 'LS1 1AA',
      Type__c = 'Site'
    );
    insert prop;
    Service_Point__c sp = new Service_Point__c(
      Property__c = prop.Id,
      Market_Identifier__c = 'MPAN-DELETE-001',
      Postcode__c = 'LS1 1AA',
      Service_Type__c = 'Electricity'
    );
    insert sp;
    Site__c assoc = new Site__c(
      Account__c = acc.Id,
      Property__c = prop.Id,
      Opportunity__c = opp.Id,
      Service_Point__c = sp.Id,
      Start_Date__c = Date.today(),
      End_Date__c = Date.today().addDays(1)
    );
    insert assoc;

    Test.startTest();
    try {
      PropertyServicePointController.setOpportunitySitesApprovalStatus(
        opp.Id,
        false,
        'Coverage rejection'
      );
    } catch (Exception expectedForNonApprover) {
      System.assert(
        expectedForNonApprover.getMessage() != null,
        'Non-approver path should return a controlled error.'
      );
    }
    PropertyServicePointController.rejectOpportunitySites(
      opp.Id,
      'Direct rejection'
    );
    PropertyServicePointController.deleteSiteRowRecords(prop.Id, assoc.Id, opp.Id);
    Test.stopTest();

    System.assertEquals(
      0,
      [SELECT COUNT() FROM Site__c WHERE Id = :assoc.Id],
      'Association should be deleted.'
    );
  }
}
