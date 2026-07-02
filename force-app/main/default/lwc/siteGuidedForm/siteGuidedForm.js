/**
 * gtcxSiteGuidedForm
 *
 * LWC Component for managing multiple Site records in bulk.
 *
 * Features:
 *   - Displays all Sites for an Account in a Lightning Datatable
 *   - Allows users to select a Site from the table to edit
 *   - Saves changes directly to Site records
 *   - Supports save/resume functionality with secure tokens (7-day expiry)
 *   - Validates Site completion status
 *
 * Usage:
 *   - Place on Account record page in Lightning App Builder
 *   - Component automatically detects Account ID from page context
 *
 * Used by: Account record pages or Experience Cloud pages
 */
import { LightningElement, api, track, wire } from "lwc";
import { CurrentPageReference } from "lightning/navigation";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import LightningConfirm from "lightning/confirm";

// New Property/Service Point-based controller
import getPropertiesWithServicePoints from "@salesforce/apex/PropertyServicePointController.getPropertiesWithServicePoints";
import getPropertiesWithServicePointsForOpportunity from "@salesforce/apex/PropertyServicePointController.getPropertiesWithServicePointsForOpportunity";
import updatePropertyAndServicePoint from "@salesforce/apex/PropertyServicePointController.updatePropertyAndServicePoint";
import createPropertyOpportunityAssociations from "@salesforce/apex/PropertyServicePointController.createPropertyOpportunityAssociations";
import getSubmitAccessInfo from "@salesforce/apex/PropertyServicePointController.getSubmitAccessInfo";
import checkJobStatus from "@salesforce/apex/PropertyServicePointController.checkJobStatus";
import deleteSiteRowRecords from "@salesforce/apex/PropertyServicePointController.deleteSiteRowRecords";
import setOpportunitySitesApprovalStatus from "@salesforce/apex/PropertyServicePointController.setOpportunitySitesApprovalStatus";
import getExpectedAccountCode from "@salesforce/apex/PropertyServicePointController.getExpectedAccountCode";
import SiteGuidedForm_LoadingSites from "@salesforce/label/c.SiteGuidedForm_LoadingSites";
import SiteGuidedForm_ProcessedOfSites from "@salesforce/label/c.SiteGuidedForm_ProcessedOfSites";
import SiteGuidedForm_Processing from "@salesforce/label/c.SiteGuidedForm_Processing";
import SiteGuidedForm_SalesforceOpportunityId from "@salesforce/label/c.SiteGuidedForm_SalesforceOpportunityId";
import SiteGuidedForm_ThisShouldOnly from "@salesforce/label/c.SiteGuidedForm_ThisShouldOnly";
import SiteGuidedForm_WeAreWorking from "@salesforce/label/c.SiteGuidedForm_WeAreWorking";
import SiteGuidedForm_WellKeepWorking from "@salesforce/label/c.SiteGuidedForm_WellKeepWorking";
import SiteGuidedForm_AllRequiredFields from "@salesforce/label/c.SiteGuidedForm_AllRequiredFields";

import Common_AddAtRenewal from "@salesforce/label/c.Common_AddAtRenewal";
import Common_AddToMainFixedContractBlend from "@salesforce/label/c.Common_AddToMainFixedContractBlend";
import Common_AddToMainFixedContractLatest from "@salesforce/label/c.Common_AddToMainFixedContractLatest";
import Common_AddToMainFlexContract from "@salesforce/label/c.Common_AddToMainFlexContract";
import Common_AnnualConsumption from "@salesforce/label/c.Common_AnnualConsumption";
import Common_Approve from "@salesforce/label/c.Common_Approve";
import Common_Cancel from "@salesforce/label/c.Common_Cancel";
import Common_Country from "@salesforce/label/c.Common_Country";
import Common_Failed from "@salesforce/label/c.Common_Failed";
import Common_Id from "@salesforce/label/c.Common_Id";
import Common_MarketIdentifier from "@salesforce/label/c.Common_MarketIdentifier";
import Common_MessageErrorTitle from "@salesforce/label/c.Common_MessageErrorTitle";
import Common_MessageSuccessTitle from "@salesforce/label/c.Common_MessageSuccessTitle";
import Common_OpportunityIDIsMissing from "@salesforce/label/c.Common_OpportunityIDIsMissing";
import Common_PaymentTerm from "@salesforce/label/c.Common_PaymentTerm";
import Common_Previous from "@salesforce/label/c.Common_Previous";
import Common_PostalCode from "@salesforce/label/c.Common_PostalCode";
import Common_Reject from "@salesforce/label/c.Common_Reject";
import Common_ServiceType from "@salesforce/label/c.Common_ServiceType";
import Common_ShortFixedTermCoterminousEnd from "@salesforce/label/c.Common_ShortFixedTermCoterminousEnd";
import Common_SiteName from "@salesforce/label/c.Common_SiteName";
import Common_SitesApprovedSuccessfully from "@salesforce/label/c.Common_SitesApprovedSuccessfully";
import Common_SitesRejectedSuccessfully from "@salesforce/label/c.Common_SitesRejectedSuccessfully";
import Common_Street from "@salesforce/label/c.Common_Street";
import Common_Submitting from "@salesforce/label/c.Common_Submitting";
import Common_TPIMargin from "@salesforce/label/c.Common_TPIMargin";
import Common_TaxExemption from "@salesforce/label/c.Common_TaxExemption";
import Common_UnableToUpdateSiteApprovalStatus from "@salesforce/label/c.Common_UnableToUpdateSiteApprovalStatus";
import Common_Verify from "@salesforce/label/c.Common_Verify";
import ContractManager_Product from "@salesforce/label/c.ContractManager_Product";
import ContractManager_Sites from "@salesforce/label/c.ContractManager_Sites";
import ContractManager_Value from "@salesforce/label/c.ContractManager_Value";
import QuoteHeader_EndDate from "@salesforce/label/c.QuoteHeader_EndDate";
import QuoteHeader_StartDate from "@salesforce/label/c.QuoteHeader_StartDate";
import SiteGuidedForm_AccountCode from "@salesforce/label/c.SiteGuidedForm_AccountCode";
import SiteGuidedForm_AccountCodeValidationFailed3Times from "@salesforce/label/c.SiteGuidedForm_AccountCodeValidationFailed3Times";
import SiteGuidedForm_AccountCodeVerification from "@salesforce/label/c.SiteGuidedForm_AccountCodeVerification";
import SiteGuidedForm_AccountIDIsMissing from "@salesforce/label/c.SiteGuidedForm_AccountIDIsMissing";
import SiteGuidedForm_Apply from "@salesforce/label/c.SiteGuidedForm_Apply";
import SiteGuidedForm_ApplyValueToSelectedRows from "@salesforce/label/c.SiteGuidedForm_ApplyValueToSelectedRows";
import SiteGuidedForm_Completed from "@salesforce/label/c.SiteGuidedForm_Completed";
import SiteGuidedForm_ConfirmRowDeletion from "@salesforce/label/c.SiteGuidedForm_ConfirmRowDeletion";
import SiteGuidedForm_DatesWillBeAutomaticallyCalculatedFrom from "@salesforce/label/c.SiteGuidedForm_DatesWillBeAutomaticallyCalculatedFrom";
import SiteGuidedForm_DatesWillBeCalculatedFromContract from "@salesforce/label/c.SiteGuidedForm_DatesWillBeCalculatedFromContract";
import SiteGuidedForm_DeleteRow from "@salesforce/label/c.SiteGuidedForm_DeleteRow";
import SiteGuidedForm_EndDateContractEndDateMissing from "@salesforce/label/c.SiteGuidedForm_EndDateContractEndDateMissing";
import SiteGuidedForm_EndDateMissingCheckContractEnd from "@salesforce/label/c.SiteGuidedForm_EndDateMissingCheckContractEnd";
import SiteGuidedForm_EndDatePleaseEnterOrSet from "@salesforce/label/c.SiteGuidedForm_EndDatePleaseEnterOrSet";
import SiteGuidedForm_EndDateWillMatchTheMain from "@salesforce/label/c.SiteGuidedForm_EndDateWillMatchTheMain";
import SiteGuidedForm_EnterTheAccountCodeToContinue from "@salesforce/label/c.SiteGuidedForm_EnterTheAccountCodeToContinue";
import SiteGuidedForm_ErrorInSaveFlow from "@salesforce/label/c.SiteGuidedForm_ErrorInSaveFlow";
import SiteGuidedForm_ErrorLoadingProperties from "@salesforce/label/c.SiteGuidedForm_ErrorLoadingProperties";
import SiteGuidedForm_ErrorLoadingSubmitAccessInfo from "@salesforce/label/c.SiteGuidedForm_ErrorLoadingSubmitAccessInfo";
import SiteGuidedForm_ErrorPollingJobStatus from "@salesforce/label/c.SiteGuidedForm_ErrorPollingJobStatus";
import SiteGuidedForm_ErrorSavingRecords from "@salesforce/label/c.SiteGuidedForm_ErrorSavingRecords";
import SiteGuidedForm_ErrorSubmittingForm from "@salesforce/label/c.SiteGuidedForm_ErrorSubmittingForm";
import SiteGuidedForm_FormSubmittedPropertiesAreBeingPosted from "@salesforce/label/c.SiteGuidedForm_FormSubmittedPropertiesAreBeingPosted";
import SiteGuidedForm_FormSubmittedSuccessfully from "@salesforce/label/c.SiteGuidedForm_FormSubmittedSuccessfully";
import SiteGuidedForm_FormValidationFailed from "@salesforce/label/c.SiteGuidedForm_FormValidationFailed";
import SiteGuidedForm_JobFailed from "@salesforce/label/c.SiteGuidedForm_JobFailed";
import SiteGuidedForm_JoinAtRenewal from "@salesforce/label/c.SiteGuidedForm_JoinAtRenewal";
import SiteGuidedForm_JoinMainContract from "@salesforce/label/c.SiteGuidedForm_JoinMainContract";
import SiteGuidedForm_MPANOrMPRNAtLeastOne from "@salesforce/label/c.SiteGuidedForm_MPANOrMPRNAtLeastOne";
import SiteGuidedForm_MaxPollingAttemptsReached from "@salesforce/label/c.SiteGuidedForm_MaxPollingAttemptsReached";
import SiteGuidedForm_MissingRequiredFieldEndDate from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldEndDate";
import SiteGuidedForm_MissingRequiredFieldMarketIdentifier from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldMarketIdentifier";
import SiteGuidedForm_MissingRequiredFieldPaymentTerm from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldPaymentTerm";
import SiteGuidedForm_MissingRequiredFieldProduct from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldProduct";
import SiteGuidedForm_MissingRequiredFieldServiceType from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldServiceType";
import SiteGuidedForm_MissingRequiredFieldStartDate from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldStartDate";
import SiteGuidedForm_MissingRequiredFieldTPIMargin from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldTPIMargin";
import SiteGuidedForm_MissingRequiredFieldTaxExemption from "@salesforce/label/c.SiteGuidedForm_MissingRequiredFieldTaxExemption";
import SiteGuidedForm_NoJobIDAvailableForPolling from "@salesforce/label/c.SiteGuidedForm_NoJobIDAvailableForPolling";
import SiteGuidedForm_PleaseProvideMPANOrMPRNNot from "@salesforce/label/c.SiteGuidedForm_PleaseProvideMPANOrMPRNNot";
import SiteGuidedForm_PleaseSaveYourTableEditsBefore from "@salesforce/label/c.SiteGuidedForm_PleaseSaveYourTableEditsBefore";
import SiteGuidedForm_PropertyAndServicePointRecordsUpdated from "@salesforce/label/c.SiteGuidedForm_PropertyAndServicePointRecordsUpdated";
import SiteGuidedForm_RejectedByPrimaryContact from "@salesforce/label/c.SiteGuidedForm_RejectedByPrimaryContact";
import SiteGuidedForm_SaveRequired from "@salesforce/label/c.SiteGuidedForm_SaveRequired";
import SiteGuidedForm_ShortTermContract from "@salesforce/label/c.SiteGuidedForm_ShortTermContract";
import SiteGuidedForm_SiteAdditionJoinAtRenewal from "@salesforce/label/c.SiteGuidedForm_SiteAdditionJoinAtRenewal";
import SiteGuidedForm_SiteAdditionJoinMainContract from "@salesforce/label/c.SiteGuidedForm_SiteAdditionJoinMainContract";
import SiteGuidedForm_SiteAdditionShortTermContract from "@salesforce/label/c.SiteGuidedForm_SiteAdditionShortTermContract";
import SiteGuidedForm_SiteAddressCityS from "@salesforce/label/c.SiteGuidedForm_SiteAddressCityS";
import SiteGuidedForm_SiteAddressPostalCodeS from "@salesforce/label/c.SiteGuidedForm_SiteAddressPostalCodeS";
import SiteGuidedForm_SiteAddressStreetS from "@salesforce/label/c.SiteGuidedForm_SiteAddressStreetS";
import SiteGuidedForm_SortingOptions from "@salesforce/label/c.SiteGuidedForm_SortingOptions";
import SiteGuidedForm_StartDateCannotBeAfterContract from "@salesforce/label/c.SiteGuidedForm_StartDateCannotBeAfterContract";
import SiteGuidedForm_StartDateEnterWhenJoiningEnd from "@salesforce/label/c.SiteGuidedForm_StartDateEnterWhenJoiningEnd";
import SiteGuidedForm_StartDateMissingCheckContractEnd from "@salesforce/label/c.SiteGuidedForm_StartDateMissingCheckContractEnd";
import SiteGuidedForm_StartDatePleaseEnter from "@salesforce/label/c.SiteGuidedForm_StartDatePleaseEnter";
import SiteGuidedForm_SubmitForm from "@salesforce/label/c.SiteGuidedForm_SubmitForm";
import SiteGuidedForm_ThisRow from "@salesforce/label/c.SiteGuidedForm_ThisRow";
import SiteGuidedForm_UnableToDeleteSelectedRows from "@salesforce/label/c.SiteGuidedForm_UnableToDeleteSelectedRows";
import SiteGuidedForm_UnableToLoadAccountCodeVerification from "@salesforce/label/c.SiteGuidedForm_UnableToLoadAccountCodeVerification";
import SiteGuidedForm_UnableToVerifyAccountCodeDo from "@salesforce/label/c.SiteGuidedForm_UnableToVerifyAccountCodeDo";
import SiteGuidedForm_VerificationBlocked from "@salesforce/label/c.SiteGuidedForm_VerificationBlocked";
import SiteGuidedForm_VerificationFailed from "@salesforce/label/c.SiteGuidedForm_VerificationFailed";
import SiteGuidedForm_VerificationRequired from "@salesforce/label/c.SiteGuidedForm_VerificationRequired";
import SiteManager_Name from "@salesforce/label/c.SiteManager_Name";
import UI_Loading from "@salesforce/label/c.UI_Loading";
import Common_Next from "@salesforce/label/c.Common_Next";

const LABELS = {
  SiteGuidedForm_LoadingSites,
  SiteGuidedForm_ProcessedOfSites,
  SiteGuidedForm_Processing,
  SiteGuidedForm_SalesforceOpportunityId,
  SiteGuidedForm_ThisShouldOnly,
  SiteGuidedForm_WeAreWorking,
  SiteGuidedForm_WellKeepWorking,
  SiteGuidedForm_AllRequiredFields,
  Common_AddAtRenewal: Common_AddAtRenewal,
  Common_AddToMainFixedContractBlend: Common_AddToMainFixedContractBlend,
  Common_AddToMainFixedContractLatest: Common_AddToMainFixedContractLatest,
  Common_AddToMainFlexContract: Common_AddToMainFlexContract,
  Common_AnnualConsumption: Common_AnnualConsumption,
  Common_Approve: Common_Approve,
  Common_Cancel: Common_Cancel,
  Common_Country: Common_Country,
  Common_Failed: Common_Failed,
  Common_Id: Common_Id,
  Common_MarketIdentifier: Common_MarketIdentifier,
  Common_MessageErrorTitle: Common_MessageErrorTitle,
  Common_MessageSuccessTitle: Common_MessageSuccessTitle,
  Common_OpportunityIDIsMissing: Common_OpportunityIDIsMissing,
  Common_PaymentTerm: Common_PaymentTerm,
  Common_Previous: Common_Previous,
  Common_PostalCode: Common_PostalCode,
  Common_Reject: Common_Reject,
  Common_ServiceType: Common_ServiceType,
  Common_ShortFixedTermCoterminousEnd: Common_ShortFixedTermCoterminousEnd,
  Common_SiteName: Common_SiteName,
  Common_SitesApprovedSuccessfully: Common_SitesApprovedSuccessfully,
  Common_SitesRejectedSuccessfully: Common_SitesRejectedSuccessfully,
  Common_Street: Common_Street,
  Common_Submitting: Common_Submitting,
  Common_TPIMargin: Common_TPIMargin,
  Common_TaxExemption: Common_TaxExemption,
  Common_UnableToUpdateSiteApprovalStatus:
    Common_UnableToUpdateSiteApprovalStatus,
  Common_Verify: Common_Verify,
  ContractManager_Product: ContractManager_Product,
  ContractManager_Sites: ContractManager_Sites,
  ContractManager_Value: ContractManager_Value,
  QuoteHeader_EndDate: QuoteHeader_EndDate,
  QuoteHeader_StartDate: QuoteHeader_StartDate,
  SiteGuidedForm_AccountCode: SiteGuidedForm_AccountCode,
  SiteGuidedForm_AccountCodeValidationFailed3Times:
    SiteGuidedForm_AccountCodeValidationFailed3Times,
  SiteGuidedForm_AccountCodeVerification:
    SiteGuidedForm_AccountCodeVerification,
  SiteGuidedForm_AccountIDIsMissing: SiteGuidedForm_AccountIDIsMissing,
  SiteGuidedForm_Apply: SiteGuidedForm_Apply,
  SiteGuidedForm_ApplyValueToSelectedRows:
    SiteGuidedForm_ApplyValueToSelectedRows,
  SiteGuidedForm_Completed: SiteGuidedForm_Completed,
  SiteGuidedForm_ConfirmRowDeletion: SiteGuidedForm_ConfirmRowDeletion,
  SiteGuidedForm_DatesWillBeAutomaticallyCalculatedFrom:
    SiteGuidedForm_DatesWillBeAutomaticallyCalculatedFrom,
  SiteGuidedForm_DatesWillBeCalculatedFromContract:
    SiteGuidedForm_DatesWillBeCalculatedFromContract,
  SiteGuidedForm_DeleteRow: SiteGuidedForm_DeleteRow,
  SiteGuidedForm_EndDateContractEndDateMissing:
    SiteGuidedForm_EndDateContractEndDateMissing,
  SiteGuidedForm_EndDateMissingCheckContractEnd:
    SiteGuidedForm_EndDateMissingCheckContractEnd,
  SiteGuidedForm_EndDatePleaseEnterOrSet:
    SiteGuidedForm_EndDatePleaseEnterOrSet,
  SiteGuidedForm_EndDateWillMatchTheMain:
    SiteGuidedForm_EndDateWillMatchTheMain,
  SiteGuidedForm_EnterTheAccountCodeToContinue:
    SiteGuidedForm_EnterTheAccountCodeToContinue,
  SiteGuidedForm_ErrorInSaveFlow: SiteGuidedForm_ErrorInSaveFlow,
  SiteGuidedForm_ErrorLoadingProperties: SiteGuidedForm_ErrorLoadingProperties,
  SiteGuidedForm_ErrorLoadingSubmitAccessInfo:
    SiteGuidedForm_ErrorLoadingSubmitAccessInfo,
  SiteGuidedForm_ErrorPollingJobStatus: SiteGuidedForm_ErrorPollingJobStatus,
  SiteGuidedForm_ErrorSavingRecords: SiteGuidedForm_ErrorSavingRecords,
  SiteGuidedForm_ErrorSubmittingForm: SiteGuidedForm_ErrorSubmittingForm,
  SiteGuidedForm_FormSubmittedPropertiesAreBeingPosted:
    SiteGuidedForm_FormSubmittedPropertiesAreBeingPosted,
  SiteGuidedForm_FormSubmittedSuccessfully:
    SiteGuidedForm_FormSubmittedSuccessfully,
  SiteGuidedForm_FormValidationFailed: SiteGuidedForm_FormValidationFailed,
  SiteGuidedForm_JobFailed: SiteGuidedForm_JobFailed,
  SiteGuidedForm_JoinAtRenewal: SiteGuidedForm_JoinAtRenewal,
  SiteGuidedForm_JoinMainContract: SiteGuidedForm_JoinMainContract,
  SiteGuidedForm_MPANOrMPRNAtLeastOne: SiteGuidedForm_MPANOrMPRNAtLeastOne,
  SiteGuidedForm_MaxPollingAttemptsReached:
    SiteGuidedForm_MaxPollingAttemptsReached,
  SiteGuidedForm_MissingRequiredFieldEndDate:
    SiteGuidedForm_MissingRequiredFieldEndDate,
  SiteGuidedForm_MissingRequiredFieldMarketIdentifier:
    SiteGuidedForm_MissingRequiredFieldMarketIdentifier,
  SiteGuidedForm_MissingRequiredFieldPaymentTerm:
    SiteGuidedForm_MissingRequiredFieldPaymentTerm,
  SiteGuidedForm_MissingRequiredFieldProduct:
    SiteGuidedForm_MissingRequiredFieldProduct,
  SiteGuidedForm_MissingRequiredFieldServiceType:
    SiteGuidedForm_MissingRequiredFieldServiceType,
  SiteGuidedForm_MissingRequiredFieldStartDate:
    SiteGuidedForm_MissingRequiredFieldStartDate,
  SiteGuidedForm_MissingRequiredFieldTPIMargin:
    SiteGuidedForm_MissingRequiredFieldTPIMargin,
  SiteGuidedForm_MissingRequiredFieldTaxExemption:
    SiteGuidedForm_MissingRequiredFieldTaxExemption,
  SiteGuidedForm_NoJobIDAvailableForPolling:
    SiteGuidedForm_NoJobIDAvailableForPolling,
  SiteGuidedForm_PleaseProvideMPANOrMPRNNot:
    SiteGuidedForm_PleaseProvideMPANOrMPRNNot,
  SiteGuidedForm_PleaseSaveYourTableEditsBefore:
    SiteGuidedForm_PleaseSaveYourTableEditsBefore,
  SiteGuidedForm_PropertyAndServicePointRecordsUpdated:
    SiteGuidedForm_PropertyAndServicePointRecordsUpdated,
  SiteGuidedForm_RejectedByPrimaryContact:
    SiteGuidedForm_RejectedByPrimaryContact,
  SiteGuidedForm_SaveRequired: SiteGuidedForm_SaveRequired,
  SiteGuidedForm_ShortTermContract: SiteGuidedForm_ShortTermContract,
  SiteGuidedForm_SiteAdditionJoinAtRenewal:
    SiteGuidedForm_SiteAdditionJoinAtRenewal,
  SiteGuidedForm_SiteAdditionJoinMainContract:
    SiteGuidedForm_SiteAdditionJoinMainContract,
  SiteGuidedForm_SiteAdditionShortTermContract:
    SiteGuidedForm_SiteAdditionShortTermContract,
  SiteGuidedForm_SiteAddressCityS: SiteGuidedForm_SiteAddressCityS,
  SiteGuidedForm_SiteAddressPostalCodeS: SiteGuidedForm_SiteAddressPostalCodeS,
  SiteGuidedForm_SiteAddressStreetS: SiteGuidedForm_SiteAddressStreetS,
  SiteGuidedForm_SortingOptions: SiteGuidedForm_SortingOptions,
  SiteGuidedForm_StartDateCannotBeAfterContract:
    SiteGuidedForm_StartDateCannotBeAfterContract,
  SiteGuidedForm_StartDateEnterWhenJoiningEnd:
    SiteGuidedForm_StartDateEnterWhenJoiningEnd,
  SiteGuidedForm_StartDateMissingCheckContractEnd:
    SiteGuidedForm_StartDateMissingCheckContractEnd,
  SiteGuidedForm_StartDatePleaseEnter: SiteGuidedForm_StartDatePleaseEnter,
  SiteGuidedForm_SubmitForm: SiteGuidedForm_SubmitForm,
  SiteGuidedForm_ThisRow: SiteGuidedForm_ThisRow,
  SiteGuidedForm_UnableToDeleteSelectedRows:
    SiteGuidedForm_UnableToDeleteSelectedRows,
  SiteGuidedForm_UnableToLoadAccountCodeVerification:
    SiteGuidedForm_UnableToLoadAccountCodeVerification,
  SiteGuidedForm_UnableToVerifyAccountCodeDo:
    SiteGuidedForm_UnableToVerifyAccountCodeDo,
  SiteGuidedForm_VerificationBlocked: SiteGuidedForm_VerificationBlocked,
  SiteGuidedForm_VerificationFailed: SiteGuidedForm_VerificationFailed,
  SiteGuidedForm_VerificationRequired: SiteGuidedForm_VerificationRequired,
  SiteManager_Name: SiteManager_Name,
  UI_Loading: UI_Loading,
  Common_Next: Common_Next
};

const SITE_ADDITION_TYPES = {
  ADD_AT_RENEWAL_NEW: Common_AddAtRenewal,
  ADD_AT_RENEWAL_OLD: SiteGuidedForm_SiteAdditionJoinAtRenewal,
  MAIN_FLEX_NEW: Common_AddToMainFlexContract,
  MAIN_FIXED_LATEST_NEW: Common_AddToMainFixedContractLatest,
  MAIN_FIXED_BLEND_NEW: Common_AddToMainFixedContractBlend,
  MAIN_JOIN_OLD: SiteGuidedForm_SiteAdditionJoinMainContract,
  SHORT_FIXED_NEW: Common_ShortFixedTermCoterminousEnd,
  SHORT_TERM_OLD: SiteGuidedForm_SiteAdditionShortTermContract
};

const MAIN_CONTRACT_TYPES = new Set([
  SITE_ADDITION_TYPES.MAIN_FLEX_NEW,
  SITE_ADDITION_TYPES.MAIN_FIXED_LATEST_NEW,
  SITE_ADDITION_TYPES.MAIN_FIXED_BLEND_NEW,
  SITE_ADDITION_TYPES.MAIN_JOIN_OLD,
  SITE_ADDITION_TYPES.SHORT_FIXED_NEW,
  SITE_ADDITION_TYPES.SHORT_TERM_OLD
]);

const PAGE_SIZE_OPTIONS = [
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" }
];

function isAddAtRenewalType(siteAdditionType) {
  return (
    siteAdditionType === SITE_ADDITION_TYPES.ADD_AT_RENEWAL_NEW ||
    siteAdditionType === SITE_ADDITION_TYPES.ADD_AT_RENEWAL_OLD
  );
}

export default class SiteGuidedForm extends LightningElement {
  get labels() {
    return LABELS;
  }

  /**
   * Internal storage for recordId and explicit opportunity context.
   */
  _recordId;
  _opportunityId;

  @api enableApproval = false;

  /**
   * Input property: Record ID (Account ID from page context)
   * Automatically populated when placed on an Account record page
   * Setter triggers loadSites() whenever the value changes
   */
  @api
  get recordId() {
    return this._recordId;
  }
  set recordId(value) {
    this._recordId = value;
    if (value) {
      this.resetAccountCodeVerification();
      this.loadExpectedAccountCode();
      this.loadSites();
      this.loadSubmitAccessInfo();
    }
  }

  @api
  get opportunityId() {
    return this._opportunityId;
  }
  set opportunityId(value) {
    this._opportunityId = value;
    if (value) {
      this.resetAccountCodeVerification();
      this.loadExpectedAccountCode();
      this.loadSites();
      this.loadSubmitAccessInfo();
    }
  }

  /**
   * Fallback: capture recordId from the current page when not passed by a parent
   */
  @wire(CurrentPageReference)
  handlePageReference(pageRef) {
    if (!pageRef || this._recordId) {
      return;
    }
    const pageRecordId =
      pageRef.state?.recordId || pageRef.attributes?.recordId;
    if (pageRecordId) {
      this._recordId = pageRecordId;
      this.resetAccountCodeVerification();
      this.loadExpectedAccountCode();
      this.loadSites();
      if (typeof pageRecordId === "string" && pageRecordId.startsWith("006")) {
        this._opportunityId = pageRecordId;
        this.resetAccountCodeVerification();
        this.loadExpectedAccountCode();
        this.loadSubmitAccessInfo();
      }
    } else {
      /* No recordId available from page context — component will remain in an empty state. */
    }
  }

  /**
   * All Site records for Opportunities with Site_Addition flag
   * Populated from getSitesByOpportunity() apex call
   */
  sites = [];

  /**
   * Draft values from inline datatable edits
   */
  draftValues = [];

  /**
   * Loading indicator - true while fetching Sites from Salesforce
   */
  loading = false;

  /**
   * Saving indicator - true while saving changes
   */
  saving = false;

  /**
   * Submitting indicator - true while form is being submitted to handler
   */
  submitting = false;

  /**
   * Job ID for tracking async progress
   */
  asyncJobId = null;

  /**
   * Polling interval ID for cleanup
   */
  pollingIntervalId = null;

  /**
   * Object to track missing required fields per site
   * Key: Site ID, Value: Array of missing field names
   */
  missingFieldsBySite = {};

  /**
   * Flag to show validation section after save
   */
  @track showValidationMessage = false;

  /**
   * Flag to track if validation has been performed
   * Prevents showing success section on initial load
   */
  @track validationPerformed = false;

  /**
   * Flag to show success message after successful submission
   */
  @track showSuccessMessage = false;

  /**
   * Server-side validation errors returned on submit
   */
  @track serverValidationErrors = [];

  /**
   * Progress tracking for success message
   */
  @track progressPercentage = 0;
  @track processedCount = 0;
  @track totalCount = 0;
  @track selectedRowIds = [];
  @track currentPage = 1;
  @track pageSize = "20";
  @track showBulkUpdateModal = false;
  @track bulkUpdateApplySelected = false;
  @track bulkUpdateField = "";
  @track bulkUpdateValue = "";
  suppressNextBulkModal = false;

  isPortfolioOwner = false;
  isSiteManager = false;
  canSubmit = false;
  isPartnerCommunityProfile = false;
  expectedAccountCode = null;
  accountCodeVerified = false;
  accountCodeAttempts = 0;
  maxAccountCodeAttempts = 3;
  showAccountCodePrompt = false;
  accountCodeInput = "";
  accountCodeError = "";
  accountCodeLockoutMessage = "";
  pendingAccountCodeResolver = null;

  /**
   * Field configuration based on Site Addition Type
   * Controls visibility and editability of date fields
   * Structure: { fieldName: { visible: boolean, editable: boolean, readOnly: boolean } }
   */
  fieldConfig = {
    startDate: { visible: true, editable: true, readOnly: false },
    endDate: { visible: true, editable: true, readOnly: false }
  };

  /**
   * Info message to display based on Site Addition Type
   * Guides user on date handling for their specific type
   */
  fieldConfigMessage = "";

  /**
   * Datatable column configuration with inline editing enabled
   * Displays all property and service point fields for comprehensive data management
   */
  columns = [
    {
      label: "",
      type: "button-icon",
      initialWidth: 44,
      fixedWidth: 44,
      typeAttributes: {
        name: "delete",
        iconName: "utility:delete",
        title: SiteGuidedForm_DeleteRow,
        alternativeText: SiteGuidedForm_DeleteRow,
        variant: "bare",
        disabled: false
      },
      cellAttributes: {
        alignment: "center"
      }
    },
    {
      label: Common_SiteName,
      fieldName: "propertyUrl",
      type: "url",
      editable: false,
      typeAttributes: {
        label: { fieldName: SiteManager_Name },
        target: "_self"
      }
    },
    {
      label: Common_Street,
      fieldName: SiteGuidedForm_SiteAddressStreetS,
      type: "text",
      editable: true,
      cellAttributes: {
        class: { fieldName: "streetClass" },
        iconName: { fieldName: "streetIcon" },
        iconAlternativeText: { fieldName: "streetErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_PostalCode,
      fieldName: SiteGuidedForm_SiteAddressPostalCodeS,
      type: "text",
      editable: true,
      cellAttributes: {
        class: { fieldName: "postalCodeClass" },
        iconName: { fieldName: "postalCodeIcon" },
        iconAlternativeText: { fieldName: "postalCodeErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_Country,
      fieldName: SiteGuidedForm_SiteAddressCityS,
      type: "text",
      editable: true,
      cellAttributes: {
        class: { fieldName: "cityClass" },
        iconName: { fieldName: "cityIcon" },
        iconAlternativeText: { fieldName: "cityErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_MarketIdentifier,
      fieldName: "servicePointUrl",
      type: "url",
      editable: false,
      typeAttributes: {
        label: { fieldName: "Market_Identifier__c" },
        target: "_self"
      },
      cellAttributes: {
        class: { fieldName: "marketIdentifierClass" },
        iconName: { fieldName: "marketIdentifierIcon" },
        iconAlternativeText: { fieldName: "marketIdentifierErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_ServiceType,
      fieldName: "Service_Type__c",
      type: "text",
      editable: true,
      cellAttributes: {
        class: { fieldName: "serviceTypeClass" },
        iconName: { fieldName: "serviceTypeIcon" },
        iconAlternativeText: { fieldName: "serviceTypeErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_AnnualConsumption,
      fieldName: "Annual_Consumption__c",
      type: "text",
      editable: true
    },
    {
      label: QuoteHeader_StartDate,
      fieldName: "Start_Date__c",
      type: "date",
      editable: true,
      cellAttributes: {
        class: { fieldName: "startDateClass" },
        iconName: { fieldName: "startDateIcon" },
        iconAlternativeText: { fieldName: "startDateErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: QuoteHeader_EndDate,
      fieldName: "End_Date__c",
      type: "date",
      editable: true,
      cellAttributes: {
        class: { fieldName: "endDateClass" },
        iconName: { fieldName: "endDateIcon" },
        iconAlternativeText: { fieldName: "endDateErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: ContractManager_Product,
      fieldName: "Product__c",
      type: "text",
      editable: true,
      cellAttributes: {
        class: { fieldName: "productClass" },
        iconName: { fieldName: "productIcon" },
        iconAlternativeText: { fieldName: "productErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_TPIMargin,
      fieldName: "Margin_Value__c",
      type: "number",
      editable: true,
      cellAttributes: {
        class: { fieldName: "marginValueClass" },
        iconName: { fieldName: "marginValueIcon" },
        iconAlternativeText: { fieldName: "marginValueErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_TaxExemption,
      fieldName: "Tax_Exemption__c",
      type: "number",
      editable: true,
      cellAttributes: {
        class: { fieldName: "taxExemptionClass" },
        iconName: { fieldName: "taxExemptionIcon" },
        iconAlternativeText: { fieldName: "taxExemptionErrorTooltip" },
        iconPosition: "right"
      }
    },
    {
      label: Common_PaymentTerm,
      fieldName: "Payment_Term__c",
      type: "number",
      editable: true,
      typeAttributes: {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      },
      cellAttributes: {
        class: { fieldName: "paymentTermClass" },
        iconName: { fieldName: "paymentTermIcon" },
        iconAlternativeText: { fieldName: "paymentTermErrorTooltip" },
        iconPosition: "right"
      }
    }
  ];

  columnVisibilityOptions = [
    { label: Common_Street, value: SiteGuidedForm_SiteAddressStreetS },
    { label: Common_PostalCode, value: SiteGuidedForm_SiteAddressPostalCodeS },
    { label: Common_Country, value: SiteGuidedForm_SiteAddressCityS },
    { label: Common_MarketIdentifier, value: "Market_Identifier__c" },
    { label: Common_ServiceType, value: "Service_Type__c" },
    { label: Common_AnnualConsumption, value: "Annual_Consumption__c" },
    { label: QuoteHeader_StartDate, value: "Start_Date__c" },
    { label: QuoteHeader_EndDate, value: "End_Date__c" },
    { label: ContractManager_Product, value: "Product__c" },
    { label: Common_TPIMargin, value: "Margin_Value__c" },
    { label: Common_TaxExemption, value: "Tax_Exemption__c" },
    { label: Common_PaymentTerm, value: "Payment_Term__c" }
  ];

  @track visibleColumnKeys = [
    SiteGuidedForm_SiteAddressPostalCodeS,
    "Market_Identifier__c",
    "Annual_Consumption__c",
    "Start_Date__c",
    "End_Date__c",
    "Product__c"
  ];

  get visibleColumns() {
    return this.columns.filter((column) => {
      if (!column.fieldName) {
        return true;
      }
      if (column.fieldName === "propertyUrl") {
        return true;
      }
      // Market Identifier is rendered as a URL column (servicePointUrl) but is
      // toggled by the logical key Market_Identifier__c in the menu.
      if (column.fieldName === "servicePointUrl") {
        return this.visibleColumnKeys.includes("Market_Identifier__c");
      }
      return this.visibleColumnKeys.includes(column.fieldName);
    });
  }

  get columnMenuItems() {
    return this.columnVisibilityOptions.map((option) => ({
      ...option,
      checked: this.visibleColumnKeys.includes(option.value)
    }));
  }

  get pageSizeOptions() {
    return PAGE_SIZE_OPTIONS;
  }

  get totalPages() {
    return Math.max(1, Math.ceil((this.sites?.length || 0) / this.pageSize));
  }

  get paginatedSites() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.sites.slice(startIndex, startIndex + this.pageSize);
  }

  get isPreviousPageDisabled() {
    return this.currentPage <= 1;
  }

  get isNextPageDisabled() {
    return this.currentPage >= this.totalPages;
  }

  get paginationSummary() {
    if (!this.sites.length) {
      return "0-0 / 0";
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.sites.length);
    return `${start}-${end} / ${this.sites.length}`;
  }

  normalizeCurrentPage() {
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  /**
   * Fetches all Property and Service Point records for Opportunities with Site_Addition flag
   * Sets loading spinner while fetching
   * Called automatically when recordId is set and after save operations
   * Automatically validates sites after loading to restore form state
   */
  loadSites() {
    if (!this._recordId) return Promise.resolve();
    this.loading = true;
    this.serverValidationErrors = [];
    // Reset field configuration on load
    this.fieldConfig = {
      startDate: { visible: true, editable: true, readOnly: false },
      endDate: { visible: true, editable: true, readOnly: false }
    };
    this.fieldConfigMessage = "";

    const isOpportunityContext =
      this._opportunityId ||
      (typeof this._recordId === "string" && this._recordId.startsWith("006"));
    const loadAction = isOpportunityContext
      ? getPropertiesWithServicePointsForOpportunity({
          accountId: null,
          selectedOpportunityId: this._opportunityId || this._recordId
        })
      : getPropertiesWithServicePoints({ accountId: this._recordId });

    return loadAction
      .then((result) => {
        this.sites = this.decorateSiteRows(result);
        this.normalizeCurrentPage();
        // Auto-validate on load to restore form state (for page refreshes)
        this.validateAndShowMissingFields();
        this.loading = false;
      })
      .catch((err) => {
        console.error(SiteGuidedForm_ErrorLoadingProperties, err);
        this.loading = false;
      });
  }

  loadSubmitAccessInfo() {
    const targetOpportunityId = this._opportunityId || this._recordId;
    if (!targetOpportunityId) {
      return Promise.resolve();
    }

    return getSubmitAccessInfo({ opportunityId: targetOpportunityId })
      .then((result) => {
        this.isPortfolioOwner = Boolean(result?.isPortfolioOwner);
        this.isSiteManager = Boolean(result?.isSiteManager);
        this.canSubmit = Boolean(result?.canSubmit);
        this.isPartnerCommunityProfile = Boolean(
          result?.isPartnerCommunityProfile
        );
      })
      .catch((error) => {
        console.error(SiteGuidedForm_ErrorLoadingSubmitAccessInfo, error);
        this.isPortfolioOwner = false;
        this.isSiteManager = false;
        this.canSubmit = false;
        this.isPartnerCommunityProfile = false;
      });
  }

  resetAccountCodeVerification() {
    this.expectedAccountCode = null;
    this.accountCodeVerified = false;
    this.accountCodeAttempts = 0;
    this.showAccountCodePrompt = false;
    this.accountCodeInput = "";
    this.accountCodeError = "";
    this.accountCodeLockoutMessage = "";
    this.pendingAccountCodeResolver = null;
  }

  loadExpectedAccountCode() {
    const contextId = this._opportunityId || this._recordId;
    if (!contextId) {
      return Promise.resolve();
    }

    return getExpectedAccountCode({ contextId })
      .then((accountCode) => {
        this.expectedAccountCode = accountCode;
      })
      .catch((error) => {
        this.expectedAccountCode = null;
        this.accountCodeLockoutMessage =
          error?.body?.message ||
          SiteGuidedForm_UnableToLoadAccountCodeVerification;
      });
  }

  get notShowSuccessMessage() {
    return !this.showSuccessMessage;
  }

  get notShowValidationMessage() {
    return !this.showValidationMessage;
  }

  get showSiteManagerSubmit() {
    return (
      this.enableApproval &&
      this.isPartnerCommunityProfile &&
      this.isSiteManager
    );
  }

  get showPortfolioOwnerSubmit() {
    return (
      this.enableApproval &&
      this.isPartnerCommunityProfile &&
      this.isPortfolioOwner
    );
  }

  get disablePortfolioApprovalActions() {
    return this.submitting;
  }

  get disableSiteManagerSubmitButton() {
    return this.submitting || Boolean(this.accountCodeLockoutMessage);
  }

  get remainingAccountCodeAttempts() {
    const remaining = this.maxAccountCodeAttempts - this.accountCodeAttempts;
    return remaining > 0 ? remaining : 0;
  }

  get accountCodePromptHelpText() {
    return `Enter the Account Code (Account Number) to continue. Attempts remaining: ${this.remainingAccountCodeAttempts}`;
  }

  async ensureAccountCodeVerified() {
    if (this.accountCodeVerified) {
      return true;
    }

    if (this.accountCodeLockoutMessage) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: SiteGuidedForm_VerificationBlocked,
          message: this.accountCodeLockoutMessage,
          variant: "error"
        })
      );
      return false;
    }

    if (!this.expectedAccountCode) {
      await this.loadExpectedAccountCode();
    }

    if (!this.expectedAccountCode) {
      this.accountCodeLockoutMessage =
        this.accountCodeLockoutMessage ||
        SiteGuidedForm_UnableToVerifyAccountCodeDo;
      this.dispatchEvent(
        new ShowToastEvent({
          title: SiteGuidedForm_VerificationRequired,
          message: this.accountCodeLockoutMessage,
          variant: "error"
        })
      );
      return false;
    }

    return new Promise((resolve) => {
      this.pendingAccountCodeResolver = resolve;
      this.accountCodeInput = "";
      this.accountCodeError = "";
      this.showAccountCodePrompt = true;
    });
  }

  handleAccountCodeInputChange(event) {
    this.accountCodeInput = event.target.value || "";
    this.accountCodeError = "";
  }

  handleCancelAccountCodePrompt() {
    this.showAccountCodePrompt = false;
    if (this.pendingAccountCodeResolver) {
      const resolve = this.pendingAccountCodeResolver;
      this.pendingAccountCodeResolver = null;
      resolve(false);
    }
  }

  handleConfirmAccountCodePrompt() {
    const providedCode = (this.accountCodeInput || "").trim();
    const expectedCode = (this.expectedAccountCode || "").trim();

    if (!providedCode) {
      this.accountCodeError = SiteGuidedForm_EnterTheAccountCodeToContinue;
      return;
    }

    if (providedCode === expectedCode) {
      this.accountCodeVerified = true;
      this.showAccountCodePrompt = false;
      if (this.pendingAccountCodeResolver) {
        const resolve = this.pendingAccountCodeResolver;
        this.pendingAccountCodeResolver = null;
        resolve(true);
      }
      return;
    }

    this.accountCodeAttempts += 1;
    if (this.accountCodeAttempts >= this.maxAccountCodeAttempts) {
      this.accountCodeLockoutMessage =
        SiteGuidedForm_AccountCodeValidationFailed3Times;
      this.showAccountCodePrompt = false;
      this.dispatchEvent(
        new ShowToastEvent({
          title: SiteGuidedForm_VerificationFailed,
          message: this.accountCodeLockoutMessage,
          variant: "error"
        })
      );
      if (this.pendingAccountCodeResolver) {
        const resolve = this.pendingAccountCodeResolver;
        this.pendingAccountCodeResolver = null;
        resolve(false);
      }
      return;
    }

    this.accountCodeError = `Account Code is incorrect. Attempts remaining: ${this.remainingAccountCodeAttempts}`;
  }

  get processedOfSitesLabel() {
    return (this.labels.SiteGuidedForm_ProcessedOfSites || "")
      .replace("{0}", this.processedCount || 0)
      .replace("{1}", this.totalCount || 0);
  }

  get progressBarStyle() {
    return `width: ${this.progressPercentage}%`;
  }

  get bulkUpdateFieldOptions() {
    return [
      { label: Common_Street, value: SiteGuidedForm_SiteAddressStreetS },
      {
        label: Common_PostalCode,
        value: SiteGuidedForm_SiteAddressPostalCodeS
      },
      { label: Common_Country, value: SiteGuidedForm_SiteAddressCityS },
      { label: Common_MarketIdentifier, value: "Market_Identifier__c" },
      { label: Common_ServiceType, value: "Service_Type__c" },
      { label: Common_AnnualConsumption, value: "Annual_Consumption__c" },
      { label: QuoteHeader_StartDate, value: "Start_Date__c" },
      { label: QuoteHeader_EndDate, value: "End_Date__c" },
      { label: ContractManager_Product, value: "Product__c" },
      { label: Common_TPIMargin, value: "Margin_Value__c" },
      { label: Common_TaxExemption, value: "Tax_Exemption__c" },
      { label: Common_PaymentTerm, value: "Payment_Term__c" }
    ];
  }

  get bulkValueInputType() {
    if (
      this.bulkUpdateField === "Start_Date__c" ||
      this.bulkUpdateField === "End_Date__c"
    ) {
      return "date";
    }
    if (
      this.bulkUpdateField === "Annual_Consumption__c" ||
      this.bulkUpdateField === "Margin_Value__c" ||
      this.bulkUpdateField === "Tax_Exemption__c" ||
      this.bulkUpdateField === "Payment_Term__c"
    ) {
      return "number";
    }
    return "text";
  }

  get isBulkDeleteDisabled() {
    return this.loading || !this.selectedRowIds.length;
  }

  get isBulkApplyDisabled() {
    return (
      this.loading || !this.bulkUpdateField || !this.bulkUpdateApplySelected
    );
  }

  get bulkUpdateFieldLabel() {
    return (
      this.bulkUpdateFieldOptions.find(
        (option) => option.value === this.bulkUpdateField
      )?.label || ContractManager_Value
    );
  }

  get bulkUpdateSelectionLabel() {
    return `Update ${this.selectedRowIds.length} selected items`;
  }

  @api
  refreshSites() {
    return this.loadSites();
  }

  handleRowSelection(event) {
    const selectedRows = event?.detail?.selectedRows || [];
    this.selectedRowIds = selectedRows.map((row) => row.Id);
  }

  handleBulkValueChange(event) {
    this.bulkUpdateValue = event.detail.value;
  }

  handleColumnMenuSelect(event) {
    const selectedColumnKey = event?.detail?.value;
    if (!selectedColumnKey) {
      return;
    }

    if (this.visibleColumnKeys.includes(selectedColumnKey)) {
      this.visibleColumnKeys = this.visibleColumnKeys.filter(
        (key) => key !== selectedColumnKey
      );
      return;
    }
    this.visibleColumnKeys = [...this.visibleColumnKeys, selectedColumnKey];
  }

  handlePageSizeChange(event) {
    this.pageSize = Number(event.detail.value || 20);
    this.currentPage = 1;
  }

  handlePreviousPage() {
    if (this.isPreviousPageDisabled) {
      return;
    }
    this.currentPage -= 1;
  }

  handleNextPage() {
    if (this.isNextPageDisabled) {
      return;
    }
    this.currentPage += 1;
  }

  handleBulkApplySelectedToggle(event) {
    this.bulkUpdateApplySelected = event.target.checked;
  }

  handleCancelBulkModal() {
    this.closeBulkModal();
  }

  closeBulkModal() {
    this.showBulkUpdateModal = false;
    this.bulkUpdateApplySelected = false;
    this.bulkUpdateField = "";
    this.bulkUpdateValue = "";
  }

  handleApplyBulkUpdate() {
    if (this.isBulkApplyDisabled) {
      return;
    }

    const fieldName = this.bulkUpdateField;
    const selectedSet = new Set(this.selectedRowIds);
    const mergedDraftMap = new Map(
      (this.draftValues || []).map((draft) => [draft.Id, { ...draft }])
    );

    this.sites = this.sites.map((site) => {
      if (!selectedSet.has(site.Id)) {
        return site;
      }
      const draft = mergedDraftMap.get(site.Id) || { Id: site.Id };
      draft[fieldName] = this.bulkUpdateValue;
      mergedDraftMap.set(site.Id, draft);
      return { ...site, [fieldName]: this.bulkUpdateValue };
    });

    this.draftValues = Array.from(mergedDraftMap.values());
    this.validateAndShowMissingFields();
    this.suppressNextBulkModal = true;
    this.closeBulkModal();
  }

  async handleDeleteSelected() {
    if (this.isBulkDeleteDisabled) {
      return;
    }

    const selectedSet = new Set(this.selectedRowIds);
    const selectedRows = this.sites.filter((site) => selectedSet.has(site.Id));
    if (!selectedRows.length) {
      return;
    }

    const confirmed = await this.confirmDeletion(selectedRows.length, true);
    if (!confirmed) {
      return;
    }

    this.performDeleteRows(selectedRows);
  }

  performDeleteRows(rows) {
    this.loading = true;
    this.serverValidationErrors = [];

    const deletionPromises = rows.map((row) =>
      deleteSiteRowRecords({
        propertyId: row.Id,
        associationId: row.Association_Id__c || null,
        opportunityId: row.Opportunity__c || null
      })
    );

    Promise.all(deletionPromises)
      .then(() => this.loadSites())
      .then(() => {
        const deletedSet = new Set(rows.map((row) => row.Id));
        this.selectedRowIds = this.selectedRowIds.filter(
          (id) => !deletedSet.has(id)
        );
        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageSuccessTitle,
            message: `${rows.length} row(s) deleted successfully.`,
            variant: "success"
          })
        );
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageErrorTitle,
            message:
              error?.body?.message || SiteGuidedForm_UnableToDeleteSelectedRows,
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.loading = false;
      });
  }

  /**
   * Configures field visibility and editability based on Site Addition Type
   * Updates fieldConfig and fieldConfigMessage accordingly
   *
   * @param {string} siteAdditionType The Site_Addition_Type__c value
   */
  configureFieldsForType(siteAdditionType) {
    // Reset to default configuration
    this.fieldConfig = {
      startDate: { visible: true, editable: true, readOnly: false },
      endDate: { visible: true, editable: true, readOnly: false }
    };
    this.fieldConfigMessage = "";

    // Configure based on Site Addition Type
    if (isAddAtRenewalType(siteAdditionType)) {
      // For Join at Renewal: dates are auto-calculated
      // COMMENTED OUT: Future feature to make dates read-only or hidden
      // this.fieldConfig.startDate = { visible: true, editable: false, readOnly: true };
      // this.fieldConfig.endDate = { visible: true, editable: false, readOnly: true };
      // this.fieldConfigMessage = SiteGuidedForm_DatesWillBeAutomaticallyCalculatedFrom;

      // Currently: Show dates as editable (user can override if needed)
      this.fieldConfigMessage =
        SiteGuidedForm_DatesWillBeCalculatedFromContract;
    } else if (MAIN_CONTRACT_TYPES.has(siteAdditionType)) {
      // For Join Main Contract: user enters start date, end date from contract
      // COMMENTED OUT: Future feature to make end date read-only when contract is linked
      // this.fieldConfig.startDate = { visible: true, editable: true, readOnly: false };
      // this.fieldConfig.endDate = { visible: true, editable: false, readOnly: true };
      // this.fieldConfigMessage = SiteGuidedForm_StartDateEnterWhenJoiningEnd;

      // Currently: Show both as editable
      this.fieldConfigMessage = SiteGuidedForm_EndDateWillMatchTheMain;
    } else {
      // Default for unknown types
      this.fieldConfigMessage = "";
    }
  }

  /**
   * Gets field config for a specific site (used in template)
   * COMMENTED OUT: Future feature for dynamic field visibility in template
   */
  // getFieldConfigForSite(siteId) {
  //     const site = this.sites.find(s => s.Id === siteId);
  //     if (site) {
  //         this.configureFieldsForType(site.Site_Addition_Type__c);
  //     }
  //     return this.fieldConfig;
  // }

  /**
   * Handles inline datatable save event
   * Saves all edited rows to Salesforce (Property and Service Point)
   *
   * @param {CustomEvent} event Event object containing draft values
   */
  handleSave(event) {
    const draftValues = event.detail.draftValues;
    this.saving = true;
    this.serverValidationErrors = [];

    // Build save promises for each draft
    const savePromises = draftValues.map((draft) => {
      const originalSite = this.sites.find((site) => site.Id === draft.Id);
      // Helper function to get field value, ensuring proper type conversion
      const getFieldValue = (fieldName) => {
        if (Object.prototype.hasOwnProperty.call(draft, fieldName)) {
          const val = draft[fieldName];
          // For decimal fields, ensure proper conversion
          if (
            fieldName === "Annual_Consumption__c" &&
            val !== null &&
            val !== undefined &&
            val !== ""
          ) {
            const normalizedValue =
              typeof val === "string" ? val.replace(/,/g, "") : val;
            const numVal = Number(normalizedValue);
            return isNaN(numVal) ? originalSite[fieldName] : numVal;
          }
          return val;
        }
        return originalSite[fieldName];
      };

      // Helper for date fields
      const getDateValue = (fieldName) => {
        if (Object.prototype.hasOwnProperty.call(draft, fieldName)) {
          return draft[fieldName] || null;
        }
        return originalSite[fieldName] || null;
      };

      const getDecimalValue = (fieldName) => {
        const rawValue = Object.prototype.hasOwnProperty.call(draft, fieldName)
          ? draft[fieldName]
          : originalSite[fieldName];
        if (rawValue === null || rawValue === undefined || rawValue === "") {
          return null;
        }
        const normalized =
          typeof rawValue === "string"
            ? rawValue.replace(/,/g, "").trim()
            : rawValue;
        const numericValue = Number(normalized);
        return Number.isNaN(numericValue) ? null : numericValue;
      };

      const getIntegerValue = (fieldName, maxDigits) => {
        const rawValue = Object.prototype.hasOwnProperty.call(draft, fieldName)
          ? draft[fieldName]
          : originalSite[fieldName];
        if (rawValue === null || rawValue === undefined || rawValue === "") {
          return null;
        }

        const normalized =
          typeof rawValue === "string"
            ? rawValue.replace(/,/g, "").trim()
            : String(rawValue);

        if (!/^\d+$/.test(normalized)) {
          return null;
        }
        if (maxDigits && normalized.length > maxDigits) {
          return null;
        }
        const numericValue = Number(normalized);
        if (!Number.isInteger(numericValue)) {
          return null;
        }
        return numericValue;
      };

      return updatePropertyAndServicePoint({
        propertyId: draft.Id,
        servicePointId: originalSite.Service_Point_Id__c,
        associationId: originalSite.Association_Id__c || null,
        opportunityId: originalSite.Opportunity__c || null,
        street: getFieldValue(SiteGuidedForm_SiteAddressStreetS),
        city: getFieldValue(SiteGuidedForm_SiteAddressCityS),
        postalCode: getFieldValue(SiteGuidedForm_SiteAddressPostalCodeS),
        // Old Site-based field mapping (commented out)
        // marketIdentifier: getFieldValue('MPAN__c'),
        // serviceType: getFieldValue('Meter_Type__c'),
        // New Property/Service Point field mapping
        marketIdentifier: getFieldValue("Market_Identifier__c"),
        serviceType: getFieldValue("Service_Type__c"),
        annualConsumption: getFieldValue("Annual_Consumption__c"),
        startDate: getDateValue("Start_Date__c"),
        endDate: getDateValue("End_Date__c"),
        product: getFieldValue("Product__c"),
        marginValue: getDecimalValue("Margin_Value__c"),
        taxExemption: getDecimalValue("Tax_Exemption__c"),
        paymentTerm: getIntegerValue("Payment_Term__c", 3)
      });
    });

    // Execute all saves
    Promise.all(savePromises)
      .then(() => {
        // Success - reload data
        const isOpportunityContext =
          this._opportunityId ||
          (typeof this._recordId === "string" &&
            this._recordId.startsWith("006"));
        return isOpportunityContext
          ? getPropertiesWithServicePointsForOpportunity({
              accountId: null,
              selectedOpportunityId: this._opportunityId || this._recordId
            })
          : getPropertiesWithServicePoints({ accountId: this._recordId });
      })
      .then((freshData) => {
        // Update sites with fresh data
        this.sites = this.decorateSiteRows(freshData);
        this.normalizeCurrentPage();
        // Clear draft values
        this.draftValues = [];

        // Validate sites and show missing fields
        this.validateAndShowMissingFields();
        this.serverValidationErrors = [];

        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageSuccessTitle,
            message: SiteGuidedForm_PropertyAndServicePointRecordsUpdated,
            variant: "success"
          })
        );
      })
      .catch((error) => {
        console.error(SiteGuidedForm_ErrorInSaveFlow, error);
        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageErrorTitle,
            message: error.body?.message || SiteGuidedForm_ErrorSavingRecords,
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.saving = false;
      });
  }

  decorateSiteRows(rows = []) {
    return rows.map((row) => ({
      ...row,
      propertyUrl: row?.Id ? `/${row.Id}` : null,
      servicePointUrl: row?.Service_Point_Id__c
        ? `/${row.Service_Point_Id__c}`
        : null
    }));
  }

  handleCellChange(event) {
    const changedDrafts = event.detail?.draftValues || [];
    if (!changedDrafts.length) {
      return;
    }

    // Keep draft edits accumulated across multiple cell changes.
    const mergedDraftMap = new Map();
    (this.draftValues || []).forEach((draft) =>
      mergedDraftMap.set(draft.Id, { ...draft })
    );
    changedDrafts.forEach((draft) => {
      const existing = mergedDraftMap.get(draft.Id) || { Id: draft.Id };
      mergedDraftMap.set(draft.Id, { ...existing, ...draft });
    });
    this.draftValues = Array.from(mergedDraftMap.values());

    // Reflect draft values in the currently displayed rows so validation icons update immediately.
    const draftById = new Map(
      this.draftValues.map((draft) => [draft.Id, draft])
    );
    this.sites = this.sites.map((site) => {
      const draft = draftById.get(site.Id);
      return draft ? { ...site, ...draft } : site;
    });

    const firstDraft = changedDrafts[0];
    const changedFields = Object.keys(firstDraft || {}).filter(
      (key) => key !== Common_Id
    );
    const editedField = changedFields.length === 1 ? changedFields[0] : null;
    const editedValue = editedField ? firstDraft[editedField] : null;
    const selectedSet = new Set(this.selectedRowIds);
    const editedRowSelected = firstDraft?.Id && selectedSet.has(firstDraft.Id);
    const skipModalForThisEdit = this.suppressNextBulkModal;
    this.suppressNextBulkModal = false;

    if (
      !skipModalForThisEdit &&
      !this.showBulkUpdateModal &&
      editedField &&
      this.selectedRowIds.length > 1 &&
      editedRowSelected &&
      this.bulkUpdateFieldOptions.some((option) => option.value === editedField)
    ) {
      this.bulkUpdateField = editedField;
      this.bulkUpdateValue = editedValue;
      this.bulkUpdateApplySelected = true;
      this.showBulkUpdateModal = true;
    }

    this.validateAndShowMissingFields();
  }

  async handleRowAction(event) {
    const actionName = event?.detail?.action?.name;
    const row = event?.detail?.row;
    if (actionName !== "delete" || !row?.Id) {
      return;
    }

    const selectedSet = new Set(this.selectedRowIds);
    const shouldDeleteSelection =
      this.selectedRowIds.length > 1 && selectedSet.has(row.Id);
    const rowsToDelete = shouldDeleteSelection
      ? this.sites.filter((site) => selectedSet.has(site.Id))
      : [row];

    const confirmed = await this.confirmDeletion(
      rowsToDelete.length,
      shouldDeleteSelection
    );
    if (!confirmed) {
      return;
    }
    this.performDeleteRows(rowsToDelete);
  }

  async confirmDeletion(rowCount, isBulk) {
    const scopeLabel = isBulk
      ? `${rowCount} selected row(s)`
      : SiteGuidedForm_ThisRow;
    return LightningConfirm.open({
      label: SiteGuidedForm_ConfirmRowDeletion,
      message: `Delete ${scopeLabel}? This removes related association, property, service point, and site records.`,
      variant: "headerless"
    });
  }

  /**
   * Validates all sites and identifies missing required fields
   * Shows validation message section if any fields are missing
   *
   * Required fields per site:
   *   - Site_Address__Street__s
   *   - Site_Address__City__s
   *   - Site_Address__PostalCode__s
   *   - Market_Identifier__c
   *   - Service_Type__c
   *   - Start_Date__c and End_Date__c (validation based on Site Addition Type):
   *     * SiteGuidedForm_JoinAtRenewal: Both auto-calculated, validates they exist
   *     * SiteGuidedForm_JoinMainContract / SiteGuidedForm_ShortTermContract: Start Date required from user, End Date from contract
   *     * Start Date must not be after End Date for all types
   */
  validateAndShowMissingFields() {
    this.missingFieldsBySite = {};
    let hasAnyMissingFields = false;
    let lastSiteAdditionType = null;
    const enrichedSites = [];

    for (let index = 0; index < this.sites.length; index++) {
      const site = this.sites[index];
      const missingFields = [];
      const missingFlags = {
        street: false,
        city: false,
        postalCode: false,
        marketIdentifier: false,
        serviceType: false,
        startDate: false,
        endDate: false,
        product: false,
        marginValue: false,
        taxExemption: false,
        paymentTerm: false
      };

      if (site.Site_Addition_Type__c !== lastSiteAdditionType) {
        this.configureFieldsForType(site.Site_Addition_Type__c);
        lastSiteAdditionType = site.Site_Addition_Type__c;
      }

      // Old Site-based validation (commented out)
      // Check MPAN/MPRN - exactly one required
      // const hasMpan = site.MPAN__c && site.MPAN__c.trim().length > 0;
      // const hasMprn = site.MPRN__c && site.MPRN__c.trim().length > 0;
      // if (!hasMpan && !hasMprn) {
      //     missingFields.push(SiteGuidedForm_MPANOrMPRNAtLeastOne);
      // }
      // if (hasMpan && hasMprn) {
      //     missingFields.push(SiteGuidedForm_PleaseProvideMPANOrMPRNNot);
      // }

      // New Property/Service Point validation
      if (
        !site.Market_Identifier__c ||
        site.Market_Identifier__c.trim().length === 0
      ) {
        missingFields.push(Common_MarketIdentifier);
        missingFlags.marketIdentifier = true;
      }
      if (!site.Service_Type__c || site.Service_Type__c.trim().length === 0) {
        missingFields.push(Common_ServiceType);
        missingFlags.serviceType = true;
      }
      if (!site.Product__c || site.Product__c.trim().length === 0) {
        missingFields.push(ContractManager_Product);
        missingFlags.product = true;
      }
      if (
        site.Margin_Value__c === null ||
        site.Margin_Value__c === undefined ||
        site.Margin_Value__c === ""
      ) {
        missingFields.push(Common_TPIMargin);
        missingFlags.marginValue = true;
      }
      if (
        site.Tax_Exemption__c === null ||
        site.Tax_Exemption__c === undefined ||
        site.Tax_Exemption__c === ""
      ) {
        missingFields.push(Common_TaxExemption);
        missingFlags.taxExemption = true;
      }
      if (
        site.Payment_Term__c === null ||
        site.Payment_Term__c === undefined ||
        site.Payment_Term__c === ""
      ) {
        missingFields.push(Common_PaymentTerm);
        missingFlags.paymentTerm = true;
      }

      // Date validation based on Site Addition Type
      const siteAdditionType = site.Site_Addition_Type__c;

      if (isAddAtRenewalType(siteAdditionType)) {
        // For Join at Renewal, dates are auto-calculated - validate they exist
        if (!site.Start_Date__c) {
          missingFields.push(SiteGuidedForm_StartDateMissingCheckContractEnd);
          missingFlags.startDate = true;
        }
        if (!site.End_Date__c) {
          missingFields.push(SiteGuidedForm_EndDateMissingCheckContractEnd);
          missingFlags.endDate = true;
        }
      } else if (MAIN_CONTRACT_TYPES.has(siteAdditionType)) {
        // For these types, Start Date must be entered by Site Manager
        if (!site.Start_Date__c) {
          missingFields.push(SiteGuidedForm_StartDatePleaseEnter);
          missingFlags.startDate = true;
        }
        // End Date should be auto-set from contract - don't show as missing if contract has no end date
        // Only validate if Start Date is provided (to avoid double errors)
        if (!site.End_Date__c && site.Site_Addition_Contract__c) {
          missingFields.push(SiteGuidedForm_EndDateContractEndDateMissing);
          missingFlags.endDate = true;
        }
        // Validate Start Date is not after End Date
        if (site.Start_Date__c && site.End_Date__c) {
          const startDate = new Date(site.Start_Date__c);
          const endDate = new Date(site.End_Date__c);
          if (startDate > endDate) {
            missingFields.push(SiteGuidedForm_StartDateCannotBeAfterContract);
            missingFlags.startDate = true;
          }
        }
      } else {
        // Generic validation for any other types
        if (!site.Start_Date__c) {
          missingFields.push(SiteGuidedForm_StartDatePleaseEnter);
          missingFlags.startDate = true;
        }
        if (!site.End_Date__c) {
          missingFields.push(SiteGuidedForm_EndDatePleaseEnterOrSet);
          missingFlags.endDate = true;
        }
      }

      // Store missing fields for this site with row number (1-indexed)
      if (missingFields.length > 0) {
        this.missingFieldsBySite[site.Id] = {
          rowNumber: index + 1,
          fields: missingFields
        };
        hasAnyMissingFields = true;
      }

      const missingClass = "missing-required-cell";
      const hasMarketIdentifierValue = !!(
        site.Market_Identifier__c && site.Market_Identifier__c.trim()
      );
      const hasServiceTypeValue = !!(
        site.Service_Type__c && site.Service_Type__c.trim()
      );
      const hasProductValue = !!(site.Product__c && site.Product__c.trim());
      const hasMarginValue =
        site.Margin_Value__c !== null &&
        site.Margin_Value__c !== undefined &&
        site.Margin_Value__c !== "";
      const hasTaxExemptionValue =
        site.Tax_Exemption__c !== null &&
        site.Tax_Exemption__c !== undefined &&
        site.Tax_Exemption__c !== "";
      const hasPaymentTermValue =
        site.Payment_Term__c !== null &&
        site.Payment_Term__c !== undefined &&
        site.Payment_Term__c !== "";
      const hasStartDateValue = !!site.Start_Date__c;
      const hasEndDateValue = !!site.End_Date__c;

      const showStreetIcon = false;
      const showPostalCodeIcon = false;
      const showCityIcon = false;
      const showMarketIdentifierIcon =
        missingFlags.marketIdentifier && !hasMarketIdentifierValue;
      const showServiceTypeIcon =
        missingFlags.serviceType && !hasServiceTypeValue;
      const showProductIcon = missingFlags.product && !hasProductValue;
      const showMarginValueIcon = missingFlags.marginValue && !hasMarginValue;
      const showTaxExemptionIcon =
        missingFlags.taxExemption && !hasTaxExemptionValue;
      const showPaymentTermIcon =
        missingFlags.paymentTerm && !hasPaymentTermValue;
      const showStartDateIcon = missingFlags.startDate && !hasStartDateValue;
      const showEndDateIcon = missingFlags.endDate && !hasEndDateValue;

      enrichedSites.push({
        ...site,
        streetClass: "",
        cityClass: "",
        postalCodeClass: "",
        marketIdentifierClass: missingFlags.marketIdentifier
          ? missingClass
          : "",
        serviceTypeClass: missingFlags.serviceType ? missingClass : "",
        productClass: missingFlags.product ? missingClass : "",
        marginValueClass: missingFlags.marginValue ? missingClass : "",
        taxExemptionClass: missingFlags.taxExemption ? missingClass : "",
        paymentTermClass: missingFlags.paymentTerm ? missingClass : "",
        startDateClass: missingFlags.startDate ? missingClass : "",
        endDateClass: missingFlags.endDate ? missingClass : "",
        streetIcon: showStreetIcon ? "utility:info_alt" : "",
        postalCodeIcon: showPostalCodeIcon ? "utility:info_alt" : "",
        cityIcon: showCityIcon ? "utility:info_alt" : "",
        marketIdentifierIcon: showMarketIdentifierIcon
          ? "utility:info_alt"
          : "",
        serviceTypeIcon: showServiceTypeIcon ? "utility:info_alt" : "",
        productIcon: showProductIcon ? "utility:info_alt" : "",
        marginValueIcon: showMarginValueIcon ? "utility:info_alt" : "",
        taxExemptionIcon: showTaxExemptionIcon ? "utility:info_alt" : "",
        paymentTermIcon: showPaymentTermIcon ? "utility:info_alt" : "",
        startDateIcon: showStartDateIcon ? "utility:info_alt" : "",
        endDateIcon: showEndDateIcon ? "utility:info_alt" : "",
        streetErrorTooltip: "",
        postalCodeErrorTooltip: "",
        cityErrorTooltip: "",
        marketIdentifierErrorTooltip: showMarketIdentifierIcon
          ? SiteGuidedForm_MissingRequiredFieldMarketIdentifier
          : "",
        serviceTypeErrorTooltip: showServiceTypeIcon
          ? SiteGuidedForm_MissingRequiredFieldServiceType
          : "",
        productErrorTooltip: showProductIcon
          ? SiteGuidedForm_MissingRequiredFieldProduct
          : "",
        marginValueErrorTooltip: showMarginValueIcon
          ? SiteGuidedForm_MissingRequiredFieldTPIMargin
          : "",
        taxExemptionErrorTooltip: showTaxExemptionIcon
          ? SiteGuidedForm_MissingRequiredFieldTaxExemption
          : "",
        paymentTermErrorTooltip: showPaymentTermIcon
          ? SiteGuidedForm_MissingRequiredFieldPaymentTerm
          : "",
        startDateErrorTooltip: showStartDateIcon
          ? SiteGuidedForm_MissingRequiredFieldStartDate
          : "",
        endDateErrorTooltip: showEndDateIcon
          ? SiteGuidedForm_MissingRequiredFieldEndDate
          : ""
      });
    }

    this.sites = enrichedSites;

    // Track that validation has been performed
    this.validationPerformed = true;

    // Show validation section if any fields are missing
    this.showValidationMessage = hasAnyMissingFields;
  }

  /**
   * Get missing fields for a specific site (used in template)
   */
  getMissingFieldsForSite(siteId) {
    return this.missingFieldsBySite[siteId] || [];
  }

  /**
   * Get all sites with missing fields
   */
  get sitesWithMissingFields() {
    return this.sites
      .map((site) => {
        const missing = this.missingFieldsBySite[site.Id];
        if (!missing) return null;
        return {
          ...site,
          rowNumber: missing.rowNumber,
          missingFields: missing.fields
        };
      })
      .filter((site) => site !== null);
  }

  get hasServerValidationErrors() {
    return (
      Array.isArray(this.serverValidationErrors) &&
      this.serverValidationErrors.length > 0
    );
  }
  /**
   * Submits the validated form to create Property-Opportunity associations
   * Called when all required fields are validated and user confirms submission
   *
   * COMMENTED OUT: Junction records are now created automatically when dates are first saved
   * This method remains for potential future use (e.g., triggering final API posting)
   *
   * Creates Site__c records with:
   * - Property lookup
   * - Opportunity lookup
   * - Start Date (based on Site Addition Type logic)
   * - End Date (based on Site Addition Contract)
   */
  async handleSubmitForm() {
    if (!this._recordId) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: Common_MessageErrorTitle,
          message: SiteGuidedForm_AccountIDIsMissing,
          variant: "error"
        })
      );
      return;
    }

    const verified = await this.ensureAccountCodeVerified();
    if (!verified) {
      return;
    }

    this.submitting = true;

    // Build association records from sites data to trigger API posting
    const associations = this.sites.map((site) => {
      return {
        propertyId: site.Id,
        opportunityId: site.Opportunity__c,
        startDate: site.Start_Date__c,
        endDate: site.End_Date__c
      };
    });

    // Call createPropertyOpportunityAssociations to trigger G2 API posting
    createPropertyOpportunityAssociations({ associations: associations })
      .then((result) => {
        this.serverValidationErrors = [];

        // Initialize progress tracking
        this.totalCount = this.sites.length;
        this.processedCount = 0;
        this.progressPercentage = 0;

        // Show success message
        this.showSuccessMessage = true;
        this.showValidationMessage = false;

        // Use real progress tracking if async job exists, otherwise simulate
        if (result.hasAsyncJob && result.jobId) {
          this.asyncJobId = result.jobId;
          this.pollJobProgress();
        } else {
          // For Site Manager, complete immediately
          this.completeProgress();
        }

        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageSuccessTitle,
            message: result.hasAsyncJob
              ? SiteGuidedForm_FormSubmittedPropertiesAreBeingPosted
              : SiteGuidedForm_FormSubmittedSuccessfully,
            variant: "success"
          })
        );

        // Dispatch completion event
        this.dispatchEvent(new CustomEvent("formcomplete"));
      })
      .catch((error) => {
        console.error(SiteGuidedForm_ErrorSubmittingForm, error);
        const rawMessage =
          error?.body?.message || SiteGuidedForm_ErrorSubmittingForm;
        const lines = rawMessage
          .split("\n")
          .filter(
            (line) =>
              line && !line.startsWith(SiteGuidedForm_FormValidationFailed)
          );
        this.serverValidationErrors = lines.length ? lines : [rawMessage];
        this.validationPerformed = true;
        this.showValidationMessage = true;
        // this.dispatchEvent(
        //     new ShowToastEvent({
        //         title: Common_MessageErrorTitle,
        //         message: error.body?.message || SiteGuidedForm_ErrorSubmittingForm,
        //         variant: 'error'
        //     })
        // );
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  handleApproveSites() {
    this.updateOpportunityApprovalStatus(true);
  }

  handleRejectSites() {
    this.updateOpportunityApprovalStatus(false);
  }

  updateOpportunityApprovalStatus(approved) {
    const targetOpportunityId = this._opportunityId || this._recordId;
    if (!targetOpportunityId) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: Common_MessageErrorTitle,
          message: Common_OpportunityIDIsMissing,
          variant: "error"
        })
      );
      return;
    }

    if (Array.isArray(this.draftValues) && this.draftValues.length > 0) {
      this.dispatchEvent(
        new ShowToastEvent({
          title: SiteGuidedForm_SaveRequired,
          message: SiteGuidedForm_PleaseSaveYourTableEditsBefore,
          variant: "warning"
        })
      );
      return;
    }

    this.submitting = true;
    setOpportunitySitesApprovalStatus({
      opportunityId: targetOpportunityId,
      approved: approved,
      rejectionReason: approved ? null : SiteGuidedForm_RejectedByPrimaryContact
    })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageSuccessTitle,
            message: approved
              ? Common_SitesApprovedSuccessfully
              : Common_SitesRejectedSuccessfully,
            variant: "success"
          })
        );
        return this.loadSubmitAccessInfo();
      })
      .catch((error) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: Common_MessageErrorTitle,
            message:
              error?.body?.message || Common_UnableToUpdateSiteApprovalStatus,
            variant: "error"
          })
        );
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  /**
   * Polls the async job status for real-time progress updates
   * Replaces simulateProgress() with actual job tracking
   */
  pollJobProgress() {
    if (!this.asyncJobId) {
      console.warn(SiteGuidedForm_NoJobIDAvailableForPolling);
      this.completeProgress();
      return;
    }

    let pollCount = 0;
    const maxPolls = 120; // Maximum 2 minutes of polling (120 * 1000ms)

    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.pollingIntervalId = setInterval(() => {
      pollCount++;

      // Stop polling if success message is hidden or max polls reached
      if (!this.showSuccessMessage || pollCount > maxPolls) {
        this.stopPolling();
        if (pollCount > maxPolls) {
          console.warn(SiteGuidedForm_MaxPollingAttemptsReached);
          this.completeProgress();
        }
        return;
      }

      // Poll job status
      checkJobStatus({ jobId: this.asyncJobId })
        .then((status) => {
          // Update progress based on actual job progress
          if (status.totalItems > 0) {
            this.totalCount = status.totalItems;
            this.processedCount = status.processedItems;
            this.progressPercentage = Math.round(
              (status.processedItems / status.totalItems) * 100
            );
          } else {
            // If no items to process, show indeterminate progress
            this.progressPercentage = status.isComplete ? 100 : 50;
          }

          // Check if job is complete
          if (status.isComplete) {
            this.stopPolling();

            if (status.status === SiteGuidedForm_Completed) {
              this.completeProgress();
            } else if (
              status.status === Common_Failed ||
              status.failedItems > 0
            ) {
              console.error(SiteGuidedForm_JobFailed, status.errorMessage);
              // Still show completion but log errors
              this.completeProgress();
            }
          }
        })
        .catch((error) => {
          console.error(SiteGuidedForm_ErrorPollingJobStatus, error);
          // Don't stop polling on error, might be transient
          // Fallback to simulated progress after 3 consecutive errors
          if (pollCount > 3) {
            this.stopPolling();
            this.simulateProgress();
          }
        });
    }, 1000); // Poll every 1 second
  }

  /**
   * Stops the polling interval
   */
  stopPolling() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  /**
   * Simulates progress updates for the success message (FALLBACK)
   * In a real implementation, this would poll a backend endpoint or use WebSocket
   */
  simulateProgress() {
    let currentProgress = 0;
    const maxProgress = 95; // Stop at 95% to avoid reaching 100% before actual completion
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    const interval = setInterval(() => {
      if (!this.showSuccessMessage) {
        clearInterval(interval);
        return;
      }

      // Increment progress with varying speeds (faster at start, slower later)
      const randomIncrement =
        Math.random() * (maxProgress > 80 ? 2 : maxProgress > 50 ? 5 : 8);
      currentProgress = Math.min(
        currentProgress + randomIncrement,
        maxProgress
      );

      // Update processed count proportionally
      this.processedCount = Math.floor(
        (currentProgress / 100) * this.totalCount
      );
      this.progressPercentage = Math.round(currentProgress);

      // Every 3 seconds, push progress to 99% when close
      if (currentProgress > 85 && Math.random() > 0.7) {
        currentProgress = 99;
        this.processedCount = this.totalCount - 1;
        this.progressPercentage = 99;
      }
    }, 200); // Update every 200ms for faster, more responsive feedback
  }

  /**
   * Completes progress to 100%
   */
  completeProgress() {
    this.progressPercentage = 100;
    this.processedCount = this.totalCount;
    this.stopPolling(); // Ensure polling is stopped
  }

  /**
   * Cleanup when component is destroyed
   */
  disconnectedCallback() {
    this.stopPolling();
  }
}
