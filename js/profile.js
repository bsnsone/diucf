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
      document.getElementById('location-value').textContent = [user.city, user.country].filter(Boolean).join(', ') || 'N/A';
      document.getElementById('organization-value').textContent = user.organization || 'N/A';
      document.getElementById('friend-count-value').textContent = user.friendOfCount ?? 'N/A';
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
      const locationElem = document.getElementById('location-value');
      const organizationElem = document.getElementById('organization-value');
      const friendCountElem = document.getElementById('friend-count-value');
      const maxRatingElem = document.getElementById('max-rating-value');
      const rankNameElem = document.getElementById('rank-name-value');

      // Reset classes
      card.className = 'card';
      handleElem.className = '';
      rankElem.className = '';
      ratingElem.className = '';
      locationElem.className = '';
      organizationElem.className = '';
      friendCountElem.className = '';
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
      
      // Now fetch contests data
      fetchUserContests(handle);
    })
    .catch(err => {
      console.error('Failed to load user info:', err);
      alert('Invalid handle or failed to fetch data.');
      // Ensure card remains hidden on error
      card.style.display = 'none';
    });
}

function fetchUserContests(handle) {
  const url = `https://codeforces.com/api/user.rating?handle=${handle}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.status === 'OK') {
        displayContests(data.result);
      } else {
        document.getElementById('contestResults').innerHTML = '<p>No contests found for this user.</p>';
      }
    })
    .catch(error => {
      console.error('Error fetching contests:', error);
      document.getElementById('contestResults').innerHTML = '<p>Failed to fetch contests. Please try again later.</p>';
    });
}

function displayContests(contests) {
  const contestResultsContainer = document.getElementById('contestResults');
  contestResultsContainer.innerHTML = ''; // Clear previous results
  
  // Create the header row for the column titles
  const headerRow = document.createElement('div');
  headerRow.classList.add('contest-header');

  const columns = ['Contest', 'Start Time', 'Rank', 'Solved', 'Rating Change', 'New Rating'];
  columns.forEach(col => {
    const column = document.createElement('div');
    column.classList.add('contest-header-item');
    column.textContent = col;
    headerRow.appendChild(column);
  });

  contestResultsContainer.appendChild(headerRow);

  contests.forEach(contest => {
    const contestElement = document.createElement('div');
    contestElement.classList.add('contest');

    // Contest number (ID)
    const contestNumber = document.createElement('div');
    contestNumber.classList.add('contest-item');
    contestNumber.textContent = contest.contestId ?? 'N/A';

    // Start time (handle possible invalid date)
    const startTime = document.createElement('div');
    startTime.classList.add('contest-item');
    if (contest.startTime && !isNaN(contest.startTime)) {
      const startDate = new Date(contest.startTime * 1000); // Convert from Unix timestamp (seconds)
      startTime.textContent = startDate.toLocaleString(); // Format to local date string
    } else {
      startTime.textContent = 'N/A'; // Placeholder if start time is invalid
    }

    // Rank
    const rank = document.createElement('div');
    rank.classList.add('contest-item');
    rank.textContent = contest.rank ?? 'N/A';

    // Solved problems
    const solved = document.createElement('div');
    solved.classList.add('contest-item');
    solved.textContent = contest.solved ?? 'N/A';

    // Rating change
    const ratingChange = document.createElement('div');
    ratingChange.classList.add('contest-item');
    ratingChange.textContent = contest.ratingChange !== undefined ? `${contest.ratingChange >= 0 ? '+' : ''}${contest.ratingChange}` : 'N/A';

    // New rating
    const newRating = document.createElement('div');
    newRating.classList.add('contest-item');
    newRating.textContent = contest.newRating ?? 'N/A';

    // Append all elements to contestElement
    contestElement.appendChild(contestNumber);
    contestElement.appendChild(startTime);
    contestElement.appendChild(rank);
    contestElement.appendChild(solved);
    contestElement.appendChild(ratingChange);
    contestElement.appendChild(newRating);

    contestResultsContainer.appendChild(contestElement);
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
  tableContainer.innerHTML = ''; // Clear old content

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
      date.setHours(date.getUTCHours() + 6); // UTC+6
      const formattedTime = date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' UTC+6';

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
    tableContainer.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
}

