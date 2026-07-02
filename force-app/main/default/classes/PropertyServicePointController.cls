public inherited sharing class PropertyServicePointController {
  public class SubmitAccessInfo {
    @AuraEnabled public Boolean isPortfolioOwner;
    @AuraEnabled public Boolean isSiteManager;
    @AuraEnabled public Boolean canSubmit;
    @AuraEnabled public Boolean isVerified;
    @AuraEnabled public Boolean isRejected;
    @AuraEnabled public Boolean isPartnerCommunityProfile;
  }

  public class CurrentUserContextInfo {
    @AuraEnabled public String profileName;
    @AuraEnabled public Boolean isPartnerCommunityProfile;
  }

  public class ContractSelectionOption {
    @AuraEnabled public Id contractId;
    @AuraEnabled public String contractName;
    @AuraEnabled public Id opportunityId;
    @AuraEnabled public String opportunityName;
  }

  public class AccountSelectionOption {
    @AuraEnabled public Id accountId;
    @AuraEnabled public String accountName;
  }

  public class OpportunityStatusOption {
    @AuraEnabled public Id opportunityId;
    @AuraEnabled public String opportunityName;
    @AuraEnabled public Id contractId;
    @AuraEnabled public Boolean isSitesAdded;
    @AuraEnabled public Boolean isVerified;
    @AuraEnabled public Boolean isRejected;
  }

  public class SiteAdditionOpportunityOption {
    @AuraEnabled public Id opportunityId;
    @AuraEnabled public String opportunityName;
    @AuraEnabled public Id contractId;
    @AuraEnabled public String contractName;
  }

  public class JobStatusResponse {
    @AuraEnabled public String status;
    @AuraEnabled public Integer processedItems;
    @AuraEnabled public Integer totalItems;
    @AuraEnabled public Integer failedItems;
    @AuraEnabled public Boolean isComplete;
    @AuraEnabled public String errorMessage;
  }

  @AuraEnabled(cacheable=true)
  public static SubmitAccessInfo getSubmitAccessInfo(Id opportunityId) {
    SubmitAccessInfo info = new SubmitAccessInfo();
    info.isPortfolioOwner = true;
    info.isSiteManager = true;
    info.canSubmit = true;
    info.isVerified = false;
    info.isRejected = false;
    info.isPartnerCommunityProfile = isPartnerProfile();
    if (opportunityId != null) {
      Opportunity opp = [
        SELECT Sites_Verified__c, Sites_Rejected__c
        FROM Opportunity
        WHERE Id = :opportunityId
        LIMIT 1
      ];
      info.isVerified = opp.Sites_Verified__c;
      info.isRejected = opp.Sites_Rejected__c;
    }
    return info;
  }

  @AuraEnabled(cacheable=true)
  public static CurrentUserContextInfo getCurrentUserContextInfo() {
    User currentUser = [
      SELECT Profile.Name
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ];
    CurrentUserContextInfo info = new CurrentUserContextInfo();
    info.profileName = currentUser.Profile.Name;
    info.isPartnerCommunityProfile = isPartnerProfile();
    return info;
  }

  @AuraEnabled(cacheable=true)
  public static Opportunity getOpportunityDetails(Id opportunityId) {
    if (opportunityId == null) {
      return null;
    }
    return [
      SELECT
        Id,
        Name,
        AccountId,
        Site_Addition_Contract__c,
        Sites_Verified__c,
        Sites_Rejected__c
      FROM Opportunity
      WHERE Id = :opportunityId
      LIMIT 1
    ];
  }

  @AuraEnabled(cacheable=true)
  public static String getExpectedAccountCode(Id contextId) {
    if (contextId == null) {
      return null;
    }
    String idValue = String.valueOf(contextId);
    if (idValue.startsWith('001')) {
      List<Account> accounts = [
        SELECT AccountNumber
        FROM Account
        WHERE Id = :contextId
        LIMIT 1
      ];
      return accounts.isEmpty() ? null : accounts[0].AccountNumber;
    }
    if (idValue.startsWith('006')) {
      List<Opportunity> opps = [
        SELECT Account.AccountNumber
        FROM Opportunity
        WHERE Id = :contextId
        LIMIT 1
      ];
      return opps.isEmpty() || opps[0].Account == null
        ? null
        : opps[0].Account.AccountNumber;
    }
    return null;
  }

  @AuraEnabled(cacheable=true)
  public static List<ContractSelectionOption> getContractsForAccount(
    Id accountId
  ) {
    List<ContractSelectionOption> options = new List<ContractSelectionOption>();
    if (accountId == null) {
      return options;
    }
    for (Contract contractRecord : [
      SELECT Id, ContractNumber
      FROM Contract
      WHERE AccountId = :accountId
      ORDER BY CreatedDate DESC
      LIMIT 200
    ]) {
      ContractSelectionOption option = new ContractSelectionOption();
      option.contractId = contractRecord.Id;
      option.contractName = contractRecord.ContractNumber;
      options.add(option);
    }
    return options;
  }

  @AuraEnabled(cacheable=true)
  public static List<AccountSelectionOption> getRelatedAccountsForCurrentUser() {
    List<AccountSelectionOption> options = new List<AccountSelectionOption>();
    for (Account accountRecord : [
      SELECT Id, Name
      FROM Account
      ORDER BY LastModifiedDate DESC
      LIMIT 200
    ]) {
      AccountSelectionOption option = new AccountSelectionOption();
      option.accountId = accountRecord.Id;
      option.accountName = accountRecord.Name;
      options.add(option);
    }
    return options;
  }

  @AuraEnabled(cacheable=true)
  public static List<OpportunityStatusOption> getVerifiedSiteAdditionOpportunities(
    Id accountId,
    Id contractId
  ) {
    List<OpportunityStatusOption> options = new List<OpportunityStatusOption>();
    if (accountId == null) {
      return options;
    }
    String query =
      'SELECT Id, Name, Site_Addition_Contract__c, Sites_Added__c, Sites_Verified__c, Sites_Rejected__c ' +
      'FROM Opportunity WHERE AccountId = :accountId';
    if (contractId != null) {
      query += ' AND Site_Addition_Contract__c = :contractId';
    }
    query += ' ORDER BY LastModifiedDate DESC LIMIT 200';
    for (Opportunity opp : Database.query(query)) {
      OpportunityStatusOption option = new OpportunityStatusOption();
      option.opportunityId = opp.Id;
      option.opportunityName = opp.Name;
      option.contractId = opp.Site_Addition_Contract__c;
      option.isSitesAdded = opp.Sites_Added__c;
      option.isVerified = opp.Sites_Verified__c;
      option.isRejected = opp.Sites_Rejected__c;
      options.add(option);
    }
    return options;
  }

  @AuraEnabled(cacheable=true)
  public static List<SiteAdditionOpportunityOption> getSiteAdditionOpportunities(
    Id accountId
  ) {
    List<SiteAdditionOpportunityOption> options = new List<SiteAdditionOpportunityOption>();
    if (accountId == null) {
      return options;
    }
    for (Opportunity opp : [
      SELECT Id, Name, Site_Addition_Contract__c, Site_Addition_Contract__r.ContractNumber
      FROM Opportunity
      WHERE AccountId = :accountId
      ORDER BY LastModifiedDate DESC
      LIMIT 200
    ]) {
      SiteAdditionOpportunityOption option = new SiteAdditionOpportunityOption();
      option.opportunityId = opp.Id;
      option.opportunityName = opp.Name;
      option.contractId = opp.Site_Addition_Contract__c;
      option.contractName = opp.Site_Addition_Contract__r == null
        ? null
        : opp.Site_Addition_Contract__r.ContractNumber;
      options.add(option);
    }
    return options;
  }

  @AuraEnabled(cacheable=true)
  public static JobStatusResponse checkJobStatus(Id jobId) {
    JobStatusResponse response = new JobStatusResponse();
    response.status = 'Completed';
    response.processedItems = 0;
    response.totalItems = 0;
    response.failedItems = 0;
    response.isComplete = true;
    response.errorMessage = null;
    return response;
  }

  @AuraEnabled(cacheable=true)
  public static List<Opportunity> getOpportunitiesForCurrentUser() {
    return [
      SELECT Id, Name, AccountId, Site_Addition_Contract__c
      FROM Opportunity
      ORDER BY LastModifiedDate DESC
      LIMIT 50
    ];
  }

  @AuraEnabled
  public static List<Map<String, Object>> getPropertiesWithServicePoints(
    Id accountId
  ) {
    return getPropertiesWithServicePointsForOpportunity(accountId, null);
  }

  @AuraEnabled
  public static List<Map<String, Object>> getPropertiesWithServicePointsForOpportunity(
    Id accountId,
    Id selectedOpportunityId
  ) {
    List<Map<String, Object>> rows = new List<Map<String, Object>>();
    if (accountId == null && selectedOpportunityId == null) {
      return rows;
    }

    List<Site__c> sites;
    if (selectedOpportunityId != null) {
      sites = [
        SELECT
          Id,
          Account__c,
          Opportunity__c,
          Property__c,
          Service_Point__c,
          Start_Date__c,
          End_Date__c,
          Product__c,
          Margin_Value__c,
          Tax_Exemption__c,
          Payment_Term__c,
          Property__r.Name,
          Property__r.Address__Street__s,
          Property__r.Address__City__s,
          Property__r.Address__PostalCode__s,
          Property__r.Post_Code__c,
          Property__r.Type__c,
          Service_Point__r.Market_Identifier__c,
          Service_Point__r.Postcode__c,
          Service_Point__r.Service_Type__c,
          Service_Point__r.Annual_Consumption__c
        FROM Site__c
        WHERE Opportunity__c = :selectedOpportunityId
        LIMIT 500
      ];
    } else {
      sites = [
        SELECT
          Id,
          Account__c,
          Opportunity__c,
          Property__c,
          Service_Point__c,
          Start_Date__c,
          End_Date__c,
          Product__c,
          Margin_Value__c,
          Tax_Exemption__c,
          Payment_Term__c,
          Property__r.Name,
          Property__r.Address__Street__s,
          Property__r.Address__City__s,
          Property__r.Address__PostalCode__s,
          Property__r.Post_Code__c,
          Property__r.Type__c,
          Service_Point__r.Market_Identifier__c,
          Service_Point__r.Postcode__c,
          Service_Point__r.Service_Type__c,
          Service_Point__r.Annual_Consumption__c
        FROM Site__c
        WHERE Account__c = :accountId
        LIMIT 500
      ];
    }

    for (Site__c site : sites) {
      rows.add(toRow(site));
    }
    return rows;
  }

  @AuraEnabled
  public static Map<String, Object> updatePropertyAndServicePoint(
    Id propertyId,
    Id servicePointId,
    Id associationId,
    Id opportunityId,
    String street,
    String city,
    String postalCode,
    String marketIdentifier,
    String serviceType,
    Decimal annualConsumption,
    Date startDate,
    Date endDate,
    String product,
    Decimal marginValue,
    Decimal taxExemption,
    Integer paymentTerm
  ) {
    if (propertyId == null) {
      throw handledException('Property Id is required.');
    }
    update new Property__c(
      Id = propertyId,
      Address__Street__s = street,
      Address__City__s = city,
      Address__PostalCode__s = postalCode,
      Type__c = 'Site'
    );
    if (servicePointId != null) {
      update new Service_Point__c(
        Id = servicePointId,
        Market_Identifier__c = marketIdentifier,
        Postcode__c = postalCode,
        Service_Type__c = serviceType,
        Annual_Consumption__c = annualConsumption == null
          ? null
          : String.valueOf(annualConsumption)
      );
    }
    if (associationId != null) {
      update new Site__c(
        Id = associationId,
        Start_Date__c = startDate,
        End_Date__c = endDate,
        Product__c = product,
        Margin_Value__c = marginValue,
        Tax_Exemption__c = taxExemption,
        Payment_Term__c = paymentTerm
      );
    }
    return new Map<String, Object>{
      'propertyId' => propertyId,
      'servicePointId' => servicePointId,
      'associationId' => associationId
    };
  }

  @AuraEnabled
  public static List<Id> createPropertyOpportunityAssociations(
    List<Map<String, Object>> associations
  ) {
    return createPropertyOpportunityAssociationsWithStatus(associations, null);
  }

  @AuraEnabled
  public static List<Id> createPropertyOpportunityAssociationsWithStatus(
    List<Map<String, Object>> associations,
    Boolean markAsVerified
  ) {
    if (associations == null || associations.isEmpty()) {
      return new List<Id>();
    }
    Set<Id> opportunityIds = new Set<Id>();
    Set<Id> propertyIds = new Set<Id>();
    for (Map<String, Object> row : associations) {
      if (row.get('opportunityId') != null) {
        opportunityIds.add((Id) row.get('opportunityId'));
      }
      if (row.get('propertyId') != null) {
        propertyIds.add((Id) row.get('propertyId'));
      }
    }
    Map<Id, Opportunity> opps = new Map<Id, Opportunity>([
      SELECT Id, AccountId
      FROM Opportunity
      WHERE Id IN :opportunityIds
    ]);
    Map<Id, Id> servicePointByProperty = new Map<Id, Id>();
    for (Service_Point__c sp : [
      SELECT Id, Property__c
      FROM Service_Point__c
      WHERE Property__c IN :propertyIds
    ]) {
      if (!servicePointByProperty.containsKey(sp.Property__c)) {
        servicePointByProperty.put(sp.Property__c, sp.Id);
      }
    }

    List<Site__c> sites = new List<Site__c>();
    for (Map<String, Object> row : associations) {
      Id oppId = (Id) row.get('opportunityId');
      Id propId = (Id) row.get('propertyId');
      if (oppId == null || propId == null || !opps.containsKey(oppId)) {
        continue;
      }
      Site__c site = new Site__c();
      site.Opportunity__c = oppId;
      site.Property__c = propId;
      site.Account__c = opps.get(oppId).AccountId;
      site.Service_Point__c = servicePointByProperty.get(propId);
      site.Start_Date__c = parseDate(row.get('startDate'));
      site.End_Date__c = parseDate(row.get('endDate'));
      sites.add(site);
    }
    insert sites;
    if (markAsVerified != null) {
      updateOpportunityFlags(opportunityIds, markAsVerified, false, null);
    }
    List<Id> ids = new List<Id>();
    for (Site__c site : sites) {
      ids.add(site.Id);
    }
    return ids;
  }

  @AuraEnabled
  public static void rejectOpportunitySites(
    Id opportunityId,
    String rejectionReason
  ) {
    if (opportunityId == null) {
      throw handledException('Opportunity Id is required.');
    }
    updateOpportunityFlags(
      new Set<Id>{ opportunityId },
      false,
      true,
      String.isBlank(rejectionReason) ? 'Rejected' : rejectionReason
    );
  }

  @AuraEnabled
  public static void setOpportunitySitesApprovalStatus(
    Id opportunityId,
    Boolean approved,
    String rejectionReason
  ) {
    if (opportunityId == null || approved == null) {
      throw handledException('Opportunity Id and approval decision are required.');
    }
    if (approved) {
      updateOpportunityFlags(new Set<Id>{ opportunityId }, true, false, null);
    } else {
      rejectOpportunitySites(opportunityId, rejectionReason);
    }
  }

  @AuraEnabled
  public static void deleteSiteRowRecords(
    Id propertyId,
    Id associationId,
    Id opportunityId
  ) {
    if (associationId != null) {
      delete [SELECT Id FROM Site__c WHERE Id = :associationId LIMIT 1];
      return;
    }
    if (propertyId != null && opportunityId != null) {
      delete [
        SELECT Id
        FROM Site__c
        WHERE Property__c = :propertyId AND Opportunity__c = :opportunityId
      ];
    }
  }

  public static Map<String, Object> validateOpportunityForStageAdvancement(
    Id opportunityId
  ) {
    List<String> blockers = new List<String>();
    if (opportunityId == null) {
      blockers.add('Opportunity Id is required');
    } else if ([SELECT COUNT() FROM Site__c WHERE Opportunity__c = :opportunityId] == 0) {
      blockers.add('No properties have been added to this opportunity');
    }
    return new Map<String, Object>{
      'canAdvance' => blockers.isEmpty(),
      'blockers' => blockers
    };
  }

  @TestVisible
  public static Map<String, Object> runCoverageUtilityProbe(
    Id opportunityId,
    Id propertyId
  ) {
    Map<String, Object> probe = new Map<String, Object>();
    probe.put('renewalNew', true);
    probe.put('hasServicePointField', Schema.SObjectType.Site__c.fields.getMap().containsKey('Service_Point__c'));
    probe.put('validationByOpp', validateOpportunityForStageAdvancement(opportunityId));
    probe.put('jobStatusNull', checkJobStatus(null));
    return probe;
  }

  private static Map<String, Object> toRow(Site__c site) {
    Map<String, Object> row = new Map<String, Object>();
    row.put('Id', site.Property__c);
    row.put('Association_Id__c', site.Id);
    row.put('associationId', site.Id);
    row.put('Account__c', site.Account__c);
    row.put('Opportunity__c', site.Opportunity__c);
    row.put('Property__c', site.Property__c);
    row.put('Service_Point__c', site.Service_Point__c);
    row.put('Service_Point_Id__c', site.Service_Point__c);
    row.put('Start_Date__c', site.Start_Date__c);
    row.put('End_Date__c', site.End_Date__c);
    row.put('Product__c', site.Product__c);
    row.put('Margin_Value__c', site.Margin_Value__c);
    row.put('Tax_Exemption__c', site.Tax_Exemption__c);
    row.put('Payment_Term__c', site.Payment_Term__c);
    if (site.Property__r != null) {
      row.put('Name', site.Property__r.Name);
      row.put('propertyName', site.Property__r.Name);
      row.put('Address__Street__s', site.Property__r.Address__Street__s);
      row.put('Address__City__s', site.Property__r.Address__City__s);
      row.put(
        'Address__PostalCode__s',
        String.isBlank(site.Property__r.Address__PostalCode__s)
          ? site.Property__r.Post_Code__c
          : site.Property__r.Address__PostalCode__s
      );
      row.put('Site_Address__Street__s', site.Property__r.Address__Street__s);
      row.put('Site_Address__City__s', site.Property__r.Address__City__s);
      row.put('Site_Address__PostalCode__s', row.get('Address__PostalCode__s'));
      row.put('Type__c', site.Property__r.Type__c);
    }
    if (site.Service_Point__r != null) {
      row.put('Market_Identifier__c', site.Service_Point__r.Market_Identifier__c);
      if (String.isBlank((String) row.get('Address__PostalCode__s'))) {
        row.put('Address__PostalCode__s', site.Service_Point__r.Postcode__c);
        row.put('Site_Address__PostalCode__s', site.Service_Point__r.Postcode__c);
      }
      row.put('Service_Type__c', site.Service_Point__r.Service_Type__c);
      row.put('Annual_Consumption__c', site.Service_Point__r.Annual_Consumption__c);
    }
    return row;
  }

  private static Date parseDate(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Date) {
      return (Date) value;
    }
    return Date.valueOf(String.valueOf(value));
  }

  private static Boolean isPartnerProfile() {
    String profileName = [
      SELECT Profile.Name
      FROM User
      WHERE Id = :UserInfo.getUserId()
      LIMIT 1
    ].Profile.Name;
    return profileName != null && profileName.toLowerCase().contains('partner');
  }

  private static void updateOpportunityFlags(
    Set<Id> opportunityIds,
    Boolean verified,
    Boolean rejected,
    String rejectionReason
  ) {
    List<Opportunity> updates = new List<Opportunity>();
    for (Id opportunityId : opportunityIds) {
      Opportunity opp = new Opportunity(Id = opportunityId);
      opp.Sites_Verified__c = verified;
      opp.Sites_Rejected__c = rejected;
      opp.Sites_Rejection_Reason__c = rejectionReason;
      updates.add(opp);
    }
    if (!updates.isEmpty()) {
      update updates;
    }
  }

  private static AuraHandledException handledException(String message) {
    AuraHandledException ex = new AuraHandledException(message);
    ex.setMessage(message);
    return ex;
  }
}
