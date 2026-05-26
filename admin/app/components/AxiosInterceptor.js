'use client';
import { useEffect } from 'react';
import axios from 'axios';

let interceptorSetup = false;

export default function AxiosInterceptor({ children }) {
    if (!interceptorSetup && typeof window !== 'undefined') {
        interceptorSetup = true;
        
        const MAX_CONCURRENT_REQUESTS = 5;
        let activeRequests = 0;
        const queue = [];

        axios.interceptors.request.use((config) => {
            return new Promise((resolve) => {
                const executeRequest = () => {
                    activeRequests++;
                    resolve(config);
                };

                if (activeRequests < MAX_CONCURRENT_REQUESTS) {
                    executeRequest();
                } else {
                    queue.push(executeRequest);
                }
            });
        });

        axios.interceptors.response.use(
            (response) => {
                activeRequests = Math.max(0, activeRequests - 1);
                if (queue.length > 0) {
                    const nextRequest = queue.shift();
                    nextRequest();
                }
                return response;
            },
            (error) => {
                activeRequests = Math.max(0, activeRequests - 1);
                if (queue.length > 0) {
                    const nextRequest = queue.shift();
                    nextRequest();
                }
                return Promise.reject(error);
            }
        );
    }

    return <>{children}</>;
}
