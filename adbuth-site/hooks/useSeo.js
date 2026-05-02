import { useState, useEffect } from 'react';
import axios from 'axios';

const useSeo = (pageIdentifier) => {
    const [seoData, setSeoData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeo = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${apiUrl}/api/seo/pages`);

                // Find the specific page SEO data
                const pageSeo = res.data.find(page => page.page_identifier === pageIdentifier);

                if (pageSeo) {
                    setSeoData(pageSeo);
                }
            } catch (error) {
                console.error(`Failed to fetch SEO for ${pageIdentifier}:`, error);
            } finally {
                setLoading(false);
            }
        };

        if (pageIdentifier) {
            fetchSeo();
        }
    }, [pageIdentifier]);

    return { seoData, loading };
};

export default useSeo;
