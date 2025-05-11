const defaultApiKey = 'c7628a4be9a2cf8306c0c7abc61c824a21357935';
const defaultApiSecret = '5668f12542e06a6ee37c81205627f238fea2d0c0';

function generateURL() {
  const method = 'user.friends';
  const apiKeyInput = document.getElementById('api-key').value.trim();
  const apiSecretInput = document.getElementById('api-secret').value.trim();
  const onlyOnline = document.getElementById('friend-filter').value;
  const apiKey = apiKeyInput || defaultApiKey;
  const apiSecret = apiSecretInput || defaultApiSecret;
  const time = Math.floor(Date.now() / 1000);
  const rand = Array.from({length: 6}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
  const params = `apiKey=${apiKey}&onlyOnline=${onlyOnline}&time=${time}`;
  const toHash = `${rand}/${method}?${params}#${apiSecret}`;
  const hash = CryptoJS.SHA512(toHash).toString();
  const apiSig = rand + hash;
  return `https://codeforces.com/api/${method}?${params}&apiSig=${apiSig}`;
}

function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function clearError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = '';
  errorDiv.style.display = 'none';
}

function showLoading() {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'block';
}

function hideLoading() {
  const loadingDiv = document.getElementById('loading');
  loadingDiv.style.display = 'none';
}

function getRankByRating(rating) {
  if (!rating || rating === 0) return 'unrated';
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

async function fetchFriends() {
  const url = generateURL();
  clearError();
  showLoading();

  try {
    // Fetch friends list
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      const friends = data.result;
      
      // Fetch all friends' information in a single call
      const handles = friends.join(';');
      const userInfoResponse = await fetch(`https://codeforces.com/api/user.info?handles=${handles}`);
      const userInfoData = await userInfoResponse.json();
      
      const userMap = new Map();
      if (userInfoData.status === 'OK') {
        userInfoData.result.forEach(user => {
          userMap.set(user.handle, user);
        });
      }

      const list = document.getElementById('friends-list');
      list.innerHTML = '';

      friends.forEach((friend, index) => {
        const row = document.createElement('tr');
        const user = userMap.get(friend);
        const rank = user ? getRankByRating(user.rating) : 'unrated';
        const rankClass = `rank-color-${rank}`;
        
        let handleHtml = friend;
        if (rank === 'legendary-grandmaster') {
          const firstLetter = friend.charAt(0);
          const rest = friend.slice(1);
          handleHtml = `<span style="color: #000000">${firstLetter}</span><span style="color: #ff0000">${rest}</span>`;
        }

        row.innerHTML = `
          <td>${index + 1}</td>
          <td><a href="https://diucf.vercel.app/profile.html?handle=${friend}" target="_blank" class="${rankClass}">${handleHtml}</a></td>
        `;
        list.appendChild(row);
      });
    } else {
      showError(data.comment || 'Failed to fetch friends list');
    }
  } catch (error) {
    console.error('Error:', error);
    showError('Error loading friends list');
  } finally {
    hideLoading();
  }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchFriends();
  // Refresh friends list when filter changes
  document.getElementById('friend-filter').addEventListener('change', fetchFriends);
  // Refresh friends list when API key or secret changes
  document.getElementById('api-key').addEventListener('input', () => {
    if (document.getElementById('api-key').value.trim().length >= 40) fetchFriends();
  });
  document.getElementById('api-secret').addEventListener('input', () => {
    if (document.getElementById('api-secret').value.trim().length >= 40) fetchFriends();
  });
});
