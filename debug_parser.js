const text = `Property Name	AddressLine1	City	Postcode	Type	start_date	end_date	Market Identifier	Service Type	Supply Status	Annual Consumption	Product	Margin Value	Tax Exemption
Riverside Apartments	12 Riverbank Close	Great Britain	G4 0HF	Site	2026-07-01	2027-06-30	21102455890124	Gas	Active	14500	Bloc and Index	5	0
Hilltop Offices	88 Summit Road	Great Britain	EH7 5QJ	Site	2026-07-01	2027-06-30	21102455890567	Gas	Active	32000	Bloc and Index	5.75	0.5
Maple Court	5 Maple Street	Great Britain	M15 4DN	Site	2026-07-01	2027-06-30	21102455890882	Gas	Inactive	9800	Bloc and Index	6.5	0.7`;

// Auto-detect delimiter
const delimiter = text.includes('\t') ? '\t' : ',';
const rows = text.split(/\r?\n/).map(row => row.split(delimiter));
const headers = rows[0].map(h => h.trim());

const sitesMap = new Map();

rows.slice(1).forEach(row => {
    if (!row || row.length === 0 || row.join('').trim() === '') return;
    
    const getAnyValue = (headerAliases) => {
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
    const city = getAnyValue(['City', 'Town']);
    const postcode = getAnyValue(['Postcode', 'Post Code', 'PostalCode', 'Postal Code']);
    const marketIdentifier = getAnyValue(['market_identifier', 'Market Identifier', 'MarketIdentifier', 'GTCX_Market_Identifier__c', 'Service Point']);
    
    console.log(`Row parsing: siteName=${siteName}, mpan=${marketIdentifier}`);

    if (!sitesMap.has(siteName)) {
        sitesMap.set(siteName, { name: siteName, meterPoints: [] });
    }
    if (marketIdentifier) {
        sitesMap.get(siteName).meterPoints.push({ mpan: marketIdentifier });
    }
});

console.log(`Total sites: ${sitesMap.size}`);
