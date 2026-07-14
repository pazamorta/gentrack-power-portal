public inherited sharing class PSPointCsvUploadCtrl {
  @TestVisible
  private static String JUNIFER_MODE_OVERRIDE;

  // Lightweight response wrapper for the CSV uploader UI.
  public class UploadResult {
    @AuraEnabled
    public Integer propertyCount;
    @AuraEnabled
    public Integer servicePointCount;
    @AuraEnabled
    public Integer associationCount;
    @AuraEnabled
    public List<String> warnings;

    public UploadResult() {
      propertyCount = 0;
      servicePointCount = 0;
      associationCount = 0;
      warnings = new List<String>();
    }
  }

  @AuraEnabled(cacheable=true)
  public static Boolean hasPropertyOppAssociations(Id opportunityId) {
    if (!Schema.SObjectType.Site__c.isAccessible()) {
      throw new AuraHandledException(
        'You do not have permission to view property opportunity associations.'
      );
    }
    if (opportunityId == null) {
      return false;
    }

    Integer associationCount = [
      SELECT COUNT()
      FROM Site__c
      WHERE Opportunity__c = :opportunityId
    ];
    return associationCount > 0;
  }

  @AuraEnabled
  public static UploadResult uploadCsvRows(
    Id opportunityId,
    List<Map<String, String>> rows
  ) {
    enforceUploadSecurity();
    UploadResult result = new UploadResult();

    if (opportunityId == null) {
      throw new AuraHandledException('Opportunity Id is required.');
    }

    if (rows == null || rows.isEmpty()) {
      throw new AuraHandledException('No CSV rows were provided.');
    }

    Map<String, Schema.SObjectField> spFieldMap = Schema.SObjectType.Service_Point__c.fields.getMap();
    Set<String> validServicePointFields = new Set<String>(spFieldMap.keySet());
    Set<String> validPropertyTypes = getValidPropertyTypes();
    Opportunity targetOpportunity = [
      SELECT
        Id,
        AccountId,
        Account.Name,
        Account.AccountNumber,
        Site_Addition__c,
        Pricing__c
      FROM Opportunity
      WHERE Id = :opportunityId
      LIMIT 1
    ];

    List<Property__c> candidatePropertiesForRows = new List<Property__c>();
    List<String> propertyKeysForRows = new List<String>();
    List<Map<String, String>> sourceRowsForRows = new List<Map<String, String>>();
    List<String> marketIdentifiersForRows = new List<String>();
    List<Date> startDatesForRows = new List<Date>();
    List<Date> endDatesForRows = new List<Date>();
    List<String> productsForRows = new List<String>();
    List<Decimal> marginValuesForRows = new List<Decimal>();
    List<Decimal> taxExemptionsForRows = new List<Decimal>();
    List<Integer> paymentTermsForRows = new List<Integer>();

    Integer rowNumber = 1;
    for (Map<String, String> row : rows) {
      if (row == null) {
        rowNumber++;
        continue;
      }

      String propertyName = valueFromKeys(
        row,
        new List<String>{ 'Property Name', 'PropertyName', 'Name' }
      );
      String addressLine1 = valueFromKeys(
        row,
        new List<String>{ 'AddressLine1', 'Address Line 1', 'Street' }
      );
      String addressLine2 = valueFromKeys(
        row,
        new List<String>{
          'AddressLine2',
          'Address Line 2',
          'AddressLine 2',
          'AddresLine2'
        }
      );
      String city = valueFromKeys(row, new List<String>{ 'City', 'Town' });
      String postcode = valueFromKeys(
        row,
        new List<String>{ 'Postcode', 'Post Code', 'PostalCode', 'Postal Code' }
      );
      String propertyType = valueFromKeys(
        row,
        new List<String>{ 'Type', 'Property Type', 'PropertyType' }
      );

      if (!rowHasAnyData(row)) {
        rowNumber++;
        continue;
      }

      String marketIdentifier = resolveCsvMarketIdentifier(row);
      Date startDate = resolveCsvStartDate(row);
      Date endDate = resolveCsvEndDate(row);
      if (startDate == null) {
        startDate = Date.today();
      }
      if (endDate == null) {
        endDate = startDate.addYears(1).addDays(-1);
      }
      String product = resolveCsvProduct(row);
      Decimal marginValue = resolveCsvMargin(row, rowNumber, result);
      Decimal taxExemption = resolveCsvTaxExemption(row, rowNumber, result);
      Integer paymentTerm = resolveCsvPaymentTerm(row, rowNumber, result);

      List<String> missingRequiredFields = new List<String>();
      if (String.isBlank(marketIdentifier)) {
        missingRequiredFields.add('market_identifier');
      }
      if (String.isBlank(product)) {
        missingRequiredFields.add('product');
      }
      if (marginValue == null) {
        missingRequiredFields.add('tpi_margin');
      }
      if (taxExemption == null) {
        missingRequiredFields.add('tax_exemption');
      }
      if (paymentTerm == null) {
        missingRequiredFields.add('payment_term');
      }

      if (!missingRequiredFields.isEmpty()) {
        result.warnings.add(
          'Row ' +
            rowNumber +
            ': missing required fields ' +
            String.join(missingRequiredFields, ', ') +
            '.'
        );
      }

      Property__c propertyRecord = new Property__c();
      propertyRecord.Name = String.isBlank(propertyName)
        ? (String.isNotBlank(marketIdentifier)
            ? marketIdentifier
            : 'Property ' + rowNumber)
        : propertyName;
      propertyRecord.Address__Street__s = mergeAddress(
        addressLine1,
        addressLine2
      );
      propertyRecord.Address__City__s = city;
      propertyRecord.Address__PostalCode__s = postcode;
      propertyRecord.Type__c = resolvePropertyType(
        propertyType,
        validPropertyTypes
      );

      String propertyKey = buildPropertyDedupeKey(propertyRecord);
      candidatePropertiesForRows.add(propertyRecord);
      propertyKeysForRows.add(propertyKey);
      sourceRowsForRows.add(row);
      marketIdentifiersForRows.add(marketIdentifier);
      startDatesForRows.add(startDate);
      endDatesForRows.add(endDate);
      productsForRows.add(product);
      marginValuesForRows.add(marginValue);
      taxExemptionsForRows.add(taxExemption);
      paymentTermsForRows.add(paymentTerm);
      rowNumber++;
    }

    if (candidatePropertiesForRows.isEmpty()) {
      throw new AuraHandledException(
        'No valid data rows found. Ensure yellow columns contain data.'
      );
    }

    Map<String, Property__c> existingPropertiesByKey = findExistingPropertiesByKey(
      new Set<String>(propertyKeysForRows),
      candidatePropertiesForRows
    );
    List<Property__c> propertiesToInsert = new List<Property__c>();
    Map<String, Property__c> newPropertiesByKey = new Map<String, Property__c>();
    List<Property__c> propertiesForRows = new List<Property__c>();

    for (Integer i = 0; i < candidatePropertiesForRows.size(); i++) {
      String propertyKey = propertyKeysForRows[i];
      if (existingPropertiesByKey.containsKey(propertyKey)) {
        propertiesForRows.add(existingPropertiesByKey.get(propertyKey));
        continue;
      }

      if (!newPropertiesByKey.containsKey(propertyKey)) {
        Property__c propertyToInsert = candidatePropertiesForRows[i];
        propertyToInsert.Account__c = targetOpportunity.AccountId;
        newPropertiesByKey.put(propertyKey, propertyToInsert);
        propertiesToInsert.add(propertyToInsert);
      }
      propertiesForRows.add(newPropertiesByKey.get(propertyKey));
    }

    if (!propertiesToInsert.isEmpty()) {
      insert propertiesToInsert;
    }

    List<Service_Point__c> servicePointsToInsert = new List<Service_Point__c>();
    List<Integer> associationIndexForServicePoint = new List<Integer>();
    List<Site__c> associationsToInsert = new List<Site__c>();

    for (Integer i = 0; i < sourceRowsForRows.size(); i++) {
      Property__c insertedProperty = propertiesForRows[i];
      Map<String, String> sourceRow = sourceRowsForRows[i];
      String requiredMarketIdentifier = marketIdentifiersForRows[i];

      Service_Point__c servicePoint = new Service_Point__c();
      servicePoint.Property__c = insertedProperty.Id;
      servicePoint.Opportunity__c = opportunityId;

      Boolean hasServicePointData = false;

      String serviceType = valueFromKeys(
        sourceRow,
        new List<String>{ 'Service Type', 'ServiceType', 'Service_Type__c' }
      );
      String annualConsumption = valueFromKeys(
        sourceRow,
        new List<String>{
          'Annual Consumption',
          'AnnualConsumption',
          'Annual_Consumption__c'
        }
      );

      if (String.isNotBlank(requiredMarketIdentifier)) {
        //servicePoint.Name = requiredMarketIdentifier;
        servicePoint.Market_Identifier__c = requiredMarketIdentifier;
        hasServicePointData = true;
      }
      String servicePointPostcode = valueFromKeys(
        sourceRow,
        new List<String>{ 'Postcode', 'Post Code', 'PostalCode', 'Postal Code' }
      );
      if (String.isNotBlank(servicePointPostcode)) {
        servicePoint.Postcode__c = servicePointPostcode;
      }
      if (String.isNotBlank(serviceType)) {
        servicePoint.Service_Type__c = serviceType;
        hasServicePointData = true;
      }
      if (String.isNotBlank(annualConsumption)) {
        servicePoint.Annual_Consumption__c = annualConsumption;
        hasServicePointData = true;
      }

      for (String header : sourceRow.keySet()) {
        if (String.isBlank(header)) {
          continue;
        }

        if (isYellowPropertyColumn(header) || isOpportunityIdColumn(header)) {
          continue;
        }

        if (isCoreServicePointColumn(header)) {
          continue;
        }
        if (isAssociationColumn(header)) {
          continue;
        }

        String value = sourceRow.get(header);
        if (String.isBlank(value)) {
          continue;
        }

        String mappedField = mapServicePointHeaderToField(
          header,
          validServicePointFields
        );
        if (mappedField == null) {
          continue;
        }

        if (!spFieldMap.get(mappedField).getDescribe().isCreateable()) {
          continue;
        }
        servicePoint.put(mappedField, value);
        hasServicePointData = true;
      }

      if (hasServicePointData) {
        associationIndexForServicePoint.add(associationsToInsert.size());
        servicePointsToInsert.add(servicePoint);
      }

      associationsToInsert.add(
        new Site__c(
          Account__c = targetOpportunity.AccountId,
          Property__c = insertedProperty.Id,
          Opportunity__c = opportunityId,
          Start_Date__c = startDatesForRows[i],
          End_Date__c = endDatesForRows[i],
          Product__c = productsForRows[i],
          Margin_Value__c = marginValuesForRows[i],
          Tax_Exemption__c = taxExemptionsForRows[i],
          Payment_Term__c = paymentTermsForRows[i]
        )
      );
    }

    if (!servicePointsToInsert.isEmpty()) {
      insert servicePointsToInsert;
    }

    if (!associationsToInsert.isEmpty()) {
      if (!servicePointsToInsert.isEmpty()) {
        for (Integer i = 0; i < servicePointsToInsert.size(); i++) {
          Integer associationIndex = associationIndexForServicePoint[i];
          Service_Point__c insertedServicePoint = servicePointsToInsert[i];
          associationsToInsert[associationIndex].Service_Point__c = insertedServicePoint.Id;
        }
      }
      insert associationsToInsert;
    }

    result.propertyCount = propertiesToInsert.size();
    result.servicePointCount = servicePointsToInsert.size();
    result.associationCount = associationsToInsert.size();

    if (!sourceRowsForRows.isEmpty()) {
      result.warnings.add(
        'Junifer sync skipped during the renamed metadata cutover. Salesforce Site, Property and Service Point records were created.'
      );
    }

    return result;
  }

  private static void enforceUploadSecurity() {
    if (!Schema.SObjectType.Opportunity.isAccessible()) {
      throw new AuraHandledException(
        'You do not have permission to access Opportunity records.'
      );
    }
    if (
      !Schema.SObjectType.Opportunity.fields.AccountId.isAccessible() ||
      !Schema.SObjectType.Opportunity.fields.Site_Addition__c.isAccessible() ||
      !Schema.SObjectType.Opportunity.fields.Pricing__c.isAccessible()
    ) {
      throw new AuraHandledException(
        'You do not have permission to read required Opportunity fields.'
      );
    }
    if (!Schema.SObjectType.Property__c.isCreateable()) {
      throw new AuraHandledException(
        'You do not have permission to create Properties.'
      );
    }
    if (!Schema.SObjectType.Service_Point__c.isCreateable()) {
      throw new AuraHandledException(
        'You do not have permission to create Service Points.'
      );
    }
    if (!Schema.SObjectType.Site__c.isCreateable()) {
      throw new AuraHandledException(
        'You do not have permission to create Property Opportunity Associations.'
      );
    }
  }

  private static String valueFromKeys(
    Map<String, String> row,
    List<String> keys
  ) {
    for (String key : keys) {
      if (row.containsKey(key) && String.isNotBlank(row.get(key))) {
        return row.get(key).trim();
      }
    }

    Map<String, String> normalizedRow = normalizeMapKeys(row);
    for (String key : keys) {
      String normalizedKey = normalizeHeader(key);
      if (
        normalizedRow.containsKey(normalizedKey) &&
        String.isNotBlank(normalizedRow.get(normalizedKey))
      ) {
        return normalizedRow.get(normalizedKey).trim();
      }
    }

    return null;
  }

  private static Boolean rowHasAnyData(Map<String, String> row) {
    if (row == null || row.isEmpty()) {
      return false;
    }

    for (String key : row.keySet()) {
      if (String.isNotBlank(row.get(key))) {
        return true;
      }
    }

    return false;
  }

  private static String mergeAddress(String line1, String line2) {
    if (String.isBlank(line2)) {
      return line1;
    }
    if (String.isBlank(line1)) {
      return line2;
    }
    return line1 + ', ' + line2;
  }

  private static String buildPropertyDedupeKey(Property__c propertyRecord) {
    if (
      String.isNotBlank(propertyRecord.Address__Street__s) ||
      String.isNotBlank(propertyRecord.Address__City__s) ||
      String.isNotBlank(propertyRecord.Address__PostalCode__s)
    ) {
      return String.join(
        new List<String>{
          'ADDRESS',
          normalizeDedupeValue(propertyRecord.Address__Street__s),
          normalizeDedupeValue(propertyRecord.Address__City__s),
          normalizeDedupeValue(propertyRecord.Address__PostalCode__s),
          normalizeDedupeValue(propertyRecord.Type__c)
        },
        '|'
      );
    }

    return String.join(
      new List<String>{
        'NAME',
        normalizeDedupeValue(propertyRecord.Name),
        normalizeDedupeValue(propertyRecord.Type__c)
      },
      '|'
    );
  }

  private static Map<String, Property__c> findExistingPropertiesByKey(
    Set<String> propertyKeys,
    List<Property__c> candidateProperties
  ) {
    Map<String, Property__c> existingPropertiesByKey = new Map<String, Property__c>();
    Set<String> postcodes = new Set<String>();
    Set<String> namesWithoutAddress = new Set<String>();

    for (Property__c candidate : candidateProperties) {
      if (String.isNotBlank(candidate.Address__PostalCode__s)) {
        postcodes.add(candidate.Address__PostalCode__s);
      } else if (
        String.isBlank(candidate.Address__Street__s) &&
        String.isBlank(candidate.Address__City__s) &&
        String.isNotBlank(candidate.Name)
      ) {
        namesWithoutAddress.add(candidate.Name);
      }
    }

    if (postcodes.isEmpty() && namesWithoutAddress.isEmpty()) {
      return existingPropertiesByKey;
    }

    for (Property__c existingProperty : [
      SELECT
        Id,
        Name,
        Account__c,
        Address__Street__s,
        Address__City__s,
        Address__PostalCode__s,
        Type__c
      FROM Property__c
      WHERE
        Address__PostalCode__s IN :postcodes OR
        (Address__PostalCode__s = NULL AND Name IN :namesWithoutAddress)
      ORDER BY CreatedDate ASC, Id ASC
    ]) {
      String propertyKey = buildPropertyDedupeKey(existingProperty);
      if (
        propertyKeys.contains(propertyKey) &&
        !existingPropertiesByKey.containsKey(propertyKey)
      ) {
        existingPropertiesByKey.put(propertyKey, existingProperty);
      }
    }

    return existingPropertiesByKey;
  }

  private static String normalizeDedupeValue(String value) {
    if (String.isBlank(value)) {
      return '';
    }
    return value.trim().toLowerCase().replaceAll('\\s+', ' ');
  }

  private static Boolean isYellowPropertyColumn(String header) {
    String normalized = normalizeHeader(header);
    return normalized == 'propertyname' ||
      normalized == 'addressline1' ||
      normalized == 'addressline2' ||
      normalized == 'addresline2' ||
      normalized == 'city' ||
      normalized == 'postcode' ||
      normalized == 'postalcode' ||
      normalized == 'type' ||
      normalized == 'propertytype';
  }

  private static Boolean isOpportunityIdColumn(String header) {
    String normalized = normalizeHeader(header);
    return normalized == 'opportunityid' || normalized == 'gtcxopportunityc';
  }

  private static Boolean isCoreServicePointColumn(String header) {
    String normalized = normalizeHeader(header);
    return normalized == 'marketidentifier' ||
      normalized == 'servicetype' ||
      normalized == 'annualconsumption';
  }

  private static Boolean isAssociationColumn(String header) {
    String normalized = normalizeHeader(header);
    return normalized == 'startdate' ||
      normalized == 'enddate' ||
      normalized == 'product' ||
      normalized == 'marginvalue' ||
      normalized == 'tpimargin' ||
      normalized == 'tpimarginvalue' ||
      normalized == 'taxexemption' ||
      normalized == 'paymentterm';
  }

  private static String mapServicePointHeaderToField(
    String header,
    Set<String> validServicePointFields
  ) {
    String normalized = normalizeHeader(header);

    Map<String, String> aliases = new Map<String, String>{
      'marketidentifier' => 'Market_Identifier__c',
      'postcode' => 'Postcode__c',
      'postalcode' => 'Postcode__c',
      'servicetype' => 'Service_Type__c',
      'annualconsumption' => 'Annual_Consumption__c',
      'contactname' => 'Contact_Name__c',
      'contactemail' => 'Contact_Email__c',
      'contactphone' => 'Contact_Phone__c',
      'companynumber' => 'Company_Number__c',
      'productpreference' => 'Product_Preference__c',
      'fueltype' => 'Fuel_Type__c',
      'durationoptions' => 'Duration_Options__c',
      'supplystatus' => 'Supply_Status__c'
    };

    if (
      aliases.containsKey(normalized) &&
      validServicePointFields.contains(aliases.get(normalized))
    ) {
      return aliases.get(normalized);
    }

    String candidateApi = header != null ? header.trim() : '';
    if (validServicePointFields.contains(candidateApi)) {
      return candidateApi;
    }

    if (!candidateApi.endsWith('__c')) {
      String rawCandidate = toApiToken(candidateApi) + '__c';
      if (validServicePointFields.contains(rawCandidate)) {
        return rawCandidate;
      }
    }

    return null;
  }

  private static Map<String, String> normalizeMapKeys(Map<String, String> row) {
    Map<String, String> normalized = new Map<String, String>();
    for (String key : row.keySet()) {
      normalized.put(normalizeHeader(key), row.get(key));
    }
    return normalized;
  }

  private static String normalizeHeader(String header) {
    if (header == null) {
      return '';
    }
    return header.toLowerCase().replaceAll('[^a-z0-9]', '');
  }

  private static String toApiToken(String raw) {
    if (String.isBlank(raw)) {
      return '';
    }

    String normalized = raw.replaceAll('[^A-Za-z0-9]+', ' ').trim();
    if (String.isBlank(normalized)) {
      return '';
    }

    List<String> pieces = normalized.split(' ');
    List<String> transformed = new List<String>();
    for (String piece : pieces) {
      if (String.isBlank(piece)) {
        continue;
      }
      transformed.add(
        piece.substring(0, 1).toUpperCase() + piece.substring(1).toLowerCase()
      );
    }

    return String.join(transformed, '_');
  }

  private static Set<String> getValidPropertyTypes() {
    Set<String> values = new Set<String>();
    for (
      Schema.PicklistEntry entry : Property__c.Type__c.getDescribe()
        .getPicklistValues()
    ) {
      values.add(entry.getValue());
    }
    return values;
  }

  private static String resolvePropertyType(
    String csvType,
    Set<String> validPropertyTypes
  ) {
    if (
      String.isNotBlank(csvType) && validPropertyTypes.contains(csvType.trim())
    ) {
      return csvType.trim();
    }
    return 'Site';
  }

  private static Date resolveCsvStartDate(Map<String, String> row) {
    String rawStartDate = valueFromKeys(
      row,
      new List<String>{
        'start_date',
        'Start Date',
        'StartDate',
        'Start_Date__c'
      }
    );
    return parseCsvDate(rawStartDate);
  }

  private static Date resolveCsvEndDate(Map<String, String> row) {
    String rawEndDate = valueFromKeys(
      row,
      new List<String>{ 'end_date', 'End Date', 'EndDate', 'End_Date__c' }
    );
    return parseCsvDate(rawEndDate);
  }

  private static String resolveCsvMarketIdentifier(Map<String, String> row) {
    return valueFromKeys(
      row,
      new List<String>{
        'market_identifier',
        'Market Identifier',
        'MarketIdentifier',
        'Market_Identifier__c'
      }
    );
  }

  private static String resolveCsvProduct(Map<String, String> row) {
    return valueFromKeys(
      row,
      new List<String>{ 'product', 'Product', 'Product__c' }
    );
  }

  private static Decimal resolveCsvMargin(
    Map<String, String> row,
    Integer rowNumber,
    UploadResult result
  ) {
    String rawMargin = valueFromKeys(
      row,
      new List<String>{
        'tpi_margin',
        'TPI Margin',
        'TPI Margin Value',
        'margin_value',
        'Margin Value',
        'Margin_Value__c'
      }
    );
    return parseCsvDecimal(rawMargin, 'tpi_margin', rowNumber, result);
  }

  private static Decimal resolveCsvTaxExemption(
    Map<String, String> row,
    Integer rowNumber,
    UploadResult result
  ) {
    String rawTax = valueFromKeys(
      row,
      new List<String>{ 'tax_exemption', 'Tax Exemption', 'Tax_Exemption__c' }
    );
    if (String.isBlank(rawTax)) {
      return null;
    }

    String lowered = rawTax.trim().toLowerCase();
    if (
      lowered == 'true' ||
      lowered == 'yes' ||
      lowered == 'y' ||
      lowered == '1'
    ) {
      return Decimal.valueOf(1);
    }
    if (
      lowered == 'false' ||
      lowered == 'no' ||
      lowered == 'n' ||
      lowered == '0'
    ) {
      return Decimal.valueOf(0);
    }
    return parseCsvDecimal(rawTax, 'tax_exemption', rowNumber, result);
  }

  private static Integer resolveCsvPaymentTerm(
    Map<String, String> row,
    Integer rowNumber,
    UploadResult result
  ) {
    String rawPaymentTerm = valueFromKeys(
      row,
      new List<String>{
        'payment_term',
        'payment_terms',
        'Payment Term',
        'Payment Terms',
        'Payment_Term__c'
      }
    );
    return parseCsvInteger(
      rawPaymentTerm,
      'payment_term',
      rowNumber,
      3,
      result
    );
  }

  private static Decimal parseCsvDecimal(
    String rawValue,
    String fieldName,
    Integer rowNumber,
    UploadResult result
  ) {
    if (String.isBlank(rawValue)) {
      return null;
    }

    try {
      String normalized = rawValue.replace(',', '').trim();
      return Decimal.valueOf(normalized);
    } catch (Exception ignored) {
      if (result != null) {
        result.warnings.add(
          'Row ' +
            rowNumber +
            ': invalid value for ' +
            fieldName +
            ' (' +
            rawValue +
            ').'
        );
      }
      return null;
    }
  }

  private static Integer parseCsvInteger(
    String rawValue,
    String fieldName,
    Integer rowNumber,
    Integer maxDigits,
    UploadResult result
  ) {
    if (String.isBlank(rawValue)) {
      return null;
    }

    String normalized = rawValue.trim();
    if (!Pattern.matches('^[0-9]+$', normalized)) {
      if (result != null) {
        result.warnings.add(
          'Row ' +
            rowNumber +
            ': invalid value for ' +
            fieldName +
            ' (' +
            rawValue +
            ').'
        );
      }
      return null;
    }

    if (maxDigits != null && normalized.length() > maxDigits) {
      if (result != null) {
        result.warnings.add(
          'Row ' +
            rowNumber +
            ': invalid value for ' +
            fieldName +
            ' (' +
            rawValue +
            ').'
        );
      }
      return null;
    }

    try {
      return Integer.valueOf(normalized);
    } catch (Exception ignored) {
      if (result != null) {
        result.warnings.add(
          'Row ' +
            rowNumber +
            ': invalid value for ' +
            fieldName +
            ' (' +
            rawValue +
            ').'
        );
      }
      return null;
    }
  }

  private static Date parseCsvDate(String rawDate) {
    if (String.isBlank(rawDate)) {
      return null;
    }

    String value = rawDate.trim();

    try {
      return Date.valueOf(value);
    } catch (Exception ignored) {
      // continue to fallback formats
    }

    // Support common UK-style CSV dates (dd/MM/yyyy).
    if (value.contains('/')) {
      List<String> parts = value.split('/');
      if (parts.size() == 3) {
        try {
          Integer day = Integer.valueOf(parts[0]);
          Integer month = Integer.valueOf(parts[1]);
          Integer year = Integer.valueOf(parts[2]);
          return Date.newInstance(year, month, day);
        } catch (Exception ignored) {
          return null;
        }
      }
    }

    return null;
  }

  private static String resolveJuniferMode() {
    return Test.isRunningTest() ? JUNIFER_MODE_OVERRIDE : null;
  }

  @TestVisible
  private static void syncPropertiesInline(
    List<Id> propertyIds,
    String prospectNumber,
    String mode
  ) {
    if (propertyIds == null || propertyIds.isEmpty()) {
      return;
    }

    Map<Id, Property__c> propertiesById = new Map<Id, Property__c>(
      [
        SELECT
          Id,
          Name,
          Address__Street__s,
          Address__City__s,
          Address__PostalCode__s,
          Type__c
        FROM Property__c
        WHERE Id IN :propertyIds
      ]
    );

    Map<Id, Service_Point__c> servicePointsByPropertyId = new Map<Id, Service_Point__c>();
    for (Service_Point__c servicePoint : [
      SELECT
        Id,
        Property__c,
        Market_Identifier__c,
        Service_Type__c,
        Annual_Consumption__c
      FROM Service_Point__c
      WHERE Property__c IN :propertyIds
    ]) {
      if (
        servicePoint.Property__c != null &&
        !servicePointsByPropertyId.containsKey(servicePoint.Property__c)
      ) {
        servicePointsByPropertyId.put(servicePoint.Property__c, servicePoint);
      }
    }

    for (Id propertyId : propertyIds) {
      Property__c property = propertiesById.get(propertyId);
      if (property == null) {
        continue;
      }
      syncPropertyToJunifer(
        property,
        servicePointsByPropertyId.get(propertyId),
        prospectNumber,
        mode
      );
    }
  }

  public class JuniferCsvSyncQueueable implements Queueable, Database.AllowsCallouts {
    private List<Id> propertyIds;
    private String prospectNumber;
    private Integer currentIndex;
    private String mode;

    public JuniferCsvSyncQueueable(
      List<Id> propertyIds,
      String prospectNumber,
      Integer currentIndex,
      String mode
    ) {
      this.propertyIds = propertyIds;
      this.prospectNumber = prospectNumber;
      this.currentIndex = currentIndex;
      this.mode = mode;
    }

    public void execute(QueueableContext context) {
      if (
        propertyIds == null ||
        propertyIds.isEmpty() ||
        currentIndex >= propertyIds.size()
      ) {
        return;
      }

      Id propertyId = propertyIds[currentIndex];
      try {
        Property__c property = [
          SELECT
            Id,
            Name,
            Address__Street__s,
            Address__City__s,
            Address__PostalCode__s,
            Type__c
          FROM Property__c
          WHERE Id = :propertyId
          LIMIT 1
        ];

        Service_Point__c servicePoint = null;
        List<Service_Point__c> servicePoints = [
          SELECT
            Id,
            Market_Identifier__c,
            Service_Type__c,
            Annual_Consumption__c
          FROM Service_Point__c
          WHERE Property__c = :property.Id
          LIMIT 1
        ];
        if (!servicePoints.isEmpty()) {
          servicePoint = servicePoints[0];
        }

        syncPropertyToJunifer(property, servicePoint, prospectNumber, mode);
      } catch (Exception e) {
        System.debug(
          LoggingLevel.ERROR,
          'Junifer CSV sync failed for property ' +
            propertyId +
            ': ' +
            e.getMessage()
        );
      }

      Integer nextIndex = currentIndex + 1;
      if (nextIndex < propertyIds.size()) {
        System.enqueueJob(
          new JuniferCsvSyncQueueable(
            propertyIds,
            prospectNumber,
            nextIndex,
            mode
          )
        );
      }
    }
  }

  @TestVisible
  private static void syncPropertyToJunifer(
    Property__c property,
    Service_Point__c servicePoint,
    String prospectNumber,
    String mode
  ) {
    // The legacy GTCX-prefixed Junifer DTO classes are intentionally not part
    // of the renamed Production deployment. CSV upload remains Salesforce-local
    // until the renamed integration layer is enabled.
    System.debug(
      LoggingLevel.INFO,
      'Skipping Junifer CSV sync for property ' +
      (property != null ? property.Id : null)
    );
  }

  private static Double parseServicePointConsumption(String annualConsumption) {
    if (String.isBlank(annualConsumption)) {
      return null;
    }
    try {
      return Double.valueOf(annualConsumption.replace(',', '').trim());
    } catch (Exception ignored) {
      return null;
    }
  }
}
