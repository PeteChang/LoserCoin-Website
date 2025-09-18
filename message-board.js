const messageForm = document.getElementById('messageForm');
const latestContainer = document.getElementById('latestMessages');
const topContainer = document.getElementById('topMessages');
const STORAGE_KEY = 'loserCoinMessages';

let messagesState = [];

function generateId(prefix = 'msg') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeComment(comment, index, messageId) {
  let changed = false;
  const safeComment = comment && typeof comment === 'object' ? comment : {};
  if (safeComment !== comment) {
    changed = true;
  }

  const id = typeof safeComment.id === 'string' ? safeComment.id : generateId(`comment-${messageId}-${index}`);
  if (id !== safeComment.id) {
    changed = true;
  }

  const rawName = typeof safeComment.name === 'string' ? safeComment.name.trim() : '';
  const name = rawName || '匿名';
  if (name !== safeComment.name) {
    changed = true;
  }

  const text = typeof safeComment.text === 'string' ? safeComment.text : '';
  if (text !== safeComment.text) {
    changed = true;
  }

  const timestamp = typeof safeComment.timestamp === 'number' ? safeComment.timestamp : Date.now();
  if (timestamp !== safeComment.timestamp) {
    changed = true;
  }

  return {
    normalized: { id, name, text, timestamp },
    changed,
  };
}

function normalizeMessage(message, index) {
  let changed = false;
  const safeMessage = message && typeof message === 'object' ? message : {};
  if (safeMessage !== message) {
    changed = true;
  }

  const id = typeof safeMessage.id === 'string' ? safeMessage.id : generateId(`message-${index}`);
  if (id !== safeMessage.id) {
    changed = true;
  }

  const rawName = typeof safeMessage.name === 'string' ? safeMessage.name.trim() : '';
  const name = rawName || '匿名';
  if (name !== safeMessage.name) {
    changed = true;
  }

  const content = typeof safeMessage.message === 'string' ? safeMessage.message : '';
  if (content !== safeMessage.message) {
    changed = true;
  }

  const timestamp = typeof safeMessage.timestamp === 'number' ? safeMessage.timestamp : Date.now();
  if (timestamp !== safeMessage.timestamp) {
    changed = true;
  }

  const likes = typeof safeMessage.likes === 'number' ? safeMessage.likes : 0;
  if (likes !== safeMessage.likes) {
    changed = true;
  }

  const rawComments = Array.isArray(safeMessage.comments) ? safeMessage.comments : [];
  if (!Array.isArray(safeMessage.comments)) {
    changed = true;
  }

  const comments = rawComments.map((comment, commentIndex) => {
    const { normalized, changed: commentChanged } = normalizeComment(comment, commentIndex, id);
    if (commentChanged) {
      changed = true;
    }
    return normalized;
  });

  return {
    normalized: { id, name, message: content, timestamp, likes, comments },
    changed,
  };
}

function loadMessages() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const raw = JSON.parse(stored);
    let needsSave = false;
    const normalized = Array.isArray(raw)
      ? raw.map((item, index) => {
          const { normalized: message, changed } = normalizeMessage(item, index);
          if (changed) {
            needsSave = true;
          }
          return message;
        })
      : [];

    if (needsSave) {
      saveMessages(normalized);
    }

    return normalized;
  } catch (error) {
    console.warn('读取本地留言失败：', error);
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function renderList(container, list, emptyMessage) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!list.length) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = emptyMessage;
    container.appendChild(emptyState);
    return;
  }

  list.forEach((message) => {
    const element = createMessageElement(message);
    container.appendChild(element);
  });
}

function handleLike(messageId) {
  messagesState = messagesState.map((message) => {
    if (message.id !== messageId) {
      return message;
    }

    return {
      ...message,
      likes: message.likes + 1,
    };
  });

  saveMessages(messagesState);
  renderBoard();
}

function handleCommentSubmit(event, messageId) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const name = (formData.get('commenter') || '').trim() || '匿名';
  const text = (formData.get('comment') || '').trim();

  if (!text) {
    alert('请填写评论内容后再提交。');
    return;
  }

  form.reset();

  const comment = {
    id: generateId('comment'),
    name,
    text,
    timestamp: Date.now(),
  };

  messagesState = messagesState.map((message) => {
    if (message.id !== messageId) {
      return message;
    }

    return {
      ...message,
      comments: [...message.comments, comment],
    };
  });

  saveMessages(messagesState);
  renderBoard();
}

function createMessageElement(message) {
  const wrapper = document.createElement('article');
  wrapper.className = 'message-card';

  const header = document.createElement('header');
  header.className = 'message-header';

  const author = document.createElement('h3');
  author.textContent = message.name || '匿名';
  header.appendChild(author);

  const time = document.createElement('time');
  const date = new Date(message.timestamp);
  time.dateTime = date.toISOString();
  time.textContent = date.toLocaleString();
  header.appendChild(time);

  const body = document.createElement('p');
  body.textContent = message.message;

  const actions = document.createElement('div');
  actions.className = 'message-actions';

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'like-button';
  likeButton.setAttribute('aria-label', `为${message.name || '匿名'}的留言点赞`);

  const likeIcon = document.createElement('span');
  likeIcon.className = 'like-icon';
  likeIcon.textContent = '👍';

  const likeLabel = document.createElement('span');
  likeLabel.className = 'like-label';
  likeLabel.textContent = '点赞';

  const likeCount = document.createElement('span');
  likeCount.className = 'like-count';
  likeCount.textContent = message.likes;

  likeButton.append(likeIcon, likeLabel, likeCount);
  likeButton.addEventListener('click', () => handleLike(message.id));

  const commentSummary = document.createElement('span');
  commentSummary.className = 'comment-count';
  commentSummary.textContent = `${message.comments.length} 条评论`;

  actions.append(likeButton, commentSummary);

  const commentSection = document.createElement('section');
  commentSection.className = 'comment-section';

  if (message.comments.length) {
    const commentList = document.createElement('ul');
    commentList.className = 'comment-list';

    message.comments
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach((comment) => {
        const item = document.createElement('li');
        item.className = 'comment-item';

        const meta = document.createElement('div');
        meta.className = 'comment-meta';
        const commentDate = new Date(comment.timestamp);
        meta.textContent = `${comment.name} · ${commentDate.toLocaleString()}`;

        const content = document.createElement('p');
        content.className = 'comment-text';
        content.textContent = comment.text;

        item.append(meta, content);
        commentList.appendChild(item);
      });

    commentSection.appendChild(commentList);
  } else {
    const emptyComment = document.createElement('p');
    emptyComment.className = 'comment-empty';
    emptyComment.textContent = '还没有评论，快来抢沙发~';
    commentSection.appendChild(emptyComment);
  }

  const commentForm = document.createElement('form');
  commentForm.className = 'comment-form';

  const commenterInput = document.createElement('input');
  commenterInput.type = 'text';
  commenterInput.name = 'commenter';
  commenterInput.placeholder = '昵称（可选）';
  commenterInput.autocomplete = 'name';

  const commentInput = document.createElement('textarea');
  commentInput.name = 'comment';
  commentInput.rows = 2;
  commentInput.placeholder = '写下你的评论…';
  commentInput.required = true;

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'button subtle';
  submitButton.textContent = '发布评论';

  commentForm.append(commenterInput, commentInput, submitButton);
  commentForm.addEventListener('submit', (event) => handleCommentSubmit(event, message.id));

  commentSection.appendChild(commentForm);

  wrapper.append(header, body, actions, commentSection);

  return wrapper;
}

function renderBoard() {
  const latestMessages = messagesState
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp);

  const hottestMessages = messagesState
    .slice()
    .sort((a, b) => {
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      return b.timestamp - a.timestamp;
    })
    .slice(0, 5);

  renderList(latestContainer, latestMessages, '还没有留言，来写下第一句话吧！');
  renderList(topContainer, hottestMessages, '暂无热门留言，给喜欢的内容点个赞吧！');
}

function handleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(messageForm);
  const entry = {
    id: generateId('message'),
    name: (formData.get('name') || '').trim() || '匿名',
    message: (formData.get('message') || '').trim(),
    timestamp: Date.now(),
    likes: 0,
    comments: [],
  };

  if (!entry.message) {
    alert('请填写留言内容后再提交。');
    return;
  }

  messagesState = [...messagesState, entry];
  saveMessages(messagesState);
  renderBoard();
  messageForm.reset();
  if (messageForm.elements.name) {
    messageForm.elements.name.focus();
  }
}

function initBoard() {
  messagesState = loadMessages();
  renderBoard();

  if (messageForm) {
    messageForm.addEventListener('submit', handleSubmit);
  }

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
