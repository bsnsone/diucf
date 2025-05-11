export default async function handler(req, res) {
    let { handle } = req.query;

    if (!handle) {
        return res.status(400).json({ error: "Missing handle parameter" });
    }

    // Handle could be a single string or a stringified array
    let handles = [];

    try {
        if (handle.startsWith("[") && handle.endsWith("]")) {
            // Convert string '[a,b]' to array
            handles = JSON.parse(handle.replace(/'/g, '"'));
        } else {
            handles = [handle];
        }
    } catch (err) {
        return res.status(400).json({ error: "Invalid handle format" });
    }

    try {
        const joinedHandles = handles.join(";");
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${joinedHandles}`);
        const data = await response.json();

        if (data.status !== "OK") {
            return res.status(404).json({ error: "One or more users not found" });
        }

        const getRankByRating = (rating) => {
            if (rating < 1200) return 'newbie';
            if (rating < 1400) return 'pupil';
            if (rating < 1600) return 'specialist';
            if (rating < 1900) return 'expert';
            if (rating < 2100) return 'candidate-master';
            if (rating < 2300) return 'master';
            if (rating < 2400) return 'international-master';
            if (rating < 2600) return 'grandmaster';
            if (rating < 2900) return 'international-grandmaster';
            return 'legendary-grandmaster';
        };

        const colorMap = {
            "newbie": "#999999",
            "pupil": "#16b316",
            "specialist": "#1a98a6",
            "expert": "#0000ff",
            "candidate-master": "#b925b9",
            "master": "#ffab03",
            "international-master": "#ff9900",
            "grandmaster": "#ff0000",
            "international-grandmaster": "#ff0000",
            "legendary-grandmaster": "#ff0000"
        };

        const results = data.result.map(user => {
            const rating = user.rating || 0;
            const rank = getRankByRating(rating);
            const color = colorMap[rank];
            return {
                handle: user.handle,
                rank,
                color
            };
        });

        // If only one handle and not array form, return single object for compatibility
        if (handles.length === 1 && !Array.isArray(JSON.parse(handle.replace(/'/g, '"')))) {
            return res.status(200).json(results[0]);
        }

        return res.status(200).json(results);

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch user data" });
    }
}
