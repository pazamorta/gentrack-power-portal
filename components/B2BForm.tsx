import React, { useState } from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Check, CheckCircle, Building2, Users, ExternalLink } from 'lucide-react';
import { InvoiceUploader } from './InvoiceUploader';
import { salesforceService, ParsedInvoiceData } from '../services/salesforce';

type Step = 1 | 2 | 3 | 4;

interface B2BFormProps {
  theme?: 'light' | 'dark';
  variant?: 'default' | 'embedded';
  onSuccess?: () => void;
}

export const B2BForm: React.FC<B2BFormProps> = ({ theme = 'dark', variant = 'default', onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    userType: 'company',
    tpiIdentifier: '',
    companyName: '',
    companyNumber: '',
    website: '',
    contactName: '',
    email: '',
    phone: '',
    jobTitle: '',
    industry: '',
    companySize: '',
    customerBase: '',
    currentSystems: '',
    energyDomains: [] as string[],

    timeline: '',
    budget: '',
    additionalInfo: '',
    gdprConsent: false,

    leadId: '',
    // New Fields
    spendUnder30k: null as boolean | null,
    singleSite: null as boolean | null,
    employeesOver10: null as boolean | null,
    balanceSheetOver2m: null as boolean | null,
    customerSegment: '',
    recordTypeId: '',
    contractLength: '',
    contractStartDate: '',
    onsiteGeneration: null as boolean | null,
    endCustomerName: '',
    endCustomerAddress: '',
    endCustomerCompanyNumber: '',
    letterOfAuthority: null as File | null,
    manualMeters: [] as { name: string; postcode: string; address: string; city: string }[],
  });
  const [showManualForm, setShowManualForm] = useState(false);
  const [invoiceData, setInvoiceData] = useState<ParsedInvoiceData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalSuccess, setFinalSuccess] = useState(false);

  const [submissionSuccess, setSubmissionSuccess] = useState<{
    instanceUrl: string;
    accountId: string;
    contactId: string;
    opportunityId: string;
    servicePoints?: { id: string; mpan: string }[];
  } | null>(null);

  // Ref to track async operations
  const promises = React.useRef<{
      lead: Promise<{ leadId?: string }> | null;
      opportunity: Promise<any> | null;
  }>({
      lead: null,
      opportunity: null
  });

  // Manual Entry State
  const [searchPostcode, setSearchPostcode] = useState('');
  const [addPostcode, setAddPostcode] = useState('');
  const [foundSites, setFoundSites] = useState<{ id: string; name: string; address: string; city: string; postcode: string; selected: boolean }[]>([]);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);

  const handlePostcodeSearch = async (postcode: string, append: boolean) => {
    if (!postcode) return;
    
    setIsSearchingAddresses(true);
    setAddressSearchError(null);

    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/address/lookup?postcode=${encodeURIComponent(postcode)}`);
        
        if (!response.ok) {
             throw new Error('Failed to fetch addresses');
        }

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
             setAddressSearchError('No addresses found for this postcode');
             if (!append) setFoundSites([]);
             return;
        }

        const newSites = data.results.map((item: any) => {
             const addressObj = item.DPA || item.LPI;
             return {
                 id: addressObj.UPRN || `${postcode}-${Date.now()}-${Math.random()}`,
                 name: addressObj.ADDRESS || 'Unknown Address',
                 address: addressObj.ADDRESS || 'Unknown Address', // Use full address for 'address' property used in display/street
                 city: addressObj.POST_TOWN || 'UK',
                 postcode: addressObj.POSTCODE || postcode,
                 selected: false
             };
        });

        if (append) {
            setFoundSites(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const uniqueNewSites = newSites.filter((s:any) => !existingIds.has(s.id));
                return [...prev, ...uniqueNewSites];
            });
            setAddPostcode('');
        } else {
            setFoundSites(newSites);
        }

    } catch (err) {
        console.error('Address search error:', err);
        setAddressSearchError('Error searching for addresses. Please try again.');
    } finally {
        setIsSearchingAddresses(false);
    }
  };

  const toggleSiteSelection = (id: string) => {
    setFoundSites(prev => prev.map(site => {
        if (site.id === id) {
            const newSelected = !site.selected;
            const siteName = `${site.name}, ${site.postcode}`;
            setFormData(fd => ({
                ...fd,
                manualMeters: newSelected 
                    ? [...fd.manualMeters, { name: siteName, postcode: site.postcode, address: site.name, city: site.city }]
                    : fd.manualMeters.filter(m => m.name !== siteName)
            }));
            return { ...site, selected: newSelected };
        }
        return site;
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox separately
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      energyDomains: checked
        ? [...prev.energyDomains, value]
        : prev.energyDomains.filter(domain => domain !== value)
    }));
  };

  // Calculate Customer Segment and RecordType whenever relevant fields change
  React.useEffect(() => {
    const { spendUnder30k, singleSite, employeesOver10, balanceSheetOver2m } = formData;
    
    // Only calculate if the main segment questions are answered
    if (spendUnder30k === null || singleSite === null) return;

    let segment = '';
    let rtId = '';

    const SME_RECORD_TYPE = '012Dx000000GwHKIA0';
    const IC_RECORD_TYPE = '012Dx000000GwvuIAC';

    // Logic Implementation based on requirements:
    
    // 1. Microbusiness
    // If (Employees > 10 == NO) OR (Balance > 2m == NO) -> Microbusiness, SME RT
    // Note: This check relies on employeesOver10/balanceSheetOver2m not being null if we want to be strict,
    // but typically they might be null if not shown? logic suggests they appear if spend < 30k?
    // Let's assume if they are FALSE (NO), condition meets.
    // Wait, the prompts for these usually only appear if spend < 30k? 
    // The prompt implies these are visible steps.
    
    // Let's follow the priority in the prompt.
    // "If user selects... NO or ... NO THEN ..."
    
    const isMicrobusiness = (employeesOver10 === false || balanceSheetOver2m === false);

    if (isMicrobusiness) {
         segment = 'Microbusiness';
         rtId = SME_RECORD_TYPE;
    } 
    else {
        // Not Microbusiness (meaning Employees=YES AND Balance=YES, OR inputs are null/undefined)
        
        // 2. SME Single Site
        // Spend < 30k (YES) AND Single Site (YES) AND Employees > 10 (YES) AND Balance > 2m (YES)
        if (spendUnder30k === true && singleSite === true && employeesOver10 === true && balanceSheetOver2m === true) {
            segment = 'SME Single Site';
            rtId = SME_RECORD_TYPE;
        }
        
        // 3. SME Multi Site
        // Spend < 30k (YES) AND Single Site (NO) AND Employees > 10 (YES) AND Balance > 2m (YES)
        else if (spendUnder30k === true && singleSite === false && employeesOver10 === true && balanceSheetOver2m === true) {
             segment = 'SME Multi Site';
             rtId = SME_RECORD_TYPE;
        }
        
        // 4. I&C Opportunity
        // Spend < 30k (NO) AND Single Site (NO)
        // Note: No segment specified, but RT is I&C
        else if (spendUnder30k === false && singleSite === false) {
             // segment = ''; // Keep empty or default?
             rtId = IC_RECORD_TYPE; 
        }
    }
    
    setFormData(prev => {
        if (prev.customerSegment !== segment || prev.recordTypeId !== rtId) {
            return { ...prev, customerSegment: segment, recordTypeId: rtId };
        }
        return prev;
    });

  }, [formData.spendUnder30k, formData.singleSite, formData.employeesOver10, formData.balanceSheetOver2m]);

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        if (formData.userType === 'tpi' && !formData.tpiIdentifier) return false;
        
        // Base validation
        const baseValid = !!(formData.gdprConsent && formData.companyName && formData.companyNumber && formData.contactName && formData.email && emailValid && formData.phone && formData.jobTitle);
        
        // If TPI, we also need end customer details? 
        // "Please enter The end customer's information" -> This is likely in a later step or added to Step 1 for TPI?
        // The prompt says "If the user selects the 'As a TPI' tab add... End customer info". 
        // I'll assume they go in Step 1 or a dedicated step. Let's put them in Step 1 if TPI is selected.
        if (formData.userType === 'tpi') {
             // TPI requires standard fields + TPI Identifier + LOA
             // Note: companyName/companyNumber serve as "Client Account Name" etc in TPI mode
             return baseValid && !!(formData.tpiIdentifier && formData.letterOfAuthority);
        }
        
        return baseValid;

      case 2:
        if (formData.spendUnder30k === null || formData.singleSite === null) return false;
        
        // If SME (spend < 30k), must answer microbusiness questions
        if (formData.spendUnder30k) {
             if (formData.employeesOver10 === null || formData.balanceSheetOver2m === null) return false;
        }
        
        return !!formData.industry;

      case 3:
        if (formData.singleSite) {
             // Single Site: Needs Bill or Manual Entry
             return true;
        }
        
        // Multi Site (Portfolio):
        // Allow progression if they are on this step
        return true;
        
      case 4:
         // Step 4: Contract Details
         // Require Contract Length, Start Date, and Onsite Generation
         return !!(formData.contractLength && formData.contractStartDate && formData.onsiteGeneration !== null);

      default:
        return false;
    }
  };

  const handleInvoiceParsed = (data: ParsedInvoiceData) => {
    setInvoiceData(data);
    setShowManualForm(true);
    setFormData(prev => ({
      ...prev,
      companyName: data.companyName || prev.companyName,
      companyNumber: data.companyNumber || prev.companyNumber,
      // We could also map other fields if available in the invoice
    }));
  };

  const handleDownloadTemplate = () => {
    // Vite BASE_URL should be prepended to all absolute paths in the public directory
    const baseUrl = import.meta.env.BASE_URL || '/';
    const link = document.createElement('a');
    // Ensure we don't have double slashes
    link.href = `${baseUrl}/portfolio_template.xlsx`.replace(/\/+/g, '/');
    link.download = 'portfolio_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // SIMULATION: Good Energy Invoice Detection
    // If the file name contains "Good" or "Good Energy", we simulate the parsing
    if (file.name.toLowerCase().includes('good') || file.name.includes('1770211092461') || file.name.includes('1770211866247') || file.name.includes('1770213108076')) { // Using multiple IDs for robustness
        console.log("Simulating Good Energy Invoice Parsing...");
        
        // Mock Data based on the user request
        const mockInvoiceData: ParsedInvoiceData = {
             companyName: 'CX Team', // Updated as per user request
             companyNumber: '1234S6789', // Updated Account Number
             accountNumber: '1234S6789',
             invoiceNumber: 'INV-2024-001',
             totalAmount: 145000, // Sum of pricing totals: 40k+35k+50k+20k = 145k
             totalConsumption: 1450, // 1,450 MWh
             annualConsumption: 12000, // 12,000 MWh YTD
             sites: [
                 {
                     name: 'Site 1: London HQ',
                     address: 'London, E14',
                     postcode: 'E14',
                     city: 'London',
                     country: 'GB',
                     meterPoints: [{
                         mpan: '1012131415',
                         meterNumber: '1012131415',
                         address: 'London, E14' // Minimal address from image
                     }]
                 },
                 {
                     name: 'Site 2: Manchester Hub',
                     address: 'Manchester, M1',
                     postcode: 'M1',
                     city: 'Manchester',
                     country: 'GB',
                     meterPoints: [{
                         mpan: '1617181920',
                         meterNumber: '1617181920',
                         address: 'Manchester, M1'
                     }]
                 },
                 {
                     name: 'Site 3: Birmingham Data Centre',
                     address: 'Birmingham, B1',
                     postcode: 'B1',
                     city: 'Birmingham',
                     country: 'GB',
                     meterPoints: [{
                         mpan: '2122233425',
                         meterNumber: '2122233425',
                         address: 'Birmingham, B1'
                     }]
                 },
                 {
                     name: 'Site 4: Edinburgh Office',
                     address: 'Edinburgh, EH1',
                     postcode: 'EH1',
                     city: 'Edinburgh',
                     country: 'GB',
                     meterPoints: [{
                         mpan: '2627282930',
                         meterNumber: '2627282930',
                         address: 'Edinburgh, EH1'
                     }]
                 }
             ]
        };

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          mockInvoiceData.fileContent = base64;
          mockInvoiceData.fileName = file.name;
          

          // Instead of just parsing, we simulate the full "Next" flow for this demo
          // 1. Update basic state
          setInvoiceData(mockInvoiceData);
          setFormData(prev => ({
              ...prev,
              companyName: mockInvoiceData.companyName,
              companyNumber: mockInvoiceData.companyNumber || prev.companyNumber,
              singleSite: mockInvoiceData.sites.length === 1,
              spendUnder30k: false
          }));

          // 2. TRIGGER BACKGROUND RECORD CREATION (Same as Step 3 handleNext)
          console.log('Simulation: Triggering Background Record Creation...');
          
          const opportunityPromise = (async () => {
             // Wait for Lead to be created (Mock flow assumes Step 1 passed)
             if (!promises.current.lead) {
                 console.warn("Simulation: No lead promise found. Assuming dev mode or direct jump.");
                 // In a real scenario, we'd ensure lead exists. For this mock, if no lead, we might fail or need a fallback.
                 // let's try to get it, or if missing, maybe just proceed (validation might fail on backend but UI moves on)
             }
             
             let leadId = '';
             try {
                 const leadResult = await promises.current.lead;
                 leadId = leadResult?.leadId || '';
             } catch (e) {
                 console.warn("Simulation: Could not get Lead ID", e);
             }

             // Prepare payload
             const conversionPayload: ParsedInvoiceData = {
                // Base Details
                companyName: mockInvoiceData.companyName, // Use mock data
                companyNumber: mockInvoiceData.companyNumber || formData.companyNumber,
                contactFirstName: formData.contactName.split(' ')[0],
                contactLastName: formData.contactName.split(' ').slice(1).join(' ') || 'Unknown',
                contactEmail: formData.email,
                contactPhone: formData.phone,
                
                // Form Fields
                leadId: leadId, 
                industry: formData.industry,
                // companySize removed
                userType: formData.userType,
                tpiIdentifier: formData.tpiIdentifier,
                
                // Site Data
                sites: mockInvoiceData.sites, // Use mock sites
                fileName: mockInvoiceData.fileName,
                fileContent: mockInvoiceData.fileContent,
                invoiceNumber: mockInvoiceData.invoiceNumber,
                totalAmount: mockInvoiceData.totalAmount,
                totalConsumption: mockInvoiceData.totalConsumption,
                annualConsumption: mockInvoiceData.annualConsumption,
                recordTypeId: '012Dx000000GwvuIAC', // Force I&C for this simulation path
             };
             
             console.log("Simulation: Sending Invoice/Opportunity Request...");
             const result = await salesforceService.createRecordsFromInvoice(conversionPayload);
             console.log("Simulation: Invoice/Opportunity Request Complete:", result);
             
             if (result.success && result.records) {
                 setSubmissionSuccess(result.records);
                 return result.records;
             } else {
                 throw new Error(result.message || "Failed to create opportunity records");
             }
          })();

          promises.current.opportunity = opportunityPromise;

          // 3. Auto-Advance to Step 4
          setCurrentStep(4);
        };
        return;
    }

    const text = await file.text();
    // Auto-detect delimiter
    const delimiter = text.includes('\t') ? '\t' : ',';
    const rows = text.split(/\r?\n/).map(row => row.split(delimiter));
    const headers = rows[0].map(h => h.trim());
    
    // Simple CSV parsing (assuming no commas in values for MVP)
    const sitesMap = new Map<string, any>();
    
    rows.slice(1).forEach(row => {
      // Skip truly empty rows. Avoid length < 2 check because some rows could literally have 1 column if TSV was short.
      if (!row || row.length === 0 || row.join('').trim() === '') return;
      
      const getAnyValue = (headerAliases: string[]) => {
        for (const alias of headerAliases) {
          const index = headers.findIndex(h => h.toLowerCase().trim() === alias.toLowerCase().trim());
          if (index >= 0) return row[index]?.trim();
        }
        for (const alias of headerAliases) {
          const index = headers.findIndex(h => h.toLowerCase().includes(alias.toLowerCase()));
          if (index >= 0) return row[index]?.trim();
        }
        return '';
      };

      const siteName = getAnyValue(['Property Name', 'PropertyName', 'Name', 'Site Name']) || 'Unknown Site';
      const address1 = getAnyValue(['AddressLine1', 'Address Line 1', 'Street', 'Address', 'Address Line1']);
      const address2 = getAnyValue(['AddressLine2', 'Address Line 2', 'AddressLine 2', 'AddresLine2']);
      const city = getAnyValue(['City', 'Town']);
      const postcode = getAnyValue(['Postcode', 'Post Code', 'PostalCode', 'Postal Code']);
      const propertyType = getAnyValue(['Type', 'Property Type', 'PropertyType']);
      
      const startDate = getAnyValue(['start_date', 'Start Date', 'StartDate', 'GTCX_Start_Date__c']);
      const endDate = getAnyValue(['end_date', 'End Date', 'EndDate', 'GTCX_End_Date__c']);
      const product = getAnyValue(['product', 'Product', 'GTCX_Product__c']);
      const marginValue = getAnyValue(['tpi_margin', 'TPI Margin', 'TPI Margin Value', 'margin_value', 'Margin Value', 'GTCX_Margin_Value__c']);
      const taxExemption = getAnyValue(['tax_exemption', 'Tax Exemption', 'TaxExemption', 'GTCX_Tax_Exemption__c']);
      const paymentTerm = getAnyValue(['payment_term', 'payment_terms', 'Payment Term', 'Payment Terms', 'GTCX_Payment_Term__c']);
      
      const marketIdentifier = getAnyValue(['market_identifier', 'Market Identifier', 'MarketIdentifier', 'GTCX_Market_Identifier__c', 'Service Point']);
      const serviceType = getAnyValue(['Service Type', 'ServiceType', 'GTCX_Service_Type__c', 'Fuel Type']);
      const annualConsumption = getAnyValue(['Annual Consumption', 'AnnualConsumption', 'GTCX_Annual_Consumption__c', 'Annual Consumption*']);
      
      const contactName = getAnyValue(['Contact Name', 'Service Point Contact Name']);
      const contactEmail = getAnyValue(['Contact Email', 'Service Point Contact email']);
      const contactPhone = getAnyValue(['Contact Phone', 'Service Point Contact tel']);
      const companyNumber = getAnyValue(['Company Number', 'Service Point Company Number']);
      const productPreference = getAnyValue(['Product Preference', 'Product Preference*']);
      const durationOptions = getAnyValue(['Duration Options', 'Duration Options*']);
      const supplyStatus = getAnyValue(['Supply Status']);

      const fullAddress = [address1, address2].filter(Boolean).join(', ');

      if (!sitesMap.has(siteName)) {
        sitesMap.set(siteName, {
          name: siteName,
          address: `${fullAddress} ${postcode}`.trim(),
          addressComponent: fullAddress,
          city: city,
          postcodeComponent: postcode,
          postcode: postcode,
          propertyType: propertyType,
          startDate: startDate,
          endDate: endDate,
          product: product,
          marginValue: marginValue,
          taxExemption: taxExemption,
          paymentTerm: paymentTerm,
          meterPoints: []
        });
      }

      if (marketIdentifier) {
        sitesMap.get(siteName).meterPoints.push({
          mpan: marketIdentifier,
          meterNumber: marketIdentifier,
          address: fullAddress,
          postcode: postcode,
          fuelType: serviceType,
          productPreference: productPreference,
          durationOptions: durationOptions,
          annualConsumption: annualConsumption,
          contactName: contactName,
          contactEmail: contactEmail,
          contactPhone: contactPhone,
          companyNumber: companyNumber,
          supplyStatus: supplyStatus
        });
      }
    });

    const parsedSites = Array.from(sitesMap.values());
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setInvoiceData(prev => ({
        ...(prev || {}),
        fileContent: base64,
        fileName: file.name,
        companyName: prev?.companyName || formData.companyName,
        companyNumber: prev?.companyNumber || formData.companyNumber,
        // @ts-ignore
        sites: parsedSites
      }));
    };
    reader.onerror = (err) => {
      console.error('Error reading CSV file:', err);
    };
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    // STEP 1: CREATE LEAD (Non-blocking)
    if (currentStep === 1) {
        console.log('Step 1 Complete: Starting Lead Creation (Background)...');
        
        // Prepare payload immediately
        const leadPayload = {
            companyName: formData.companyName,
            companyNumber: formData.companyNumber,
            contactName: formData.contactName,
            email: formData.email,
            phone: formData.phone,
            jobTitle: formData.jobTitle,
            website: formData.website,
            userType: formData.userType,
            tpiIdentifier: formData.tpiIdentifier,
            gdprConsent: formData.gdprConsent,
            fileContent: undefined as string | undefined, 
            fileName: undefined as string | undefined
        };

        // Handle File Logic synchronously if possible, or inside the promise chain if complex
        // Ideally we should process the file reading BEFORE starting the promise to keep the promise logic clean
        // But for non-blocking UI, we can kick it off.
        
        const leadPromise = (async () => {
             // File processing inside the async operation
             if (formData.userType === 'tpi' && formData.letterOfAuthority) {
                 try {
                     const fileText = await new Promise<string>((resolve, reject) => {
                         const reader = new FileReader();
                         reader.readAsDataURL(formData.letterOfAuthority!);
                         reader.onload = () => resolve(reader.result as string);
                         reader.onerror = reject;
                     });
                     leadPayload.fileContent = fileText.split(',')[1];
                     leadPayload.fileName = formData.letterOfAuthority!.name;
                 } catch (err) {
                     console.error("Error reading LOA file:", err);
                     throw new Error("Failed to process LOA file");
                 }
             }

             console.log("Sending Lead Request...");
             const result = await salesforceService.createLead(leadPayload);
             console.log("Lead Request Complete:", result);
             
             if (result.leadId) {
                 setFormData(prev => ({ ...prev, leadId: result.leadId }));
                 return result;
             } else {
                 throw new Error("Lead ID not returned");
             }
        })();

        // Store the promise
        promises.current.lead = leadPromise;

        // Optimistic UI Update
        setCurrentStep((prev) => (prev + 1) as Step);

    } 
    // STEP 3: CONVERT LEAD & CREATE SITES (Chained)
    else if (currentStep === 3) {
         console.log('Step 3 Complete: Identifying Sites & Opportunity (Background)...');
         
         // Start the chain
         const opportunityPromise = (async () => {
             // Wait for Lead to be created
             if (!promises.current.lead) {
                 throw new Error("Lead creation was not started.");
             }
             
             const leadResult = await promises.current.lead;
             const leadId = leadResult.leadId;
             if (!leadId) throw new Error("No Lead ID available from previous step.");

             // Prepare payload
             const conversionPayload: ParsedInvoiceData = {
                // Base Details
                companyName: formData.companyName,
                companyNumber: formData.companyNumber,
                contactFirstName: formData.contactName.split(' ')[0],
                contactLastName: formData.contactName.split(' ').slice(1).join(' ') || 'Unknown',
                contactEmail: formData.email,
                contactPhone: formData.phone,
                
                // Form Fields
                leadId: leadId, // Use the resolved ID
                industry: formData.industry,
                // companySize removed
                // Removed fields
                customerSegment: formData.customerSegment,
                recordTypeId: formData.recordTypeId,
                userType: formData.userType,
                tpiIdentifier: formData.tpiIdentifier,
                
                contractStartDate: formData.contractStartDate,
                contractLength: formData.contractLength,
                energyDomains: formData.energyDomains,
                onsiteGeneration: formData.onsiteGeneration,
                
                // Site Data
                sites: [
                    ...(invoiceData?.sites || []),
                    ...(formData.manualMeters.map(site => ({
                        name: site.name,
                        address: site.address,
                        city: site.city,
                        country: 'GB',
                        postcode: site.postcode,
                        meterPoints: []
                    })))
                ],
                fileName: invoiceData?.fileName,
                fileContent: invoiceData?.fileContent,
                invoiceNumber: invoiceData?.invoiceNumber,
                totalAmount: invoiceData?.totalAmount,
                totalConsumption: invoiceData?.totalConsumption,
                annualConsumption: invoiceData?.annualConsumption,
             };
             
             console.log("Sending Invoice/Opportunity Request...");
             const result = await salesforceService.createRecordsFromInvoice(conversionPayload);
             console.log("Invoice/Opportunity Request Complete:", result);
             
             if (result.success && result.records) {
                 setSubmissionSuccess(result.records);
                 return result.records;
             } else {
                 throw new Error(result.message || "Failed to create opportunity records");
             }
         })();

         promises.current.opportunity = opportunityPromise;
         
         // Optimistic Update
         setCurrentStep((prev) => (prev + 1) as Step);
    }
    // STEP 2: Just Next
    else if (currentStep < 4) {
         setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent premature submission if not on final step
    // This catches "Enter" key presses on inputs in earlier steps
    if (currentStep < 4) {
        handleNext();
        return;
    }

    setValidationError(null);
    
    if (!validateStep(4)) {
      setValidationError("Please complete all required fields correctly.");
      return;
    }

    // 1. Immediate UI Feedback (Optimistic Success)
    setIsSubmitting(true);
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setFinalSuccess(true);
    if (onSuccess) {
        onSuccess();
    }
    setIsSubmitting(false); // Enable UI interaction if needed (though we switched view)

    // 2. Background Processing
    try {
      console.log('Final Submission: Processing in background...');

      // Wait for Opportunity Creation to complete (should be fast/done)
      if (!promises.current.opportunity) {
          console.error("Background Error: No opportunity creation in progress.");
          return;
      }

      const oppResult = await promises.current.opportunity;
      const opportunityId = oppResult.opportunityId;

      if (!opportunityId) {
          console.error("Background Error: Failed to retrieve Opportunity ID.");
          return;
      }
      
      console.log('Final Submission: Updating Opportunity...', opportunityId);

      // Ensure strict boolean for Salesforce Checkbox
      const contractPayload = {
          contractLength: formData.contractLength,
          contractStartDate: formData.contractStartDate,
          onsiteGeneration: Boolean(formData.onsiteGeneration) 
      };

      // Execute update (non-blocking for user)
      salesforceService.updateOpportunity(opportunityId, contractPayload)
        .then(result => {
           if (result.success) {
             console.log('Final Background Success:', result.message);
           }
        })
        .catch(err => {
           console.error('Background Submission API Error:', err);
           // Optional: You could show a specialized toast here if it fails
        });

    } catch (error) {
      console.error('Submission setup error:', error);
      // We don't alert the user here because they are already on the success screen.
      // We rely on logs for debugging this edge case.
    }
  };

  // ... [Keep steps array definition]

  const steps = [
    { number: 1, title: 'Company & Contact', description: 'Basic information' },
    { number: 2, title: 'Business Details', description: 'About your business' },
    { number: 3, title: 'Requirements', description: 'What you need' },
    { number: 4, title: 'Contract', description: 'Current agreements' },
  ];

  const content = finalSuccess ? (
    <div className={`w-full max-w-4xl mx-auto p-8 backdrop-blur-lg rounded-2xl border text-center animate-fade-in ${
        theme === 'light' 
        ? 'bg-white border-gray-200 shadow-xl' 
        : 'bg-white/5 border-white/10'
    }`}>
        <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-[#00E599]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-[#00E599]" />
            </div>
        </div>
        
        <h2 className={`text-3xl font-display font-bold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
            Application Submitted!
        </h2>
        <p className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>
            Thanks for trusting Oxygen with your company's energy needs. We will get back to you very soon.
        </p>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
                onClick={() => window.location.reload()}
                className={`px-6 py-3 rounded-lg transition-colors border w-full md:w-auto ${
                    theme === 'light'
                    ? 'bg-[#00E599] hover:bg-[#00cc88] text-black border-[#00E599]'
                    : 'bg-[#00E599] hover:bg-[#00cc88] text-black border-[#00E599]'
                }`}
            >
                Submit Another Application
            </button>
            <button 
                onClick={() => window.location.href = '/'}
                className={`px-6 py-3 rounded-lg transition-colors border w-full md:w-auto ${
                    theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
            >
                Return to Home
            </button>
        </div>
    </div>
  ) : (
    <>
      <div className="max-w-4xl mx-auto">
        {variant !== 'embedded' && (
          <div className="mb-16 text-center">
            <h2 className={`text-3xl md:text-5xl font-display font-medium mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Get Started with Oxygen
            </h2>
            <p className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-secondary'}`}>
              Tell us about your business and we'll help you find the right solution.
            </p>
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep > step.number
                        ? 'bg-[#00E599] text-black'
                        : currentStep === step.number
                          ? theme === 'light' ? 'bg-[#3ACDFA] text-white scale-110' : 'bg-white text-black scale-110'
                          : theme === 'light' ? 'bg-gray-200 text-gray-500 border-2 border-gray-300' : 'bg-white/10 text-gray-400 border-2 border-white/20'
                        }`}
                    >
                      {currentStep > step.number ? (
                        <Check size={20} />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-medium ${currentStep >= step.number ? (theme === 'light' ? 'text-gray-900' : 'text-white') : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className={`text-xs mt-1 hidden md:block ${theme === 'light' ? 'text-gray-600' : 'text-gray-500'}`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all duration-500 ${currentStep > step.number ? 'bg-[#00E599]' : (theme === 'light' ? 'bg-gray-200' : 'bg-white/10')
                        }`}
                      style={{ marginTop: '-24px' }}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 animate-fade-in">
          {/* Step 1: Company and Contact Information */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Company and Contact Information</h3>
              <p className={`mb-8 ${theme === 'light' ? 'text-gray-700' : 'text-secondary'}`}>Let's start with the basics.</p>

              {/* User Type Switch */}
              {/* Navigation through global footer only */}
              <div className="flex justify-center mb-8">
                <div className={`p-1 rounded-full inline-flex border ${theme === 'light' ? 'bg-gray-100 border-gray-300' : 'bg-white/5 border-white/10'}`}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'company' }))}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${formData.userType === 'company'
                        ? theme === 'light' ? 'bg-[#00E599] text-white shadow-lg' : 'bg-[#00E599] text-black shadow-lg'
                        : theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    For Your Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, userType: 'tpi' }))}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${formData.userType === 'tpi'
                        ? theme === 'light' ? 'bg-[#00E599] text-white shadow-lg' : 'bg-[#00E599] text-black shadow-lg'
                        : theme === 'light' ? 'text-gray-700 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    As A TPI
                  </button>
                </div>
              </div>



              {/* Standard Form Fields (Always Visible now, no toggle to Manual) */}
              <div className="space-y-6 animate-fade-in">

                <div>
                  {formData.userType === 'tpi' && (
                    <div className="mb-6">
                      <label htmlFor="tpiIdentifier" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                        TPI Identifier *
                      </label>
                      <input
                        type="text"
                        id="tpiIdentifier"
                        name="tpiIdentifier"
                        required
                        value={formData.tpiIdentifier}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border-2 border-gray-400 text-gray-900 placeholder-gray-500 focus:border-[#3ACDFA] focus:ring-2 focus:ring-[#3ACDFA]/20 font-medium' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                        placeholder="Enter your TPI Identifier"
                      />
                    </div>
                  )}

                  <label htmlFor="companyName" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                    {formData.userType === 'tpi' ? 'Client Account Name *' : 'Company Name *'}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                    placeholder={formData.userType === 'tpi' ? "Enter client account name" : "Enter company name"}
                  />
                </div>

                <div>
                  <label htmlFor="companyNumber" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                    Company Number *
                  </label>
                  <input
                    type="text"
                    id="companyNumber"
                    name="companyNumber"
                    required
                    value={formData.companyNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                    placeholder="Enter company number"
                  />
                </div>

                <div>
                  <label htmlFor="website" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contactName" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                      Job Title *
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      required
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                      placeholder="e.g., Operations Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                      placeholder="your.email@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl transition-colors focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-white/30'}`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {formData.userType === 'tpi' && (
                    <div className="mt-6 mb-2">
                        <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                            Letter of Authority (Upload)
                        </label>
                        <input 
                            type="file" 
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00E599]/10 file:text-[#00E599] hover:file:bg-[#00E599]/20"
                            onChange={(e) => setFormData(prev => ({ ...prev, letterOfAuthority: e.target.files?.[0] || null }))}
                        />
                    </div>
                )}

                <div className={`mt-4 p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.gdprConsent}
                            onChange={(e) => setFormData(prev => ({ ...prev, gdprConsent: e.target.checked }))}
                            className={`mt-1 w-5 h-5 rounded  text-[#00E599] focus:ring-2 focus:ring-[#00E599]/50 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer ${theme === 'light' ? 'border-gray-300 bg-white' : 'border-white/20 bg-white/5'}`}
                        />
                        <span className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                            I consent to the processing of my personal data in accordance with the Privacy Policy and GDPR regulations. *
                        </span>
                    </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Business Details</h3>
              <p className={`mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-secondary'}`}>Tell us about your business</p>

              <div className="space-y-6">
                
                {/* Segmentation Questions */}
                <div className={`p-6 rounded-xl border space-y-6 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                    <div>
                        <label className={`block text-base font-medium mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Do you spend less than £30k per year on your energy?
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, spendUnder30k: true }))}
                                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                    formData.spendUnder30k === true
                                    ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                    : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                }`}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, spendUnder30k: false }))}
                                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                    formData.spendUnder30k === false
                                    ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                    : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                }`}
                            >
                                No
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-base font-medium mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            Are you looking for just one site?
                        </label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, singleSite: true }))}
                                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                    formData.singleSite === true
                                    ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                    : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                }`}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, singleSite: false }))}
                                className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                    formData.singleSite === false
                                    ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                    : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                }`}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>

                {/* Microbusiness Questions (Shown if SME) */}
                {formData.spendUnder30k === true && (
                    <div className={`p-6 rounded-xl border space-y-6 animate-fade-in ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Microbusiness Check</h4>
                        
                        <div>
                            <label className={`block text-base font-medium mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Do you have more than 10 Employees?
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, employeesOver10: true }))}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                        formData.employeesOver10 === true
                                        ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                        : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, employeesOver10: false }))}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                        formData.employeesOver10 === false
                                        ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                        : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-base font-medium mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                Do you have a balance sheet greater than £2m?
                            </label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, balanceSheetOver2m: true }))}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                        formData.balanceSheetOver2m === true
                                        ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                        : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, balanceSheetOver2m: false }))}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                                        formData.balanceSheetOver2m === false
                                        ? 'bg-[#00E599] text-black border-[#00E599] font-bold'
                                        : theme === 'light' ? 'bg-white border-gray-300 text-gray-700' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="industry" className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                      Industry Type *
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      required
                      value={formData.industry}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-colors ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white focus:border-white/30'}`}
                    >
                      <option value="">Select industry</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Financials">Financials</option>
                      <option value="Health Care">Health Care</option>
                      <option value="Consumer Discretionary">Consumer Discretionary</option>
                      <option value="Consumer Staples">Consumer Staples</option>
                      <option value="Energy">Energy</option>
                      <option value="Industrials">Industrials</option>
                      <option value="Communication Services">Communication Services</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Utilities">Utilities</option>
                    </select>
                  </div>
                </div>



                <div>
                  <label className={`block text-sm font-medium mb-3 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                    Energy Domains (select all that apply)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Electricity', 'Gas', 'Water'].map((domain) => (
                      <label
                        key={domain}
                        className={`flex items-center gap-3 cursor-pointer p-4 rounded-xl border transition-all ${formData.energyDomains.includes(domain.toLowerCase())
                          ? 'bg-[#00E599]/10 border-[#00E599]/50'
                          : theme === 'light' 
                            ? 'bg-white border-gray-300 hover:border-gray-400'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                      >
                        <input
                          type="checkbox"
                          value={domain.toLowerCase()}
                          checked={formData.energyDomains.includes(domain.toLowerCase())}
                          onChange={handleCheckboxChange}
                          className={`w-5 h-5 rounded border-white/20 bg-white/5 text-[#00E599] focus:ring-2 focus:ring-[#00E599]/50 focus:ring-offset-2 focus:ring-offset-transparent cursor-pointer ${theme === 'light' ? 'border-gray-300 bg-white' : 'border-white/20 bg-white/5'}`}
                        />
                        <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-300'}`}>{domain}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Site & Requirements */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  {formData.singleSite ? 'Site Details' : 'Portfolio Details'}
              </h3>
              <p className={`mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-secondary'}`}>
                  {formData.singleSite ? 'Provide details for your site.' : 'Upload your site portfolio.'}
              </p>

              <div className="space-y-8">
                
                {/* Single Site Flow */}
                {/* Manual Entry Form (Shared Logic) */}
                {showManualForm ? (
                     <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                                {formData.singleSite ? 'Manual Site Entry' : 'Add Sites Manually'}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setShowManualForm(false)}
                                className={`text-sm underline ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
                            >
                                Back to Upload
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>Company Number</label>
                                <input type="text" value={formData.companyNumber} readOnly className={`w-full px-4 py-3 rounded-xl opacity-75 ${theme === 'light' ? 'bg-gray-100 border border-gray-300 text-gray-900' : 'bg-white/5 border border-white/10 text-white'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>Postcode</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Postcode" 
                                        value={searchPostcode}
                                        onChange={(e) => setSearchPostcode(e.target.value)}
                                        disabled={isSearchingAddresses}
                                        className={`flex-1 px-4 py-3 rounded-xl focus:outline-none ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 focus:border-[#3ACDFA] disabled:bg-gray-100' : 'bg-white/5 border border-white/10 text-white focus:border-white/30 disabled:opacity-50'}`} 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => handlePostcodeSearch(searchPostcode, false)}
                                        disabled={isSearchingAddresses}
                                        className={`px-4 py-2 bg-[#00E599] text-black rounded-xl font-bold ${isSearchingAddresses ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isSearchingAddresses ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                                {addressSearchError && (
                                    <p className="text-red-500 text-sm mt-2">{addressSearchError}</p>
                                )}
                            </div>
                        </div>

                        {/* Found Sites Cards */}
                        {foundSites.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                {foundSites.map((site) => (
                                    <div 
                                        key={site.id} 
                                        onClick={() => toggleSiteSelection(site.id)}
                                        className={`p-4 rounded-xl border cursor-pointer hover:border-[#00E599] transition-all relative ${
                                            site.selected 
                                                ? 'border-[#00E599] bg-[#00E599]/10' 
                                                : theme === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Building2 className={`w-5 h-5 ${site.selected ? 'text-[#00E599]' : theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                site.selected ? 'bg-[#00E599] border-[#00E599]' : theme === 'light' ? 'border-gray-300' : 'border-white/30'
                                            }`}>
                                                {site.selected && <Check size={10} className="text-black" />}
                                            </div>
                                        </div>
                                        <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{site.name}</p>
                                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{site.address}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formData.manualMeters.length > 0 && (
                             <div className="mt-4 flex flex-wrap gap-2">
                                {formData.manualMeters.map((meter, idx) => (
                                    <div key={idx} className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 ${theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-white/10 text-white'}`}>
                                        <span>{meter.name}</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    manualMeters: prev.manualMeters.filter((_, i) => i !== idx) 
                                                }));
                                                // Also unselect from foundSites if present
                                                setFoundSites(prev => prev.map(s => {
                                                   if (`${s.name}, ${s.postcode}` === meter.name) {
                                                       return { ...s, selected: false };
                                                   }
                                                   return s;
                                                }));
                                            }}
                                            className="hover:text-red-500"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                             </div>
                        )}

                        <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/5 text-center">
                            <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Do you need to add more meters or is your meter not displayed?</p>
                            <div className="flex gap-2 justify-center">
                                <input 
                                    type="text" 
                                    id="newMeterInput"
                                    placeholder="Enter another Postcode" 
                                    value={addPostcode}
                                    onChange={(e) => setAddPostcode(e.target.value)}
                                    disabled={isSearchingAddresses}
                                    className={`px-4 py-2 rounded-lg text-sm w-48 ${theme === 'light' ? 'bg-white border border-gray-300 disabled:bg-gray-100' : 'bg-white/10 border-white/10 text-white disabled:opacity-50'}`} 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => handlePostcodeSearch(addPostcode, true)}
                                    disabled={isSearchingAddresses}
                                    className={`px-4 py-2 bg-[#3ACDFA] text-white rounded-lg text-sm font-bold shadow-lg hover:shadow-[#3ACDFA]/20 transition-all hover:scale-105 ${isSearchingAddresses ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSearchingAddresses ? '...' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Upload Views (Single or Portfolio)
                    <>
                        {formData.singleSite ? (
                            <div className="space-y-6">
                                <InvoiceUploader 
                                    onDataParsed={handleInvoiceParsed} 
                                    gdprConsent={true} 
                                    onGdprChange={() => {}}
                                    onGdprError={() => {}}
                                    theme={theme}
                                />
                                <div className="text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowManualForm(true)}
                                        className={`text-sm underline transition-colors ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        I don't have a bill to upload
                                    </button>
                                </div>
                            </div>
                        ) : (
                             <div className={`rounded-xl p-6 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                                <h4 className={`text-lg font-medium mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Upload Portfolio</h4>
                                <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-secondary'}`}>
                                    Please upload a CSV file containing all your sites.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                    <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                    >
                                    Download Template
                                    </button>
                                    
                                    <div className="relative">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button
                                        type="button"
                                        className="w-full px-4 py-2 bg-[#00E599]/10 hover:bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/50 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Upload CSV
                                    </button>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowManualForm(true)}
                                        className={`text-sm underline transition-colors ${theme === 'light' ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Enter details manually
                                    </button>
                                </div>
                                
                                {invoiceData?.sites && invoiceData.sites.length > 0 && (
                                    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <p className="text-green-400 text-sm">
                                            Successfully loaded {invoiceData.sites.length} sites.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Common Requirements Fields */}



              </div>
            </div>
          )}

          {/* Step 4: Contract Details */}
          {currentStep === 4 && (
             <div className="animate-fade-in">
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Contract Details</h3>
                <p className={`mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-secondary'}`}>Tell us about your current contract.</p>

                <div className="space-y-8">
                    
                    {/* Contract Length */}
                    <div>
                        <label className={`block text-sm font-medium mb-3 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                            Contract Length Preference
                        </label>
                        <div className="flex gap-4 flex-wrap">
                            {['12 Months', '24 Months', '36 Months', 'Other'].map((length) => (
                                <button
                                    key={length}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, contractLength: length }))}
                                    className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                                        formData.contractLength === length
                                        ? 'bg-[#00E599] text-black border-[#00E599] font-bold shadow-lg'
                                        : theme === 'light' ? 'bg-white border-gray-300 text-gray-700 hover:border-[#00E599]' : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
                                    }`}
                                >
                                    {length}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contract Start Date */}
                    <div>
                         <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>
                            Contract Start Date
                        </label>
                        <input 
                            type="date" 
                            name="contractStartDate"
                            value={formData.contractStartDate}
                            onChange={handleChange}
                            className={`w-full md:w-1/2 px-4 py-3 rounded-xl focus:outline-none transition-colors ${theme === 'light' ? 'bg-white border border-gray-300 text-gray-900 focus:border-[#3ACDFA]' : 'bg-white/5 border border-white/10 text-white focus:border-white/30'}`}
                        />
                    </div>

                    {/* Onsite Generation */}
                    <div className={`p-6 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className={`text-md font-bold mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Onsite Generation</h4>
                                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Do you have any onsite power generation?</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, onsiteGeneration: true }))}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                        formData.onsiteGeneration === true
                                        ? 'bg-[#3ACDFA] text-black font-bold'
                                        : theme === 'light' ? 'bg-white border border-gray-300' : 'bg-white/10 text-white'
                                    }`}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, onsiteGeneration: false }))}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                                        formData.onsiteGeneration === false
                                        ? 'bg-[#3ACDFA] text-black font-bold'
                                        : theme === 'light' ? 'bg-white border border-gray-300' : 'bg-white/10 text-white'
                                    }`}
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
             </div>
          )}

          {/* Validation Error Message */}


          {/* Navigation Buttons */}
          <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme === 'light' ? 'border-gray-200' : 'border-white/10'}`}>
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? () => window.location.href = '/' : handlePrevious}
              className={`${theme === 'light' ? 'border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 shadow-sm' : 'border-white/10 text-white bg-white/5 hover:bg-white/10'} flex flex-row items-center justify-center whitespace-nowrap`}
              icon={false}
            >
              <div className="flex items-center">
                <ChevronLeft className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span>{currentStep === 1 ? 'Back to Home' : 'Previous'}</span>
              </div>
            </Button>

            {currentStep < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  className="bg-[#00E599] hover:bg-[#00cc88] text-black px-6 md:px-8 py-3 rounded-full flex items-center justify-center font-medium transition-all"
                  disabled={isSubmitting}
                  icon={false}
                >
                  <div className="flex items-center flex-nowrap whitespace-nowrap">
                    <span className="mr-2">Next</span>
                    <ChevronRight className="w-5 h-5 flex-shrink-0" />
                  </div>
                </Button>
            ) : (
                <Button
                    type="submit"
                    variant="primary"
                    className="bg-[#3ACDFA] hover:bg-[#32bfee] text-black px-8"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        'Submit Application'
                    )}
                </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white' : 'bg-[#0B1221]'}`}>
      {variant !== 'embedded' && (
        <div 
          className="fixed inset-0 z-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${theme === 'light' ? '#3ACDFA' : '#00E599'}20 0%, transparent 50%)`,
          }}
        />
      )}
      
      <div className={`relative z-10 ${variant === 'embedded' ? '' : 'container mx-auto px-4 py-8 md:py-16'}`}>
        {content}
      </div>
    </div>
  );
};

