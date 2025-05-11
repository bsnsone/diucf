// api/getRating.js

export default async function handler(req, res) {
    const { handle } = req.query;

    if (!handle) {
        return res.status(400).json({ error: "Missing handle parameter" });
    }

    try {
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const data = await response.json();

        if (data.status !== "OK") {
            return res.status(404).json({ error: "User not found" });
        }

        const rating = data.result[0].rating || 0;

        // Map rating to color (Codeforces style)
        let color = "gray";
        if (rating >= 3000) color = "legendary";
        else if (rating >= 2600) color = "red";
        else if (rating >= 2400) color = "orange";
        else if (rating >= 2100) color = "violet";
        else if (rating >= 1900) color = "blue";
        else if (rating >= 1600) color = "cyan";
        else if (rating >= 1400) color = "green";
        else if (rating >= 1200) color = "lime";
        else color = "gray";

        res.status(200).json({ color });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
}
