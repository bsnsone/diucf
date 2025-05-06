function handleKey(event) {
  if (event.key === "Enter") {
    fetchProfile();
  }
}

function fetchProfile() {
  const handle = document.getElementById('handleInput').value.trim();
  if (!handle) return;

  fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
    .then(res => res.json())
    .then(data => {
      const user = data.result[0];

      document.getElementById('avatar').src = user.avatar;
      document.getElementById('handle').textContent = user.handle;
      document.getElementById('rating').textContent = `Rating: ${user.rating ?? 'N/A'}`;
      // Combine city and country for location
      const location = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('location').textContent = `Location: ${location}`;
      document.getElementById('max-rating').textContent = `Max Rating: ${user.maxRating ?? 'N/A'}`;

      // Capitalize the first letter of the rank name
      const rankName = user.rank
        ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1).toLowerCase()
        : 'N/A';
      document.getElementById('rank-name').textContent = `Rank Name: ${rankName}`;

      const card = document.getElementById('profile-card');
      const rankElem = document.getElementById('rank');

      // Reset classes
      card.className = 'card';
      rankElem.className = 'rank';

      const rank = user.rank?.toLowerCase().replace(/\s/g, '-');
      if (rank) {
        card.classList.add(rank);
        rankElem.classList.add(rank);
        // Capitalize the first letter for the rank display
        rankElem.textContent = rankName;
      } else {
        rankElem.textContent = 'Unrated';
      }
    })
    .catch(err => {
      console.error('Failed to load user info:', err);
      alert('Invalid handle or failed to fetch data.');
    });
}
