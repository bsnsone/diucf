function handleKey(event) {
  if (event.key === "Enter") {
    fetchProfile();
  }
}

function fetchProfile() {
  const handle = document.getElementById('handleInput').value.trim();
  if (!handle) return;

  const card = document.getElementById('profile-card');
  
  fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
    .then(res => res.json())
    .then(data => {
      const user = data.result[0];

      document.getElementById('avatar').src = user.avatar;
      document.getElementById('handle').textContent = user.handle;
      document.getElementById('rating').textContent = `Rating: ${user.rating ?? 'N/A'}`;
      const location = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('location').textContent = `Location: ${location}`;
      document.getElementById('max-rating').textContent = `Max Rating: ${user.maxRating ?? 'N/A'}`;

      // Capitalize the first letter of the rank name
      const rankName = user.rank
        ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1).toLowerCase()
        : 'N/A';
      document.getElementById('rank-name').textContent = `Rank Name: ${rankName}`;

      const rankElem = document.getElementById('rank');
      const ratingElem = document.getElementById('rating');
      const rankNameElem = document.getElementById('rank-name');

      // Reset classes
      card.className = 'card';
      rankElem.className = 'rank';
      ratingElem.className = '';
      rankNameElem.className = '';

      const rank = user.rank?.toLowerCase().replace(/\s/g, '-');
      if (rank) {
        card.classList.add(rank);
        rankElem.classList.add(rank);
        ratingElem.classList.add(rank);
        rankNameElem.classList.add(rank);
        rankElem.textContent = rankName;
      } else {
        rankElem.textContent = 'Unrated';
      }

      // Show the card after successful fetch
      card.style.display = 'flex';
    })
    .catch(err => {
      console.error('Failed to load user info:', err);
      alert('Invalid handle or failed to fetch data.');
      // Ensure card remains hidden on error
      card.style.display = 'none';
    });
}
