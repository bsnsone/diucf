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

      const responseBody = await response.text();
      if (responseBody) {
          const jsonResponse = JSON.parse(responseBody);
          console.log("Handle added:", jsonResponse);
      }

      document.getElementById("newHandle").value = ""; // Clear the input
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
    const res = await fetch("https://codeforces.com/api/contest.list?gym=false");
    const data = await res.json();
    if (data.status !== "OK") return;
    const recentContests = data.result.filter(c => c.phase === "FINISHED").slice(0, 30);
    const select = document.getElementById("contestSelect");
    select.innerHTML = "";
    recentContests.forEach(contest => {
      const option = document.createElement("option");
      option.value = contest.id;
      option.textContent = contest.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Failed to fetch contest list", err);
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
    const handles = await fetchHandlesFromDB();
    if (handles.length === 0) {
      resultDiv.innerHTML = "No handles found in database.";
      return;
    }

    const ratingRes = await fetch(`https://codeforces.com/api/contest.ratingChanges?contestId=${contestId}`);
    const ratingData = await ratingRes.json();
    if (ratingData.status !== "OK") {
      resultDiv.innerHTML = "Rating changes are not available for this contest yet.";
      return;
    }

    const changes = ratingData.result.filter(entry => handles.includes(entry.handle));
    if (changes.length === 0) {
      resultDiv.innerHTML = "No rating data available for the specified users.";
      return;
    }

    const contestRes = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`);
    const contestData = await contestRes.json();
    const contestName = contestData.status === "OK" ? contestData.result.contest.name : `Contest ${contestId}`;

    let html = `<div class="contest-title">${contestName}</div><table><thead><tr><th>Rank</th><th>Handle</th><th>Old Rating</th><th>New Rating</th><th>Δ Change</th></tr></thead><tbody>`;
    changes.forEach(change => {
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
