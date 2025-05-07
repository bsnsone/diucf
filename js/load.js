const supabaseUrl = "https://yvcxjijotyiyvwhcgcrh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Y3hqaWpvdHlpeXZ3aGNnY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODk0OTAsImV4cCI6MjA2MjA2NTQ5MH0.Xk16aqTZZyiNUoFYmXgb6PauNxTZ-PwrOfH-6bvzl-U";

async function fetchHandlesFromDB() {
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/handles`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
            }
        });
        const data = await res.json();
        return data.map(row => row.handle);
    } catch (err) {
        console.error("Error fetching handles:", err);
        return [];
    }
}

async function loadLatestContests() {
    const logDiv = document.getElementById("loadLogs");
    logDiv.innerHTML = "";
    const addLog = (message) => {
        const log = document.createElement("div");
        log.className = "log";
        log.textContent = message;
        logDiv.appendChild(log);
    };

    try {
        // Fetch handles
        const handles = await fetchHandlesFromDB();
        if (handles.length === 0) {
            addLog("No handles found in database.");
            return;
        }

        // Fetch latest 15 contests
        const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
        const data = await res.json();
        if (data.status !== "OK") {
            addLog("Failed to fetch contest list.");
            return;
        }
        const recentContests = data.result.filter(c => c.phase === "FINISHED").slice(0, 15);

        // Fetch existing contests in DB
        const existingContestsRes = await fetch(`${supabaseUrl}/rest/v1/contest_ratings?select=contest_id`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });
        const existingContests = await existingContestsRes.json();
        const existingContestIds = existingContests.map(c => c.contest_id);

        // Process each contest exactly once
        const processedContests = new Set();
        for (const contest of recentContests) {
            if (processedContests.has(contest.id)) continue;
            processedContests.add(contest.id);

            if (!existingContestIds.includes(contest.id)) {
                // Fetch rating changes for handles
                const ratingRes = await fetch(`https://codeforces.com/api/contest.ratingChanges?contestId=${contest.id}`);
                const ratingData = await ratingRes.json();
                if (ratingData.status !== "OK") {
                    addLog(`Rating changes not available for contest ${contest.name}.`);
                    continue;
                }

                const changes = ratingData.result.filter(entry => handles.includes(entry.handle));
                if (changes.length === 0) {
                    addLog(`No rating data for handles in contest ${contest.name}.`);
                    continue;
                }

                // Insert new contest data
                await fetch(`${supabaseUrl}/rest/v1/contest_ratings`, {
                    method: "POST",
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contest_id: contest.id,
                        contest_name: contest.name,
                        rating_data: changes
                    })
                });

                addLog(`Successfully loaded contest ${contest.name}.`);
            } else {
                addLog(`Contest ${contest.name} already in database.`);
            }
        }

        // Delete oldest contest if more than 15
        const allContestsRes = await fetch(`${supabaseUrl}/rest/v1/contest_ratings?select=id&order=created_at.asc`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });
        const allContests = await allContestsRes.json();
        if (allContests.length > 15) {
            const oldestContest = allContests[0];
            await fetch(`${supabaseUrl}/rest/v1/contest_ratings?id=eq.${oldestContest.id}`, {
                method: "DELETE",
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`
                }
            });
            addLog("Deleted oldest contest to maintain 15 latest contests.");
        }
    } catch (error) {
        console.error("Error loading contests:", error);
        addLog("Error loading contests. Please try again.");
    }
}
