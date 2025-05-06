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
      document.getElementById('handle-value').textContent = user.handle;
      document.getElementById('rating-value').textContent = user.rating ?? 'N/A';
      const location = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('location').textContent = `Location: ${location}`;
      document.getElementById('max-rating-value').textContent = user.maxRating ?? 'N/A';

      // Capitalize the first letter of the rank name
      const rankName = user.rank
        ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1).toLowerCase()
        : 'N/A';
      document.getElementById('rank-value').textContent = rankName;
      document.getElementById('rank-name-value').textContent = rankName;

      const handleElem = document.getElementById('handle-value');
      const rankElem = document.getElementById('rank-value');
      const ratingElem = document.getElementById('rating-value');
      const maxRatingElem = document.getElementById('max-rating-value');
      const rankNameElem = document.getElementById('rank-name-value');

      // Reset classes
      card.className = 'card';
      handleElem.className = '';
      rankElem.className = '';
      ratingElem.className = '';
      maxRatingElem.className = '';
      rankNameElem.className = '';

      const rank = user.rank?.toLowerCase().replace(/\s/g, '-');
      if (rank) {
        card.classList.add(rank);
        handleElem.classList.add(`rank-color-${rank}`);
        rankElem.classList.add(`rank-color-${rank}`);
        ratingElem.classList.add(`rank-color-${rank}`);
        maxRatingElem.classList.add(`rank-color-${rank}`);
        rankNameElem.classList.add(`rank-color-${rank}`);
      } else {
        rankElem.textContent = 'Unrated';
        rankNameElem.textContent = 'Unrated';
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
