import Script from 'next/script';

const ZohoSalesIQ = () => {
    return (
        <>
            <Script
                id="zoho-salesiq-init"
                strategy="afterInteractive"
            >
                {`
                    window.$zoho = window.$zoho || {};
                    $zoho.salesiq = $zoho.salesiq || { ready: function() {} };
                `}
            </Script>
            <Script
                id="zsiqscript"
                src="https://salesiq.zohopublic.in/widget?wc=siq73ed13296d6787b5c7cd801e31df38abb1cd60eda246195b001e45db98120d65efd9a5957b15c7d852e21e95f965d89f"
                strategy="afterInteractive"
                defer
            />
        </>
    );
};

export default ZohoSalesIQ;
