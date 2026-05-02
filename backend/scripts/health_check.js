// Native fetch is available in Node 18+

async function checkServer() {
    console.log("Checking Backend Server Health...");
    try {
        // 1. Check Root
        console.log("Pinging http://localhost:5000/...");
        const res = await fetch('http://localhost:5000/');
        if (res.ok) {
            console.log("✅ Server Root is UP:", await res.text());
        } else {
            console.log("❌ Server Root returned:", res.status, res.statusText);
        }

        // 2. Check Inquiry History Endpoint
        console.log("\nChecking /api/inquiries/history...");
        const res2 = await fetch('http://localhost:5000/api/inquiries/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com' })
        });

        if (res2.ok) {
            console.log("✅ API Endpoint is UP. Status:", res2.status);
            const data = await res2.json();
            console.log("Response:", JSON.stringify(data).substring(0, 100) + "...");
        } else {
            console.log("❌ API Endpoint returned:", res2.status, res2.statusText);
            const text = await res2.text();
            console.log("Error Body:", text);
        }

    } catch (error) {
        console.error("❌ CRITICAL: Could not connect to server.", error.message);
        console.log("Possible causes: Server crashed, Port 5000 blocked, or Database connection failed.");
    }
}

checkServer();
