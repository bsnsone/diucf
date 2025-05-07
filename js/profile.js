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

function resetCardClasses() {
  const card = document.getElementById('profile-card');
  const elements = [
    'handle-value', 'rank-value', 'rating-value', 'location-value',
    'organization-value', 'friend-count-value', 'max-rating-value', 'rank-name-value'
  ].map(id => document.getElementById(id));

  card.className = 'card';
  elements.forEach(elem => elem.className = '');
}

function fetchProfile() {
  const handle = document.getElementById('handleInput').value.trim();
  if (!handle) {
    alert('Please enter a valid Codeforces handle.');
    return;
  }

  const card = document.getElementById('profile-card');
  const button = document.querySelector('.input-group button');
  button.disabled = true;
  button.textContent = 'Loading...';

  fetch(`https://codeforces.com/api/user.info?handles=${handle}`)
    .then(res => {
      if (!res.ok) throw new Error('User not found or invalid handle.');
      return res.json();
    })
    .then(data => {
      if (data.status !== 'OK') throw new Error(data.comment || 'Failed to fetch user data.');
      const user = data.result[0];

      let avatarUrl = user.avatar;
      if (avatarUrl && avatarUrl.includes('/50/')) {
        avatarUrl = avatarUrl.replace('/50/', '/200/');
      } else if (user.titlePhoto) {
        avatarUrl = user.titlePhoto;
      }
      document.getElementById('avatar').src = avatarUrl || 'https://via.placeholder.com/200';

      document.getElementById('handle-value').textContent = user.handle;
      document.getElementById('rating-value').textContent = user.rating ?? 'N/A';
      document.getElementById('location-value').textContent = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('organization-value').textContent = user.organization || 'N/A';
      document.getElementById('friend-count-value').textContent = user.friendOfCount ?? 'N/A';
      document.getElementById('max-rating-value').textContent = user.maxRating ?? 'N/A';

      const rankName = user.rank
        ? user.rank.charAt(0).toUpperCase() + user.rank.slice(1).toLowerCase()
        : 'N/A';
      document.getElementById('rank-value').textContent = rankName;

      const maxRankName = user.maxRating ? getRankNameByRating(user.maxRating) : 'N/A';
      document.getElementById('rank-name-value').textContent = maxRankName;

      resetCardClasses();

      const currentRank = user.rank?.toLowerCase().replace(/\s/g, '-');
      const maxRank = getRankByRating(user.maxRating);
      if (currentRank) {
        card.classList.add(currentRank);
        document.getElementById('handle-value').classList.add(`rank-color-${currentRank}`);
        document.getElementById('rank-value').classList.add(`rank-color-${currentRank}`);
        document.getElementById('rating-value').classList.add(`rank-color-${currentRank}`);
        document.getElementById('max-rating-value').classList.add(`rank-color-${maxRank || currentRank}`);
        document.getElementById('rank-name-value').classList.add(`rank-color-${maxRank || currentRank}`);
      } else {
        document.getElementById('rank-value').textContent = 'Unrated';
        document.getElementById('rank-name-value').textContent = 'Unrated';
      }

      card.style.display = 'flex';
      fetchRatingsFromHandle(handle); // Fetch contest history
    })
    .catch(err => {
      console.error('Failed to load user info:', err);
      alert(err.message);
      document.getElementById('handleInput').value = '';
      card.style.display = 'none';
      document.getElementById('tableContainer').innerHTML = '';
    })
    .finally(() => {
      button.disabled = false;
      button.textContent = 'View';
    });
}

function getRatingClass(rating) {
  if (rating >= 3000) return "legendary";
  if (rating >= 2400) return "red";
  if (rating >= 2100) return "orange";
  if (rating >= 1900) return "violet";
  if (rating >= 1600) return "blue";
  if (rating >= 1400) return "cyan";
  if (rating >= 1200) return "green";
  return "gray";
}

async function fetchRatingsFromHandle(handle) {
  const tableContainer = document.getElementById('tableContainer');
  tableContainer.innerHTML = '<p>Loading contests...</p>';

  try {
    const response = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
    const result = await response.json();

    if (result.status !== 'OK') {
      tableContainer.innerHTML = `<p style="color:red;">${result.comment || 'Invalid handle'}</p>`;
      return;
    }

    const data = result.result;
    if (data.length === 0) {
      tableContainer.innerHTML = '<p>No rating data available.</p>';
      return;
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th># (ID)</th>
            <th>Contest</th>
            <th>Start time</th>
            <th>Rank</th>
            <th>Rating change</th>
            <th>New rating</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      const date = new Date(item.ratingUpdateTimeSeconds * 1000);
      const formattedTime = date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const ratingDiff = item.newRating - item.oldRating;
      const diffColor = ratingDiff >= 0 ? 'green' : 'red';
      const ratingClass = getRatingClass(item.newRating);

      html += `
        <tr>
          <td>${i + 1} (${item.contestId})</td>
          <td><a href="https://codeforces.com/contest/${item.contestId}" target="_blank">${item.contestName}</a></td>
          <td>${formattedTime}</td>
          <td>${item.rank}</td>
          <td class="bold" style="color: ${diffColor};">${ratingDiff >= 0 ? '+' : ''}${ratingDiff}</td>
          <td class="bold ${ratingClass}">${item.newRating}</td>
        </tr>
      `;
    }

    html += `</tbody></table>`;
    tableContainer.innerHTML = html;
  } catch (err) {
    tableContainer.innerHTML = '<p style="color:red;">Error fetching contest data.</p>';
  }
}
