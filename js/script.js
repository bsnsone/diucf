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

async function addHandle() {
    const handle = document.getElementById("newHandle").value.trim();
    if (!handle) return;

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/handles`, {
            method: "POST",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ handle })
        });

        if (!response.ok) {
            throw new Error("Failed to add handle");
        }

        document.getElementById("newHandle").value = "";
        alert("Handle added!");
    } catch (error) {
        console.error("Error adding handle:", error);
        alert("An error occurred while adding the handle. Please try again.");
    }
}

async function removeHandle() {
    const handle = document.getElementById("newHandle").value.trim();
    if (!handle) return;

    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/handles?handle=eq.${handle}`, {
            method: "DELETE",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });
        if (res.ok) {
            alert("Handle removed!");
            document.getElementById("newHandle").value = "";
        } else {
            alert("Failed to remove handle.");
        }
    } catch (err) {
        console.error("Error removing handle:", err);
    }
}

function toggleMode() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    document.getElementById('inputById').style.display = mode === 'id' ? 'flex' : 'none';
    document.getElementById('inputByDropdown').style.display = mode === 'dropdown' ? 'flex' : 'none';
}

async function populateContestList() {
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/contest_ratings?select=contest_id,contest_name&order=created_at.desc`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });
        const contests = await res.json();
        const select = document.getElementById("contestSelect");
        select.innerHTML = "";
        contests.forEach(contest => {
            const option = document.createElement("option");
            option.value = contest.contest_id;
            option.textContent = contest.contest_name;
            select.appendChild(option);
        });
        if (contests.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No contests available";
            select.appendChild(option);
        }
    } catch (err) {
        console.error("Failed to fetch contest list from database:", err);
        const select = document.getElementById("contestSelect");
        select.innerHTML = '<option value="">Error loading contests</option>';
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

        // Refresh dropdown after loading
        await populateContestList();
    } catch (error) {
        console.error("Error loading contests:", error);
        addLog("Error loading contests. Please try again.");
    }
}

async function checkRatingFromDropdown() {
    const id = document.getElementById("contestSelect").value;
    checkRating(id);
}

async function checkRating(forcedId = null) {
    const contestId = forcedId || document.getElementById("contestId").value.trim();
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Checking...";

    if (!contestId) {
        resultDiv.innerHTML = "Please enter or select a valid contest ID.";
        return;
    }

    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/contest_ratings?contest_id=eq.${contestId}&select=contest_name,rating_data`, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`
            }
        });
        const data = await res.json();

        if (data.length === 0) {
            resultDiv.innerHTML = "No data found for this contest. Try loading latest contests.";
            return;
        }

        const { contest_name, rating_data } = data[0];
        if (rating_data.length === 0) {
            resultDiv.innerHTML = "No rating data available for the specified users.";
            return;
        }

        let html = `<div class="contest-title">${contest_name}</div><table><thead><tr><th>Rank</th><th>Handle</th><th>Old Rating</th><th>New Rating</th><th>Δ Change</th></tr></thead><tbody>`;
        rating_data.forEach(change => {
            const delta = change.newRating - change.oldRating;
            const deltaClass = delta > 0 ? "delta-positive" : delta < 0 ? "delta-negative" : "delta-zero";
            const sign = delta > 0 ? "+" : "";
            html += `<tr><td>${change.rank}</td><td>${change.handle}</td><td>${change.oldRating}</td><td>${change.newRating}</td><td class="${deltaClass}">${sign}${delta}</td></tr>`;
        });
        html += `</tbody></table>`;
        resultDiv.innerHTML = html;
    } catch (error) {
        resultDiv.innerHTML = "Error fetching data. Please try again later.";
        console.error(error);
    }
}

window.onload = populateContestList;
