const messageForm = document.getElementById('messageForm');
const messagesContainer = document.getElementById('messages');
const clearButton = document.getElementById('clearBoard');
const STORAGE_KEY = 'loserCoinMessages';

function loadMessages() {
  const stored = localStorage.getItem(STORAGE_KEY);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to parse stored messages:', error);
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function createMessageElement({ name, message, timestamp }) {
  const wrapper = document.createElement('article');
  wrapper.className = 'message-card';

  const header = document.createElement('header');
  header.className = 'message-header';

  const author = document.createElement('h3');
  author.textContent = name || 'Anonymous';
  header.appendChild(author);

  const time = document.createElement('time');
  time.dateTime = new Date(timestamp).toISOString();
  time.textContent = new Date(timestamp).toLocaleString();
  header.appendChild(time);

  const body = document.createElement('p');
  body.textContent = message;

  wrapper.appendChild(header);
  wrapper.appendChild(body);

  return wrapper;
}

function renderMessages(messages) {
  messagesContainer.innerHTML = '';

  if (!messages.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No messages yet. Be the first to share your voice!';
    messagesContainer.appendChild(emptyState);
    return;
  }

  messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach((message) => {
      const element = createMessageElement(message);
      messagesContainer.appendChild(element);
    });
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(messageForm);
  const entry = {
    name: formData.get('name').trim() || 'Anonymous',
    message: formData.get('message').trim(),
    timestamp: Date.now(),
  };

  if (!entry.message) {
    alert('Please enter a message before posting.');
    return;
  }

  const messages = loadMessages();
  messages.push(entry);
  saveMessages(messages);
  renderMessages(messages);
  messageForm.reset();
  messageForm.elements.name.focus();
}

function handleClear() {
  if (confirm('Clear all messages from this device?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderMessages([]);
  }
}

function initBoard() {
  const messages = loadMessages();
  renderMessages(messages);

  messageForm.addEventListener('submit', handleSubmit);
  clearButton.addEventListener('click', handleClear);

  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoard);
} else {
  initBoard();
}
