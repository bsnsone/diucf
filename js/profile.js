function handleKey(event) {
  if (event.key === "Enter") {
    fetchProfile();
  }
}

function getRankByRating(rating) {
  if (!rating) return null;
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
}

function getRankNameByRating(rating) {
  const rank = getRankByRating(rating);
  if (!rank) return 'N/A';
  return rank.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function fetchProfile() {
  const handle = document.getElementById('handleInput').value.trim();
  if (!handle) return;

  const card = document.getElementById('profile-card');
  
  fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
    .then(res => res.json())
    .then(data => {
      const user = data.result[0];

      // Attempt to get a higher-resolution avatar
      let avatarUrl = user.avatar;
      if (avatarUrl && avatarUrl.includes('/50/')) {
        avatarUrl = avatarUrl.replace('/50/', '/200/');
      } else if (user.titlePhoto) {
        avatarUrl = user.titlePhoto;
      }
      document.getElementById('avatar').src = avatarUrl || 'https://via.placeholder.com/200';

      document.getElementById('handle-value').textContent = user.handle;
      document.getElementById('rating-value').textContent = user.rating ?? 'N/A';
      const location = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('location').textContent = `Location: ${location}`;
      document.getElementById('max-rating-value').textContent = user.maxRating ?? 'N/A';

      // Capitalize the first letter of the current rank name
      const rankName = user.rank
        ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1).toLowerCase()
        : 'N/A';
      document.getElementById('rank-value').textContent = rankName;

      // Calculate rank name for max rating
      const maxRankName = user.maxRating ? getRankNameByRating(user.maxRating) : 'N/A';
      document.getElementById('rank-name-value').textContent = maxRankName;

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

      const currentRank = user.rank?.toLowerCase().replace(/\s/g, '-');
      const maxRank = getRankByRating(user.maxRating);
      if (currentRank) {
        card.classList.add(currentRank);
        handleElem.classList.add(`rank-color-${currentRank}`);
        rankElem.classList.add(`rank-color-${currentRank}`);
        ratingElem.classList.add(`rank-color-${currentRank}`);
        maxRatingElem.classList.add(`rank-color-${maxRank || currentRank}`);
        rankNameElem.classList.add(`rank-color-${maxRank || currentRank}`);
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
