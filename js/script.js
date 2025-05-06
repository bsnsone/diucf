const supabaseUrl = "https://yvcxjijotyiyvwhcgcrh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Y3hqaWpvdHlpeXZ3aGNnY3JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0ODk0OTAsImV4cCI6MjA2MjA2NTQ5MH0.Xk16aqTZZyiNUoFYmXgb6PauNxTZ-PwrOfH-6bvzl-U";

// Fetch handles from the database
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

// Add a handle
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

    const responseBody = await response.text();  // Use text to avoid JSON parsing errors
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

// Remove a handle
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

// Additional functions for handling ratings and other interactions will be added as needed
