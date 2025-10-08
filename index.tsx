/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Add types for Web Speech API to resolve TypeScript errors.
interface SpeechRecognition {
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    GEMINI_API_KEY: string;
  }
}

// ==============================================================================
// IMPORTS
// ==============================================================================
import {
  GoogleGenAI,
  GenerateContentResponse,
  Part,
  Content,
  Type,
} from '@google/genai';
import { marked } from 'marked';
import hljs from 'highlight.js';

// ==============================================================================
// TYPES
// ==============================================================================

/** Represents a single message in the chat, enabling a threaded structure. */
interface ChatMessage {
  id: string;
  parentId: string | null;
  content: Content;
}

/** Represents a full conversation with its own history and metadata. */
interface Conversation {
  id: string;
  title: string;
  history: ChatMessage[];
}

/** Represents a command available in the command palette. */
interface Command {
  id: string;
  name: string;
  action: () => void;
  keywords?: string[];
}


// ==============================================================================
// CONFIGURATION
// ==============================================================================

marked.use({
  async: false,
  walkTokens: (token) => {
    if (token.type === 'code') {
      const lang = token.lang || 'plaintext';
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      token.text = hljs.highlight(token.text, { language }).value;
    }
  },
});

// ==============================================================================
// CONSTANTS & STATE
// ==============================================================================

// DOM Element Selectors
const chatContainer = document.getElementById(
  'chat-container'
) as HTMLDivElement;
const chatForm = document.getElementById('chat-form') as HTMLFormElement;
const chatInput = document.getElementById('chat-input') as HTMLInputElement;
const sendButton = chatForm.querySelector(
  'button[type="submit"]'
) as HTMLButtonElement;
const voiceInputButton = document.getElementById(
  'voice-input-button'
) as HTMLButtonElement;
const attachFileButton = document.getElementById(
  'attach-file-button'
) as HTMLButtonElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const filePreviewContainer = document.getElementById(
  'file-preview-container'
) as HTMLDivElement;
const scrollToBottomButton = document.getElementById(
  'scroll-to-bottom'
) as HTMLButtonElement;
const newChatButton = document.getElementById(
  'new-chat-button'
) as HTMLButtonElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLInputElement;
const lightThemeLink = document.getElementById(
  'light-theme-link'
) as HTMLLinkElement;
const darkThemeLink = document.getElementById(
  'dark-theme-link'
) as HTMLLinkElement;
const aboutButton = document.getElementById('about-button') as HTMLButtonElement;
const aboutModal = document.getElementById('about-modal') as HTMLDivElement;
const closeModalButton = document.getElementById(
  'close-modal-button'
) as HTMLButtonElement;
const threadPanel = document.getElementById('thread-panel') as HTMLElement;
const closeThreadButton = document.getElementById(
  'close-thread-button'
) as HTMLButtonElement;
const threadContentContainer = document.getElementById(
  'thread-content-container'
) as HTMLDivElement;
const threadForm = document.getElementById('thread-form') as HTMLFormElement;
const threadInput = document.getElementById('thread-input') as HTMLInputElement;
const commandPaletteOverlay = document.getElementById('command-palette-overlay') as HTMLDivElement;
const commandPaletteInput = document.getElementById('command-palette-input') as HTMLInputElement;
const commandPaletteList = document.getElementById('command-palette-list') as HTMLUListElement;
const sidebar = document.getElementById('sidebar') as HTMLElement;
const menuButton = document.getElementById('menu-button') as HTMLButtonElement;
const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLDivElement;
const historyList = document.getElementById('history-list') as HTMLUListElement;
const userDetailsContainer = document.getElementById('user-details') as HTMLDivElement;
const suggestionChipsContainer = document.getElementById(
  'suggestion-chips-container'
) as HTMLDivElement;


// SVG Icons
const USER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/></svg>`;
const MODEL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-120 406-281l-161-74 74-161-281-74 281-74-74-161 161-74 74-161 74 161 161 74-74 161 281 74-281 74 74 161-161 74Z"/></svg>`;
const COPY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M360-240q-22 0-38-16t-16-38v-526h60v526q0 4 .5 7t2.5 5q2 2 5 2.5t7 .5h350q4 0 7-.5t5-2.5q2-2 2.5-5t.5-7v-526h60v526q0 22-16 38t-38 16H360Zm240-120q-22 0-38-16t-16-38v-486q0-22 16-38t38-16h190q22 0 38 16t16 38v486q0 22-16 38t-38 16H600Zm0-60h190v-486H600v486Z"/></svg>`;
const COPIED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M382-240 154-468l43-43 185 185 384-384 43 43-427 427Z"/></svg>`;
const MIC_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-400q-50 0-85-35t-35-85v-200q0-50 35-85t85-35q50 0 85 35t35 85v200q0 50-35 85t-85 35ZM280-520v120q0 83 58.5 141.5T480-200q83 0 141.5-58.5T680-400v-120h-80v120q0 50-35 85t-85 35q-50 0-85-35t-35-85v-120H280Zm200-40Zm0 240Z"/></svg>`;
const MIC_ACTIVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-400q-50 0-85-35t-35-85v-200q0-50 35-85t85-35q50 0 85 35t35 85v200q0 50-35 85t-85 35Zm-40-600v-120h80v120h-80Zm80 200v-80h80v80h-80Zm-320 0v-80h80v80H200Zm480 0v-80h80v80h-80ZM200-440v-80h80v80H200Zm480 0v-80h80v80h-80Zm-240 280q83 0 141.5-58.5T680-400v-120h80v120q0 100-70 170t-170 70q-100 0-170-70t-70-170v-120h80v120q0 83 58.5 141.5T480-160Z"/></svg>`;
const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>`;
const THUMBS_UP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 176h358q33 0 56.5 23.5T880-560v80q0 16-6 30.5T857-427L717-217q-11 20-28.5 31.5T650-170h-10l-10-10v70ZM200-120h80v-520h-80v520Z"/></svg>`;
const THUMBS_DOWN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M240-840h440v520L400-40l-50-50q-7-7-11.5-19t-4.5-23v-14l44-176H80q-33 0-56.5-23.5T0-400v-80q0-16 6-30.5T23-533l140-210q11-20 28.5-31.5T230-790h10l10 10v-70ZM760-840h-80v520h80v-520Z"/></svg>`;
const REPLY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M400-80 48-332l352-252v142q116-4 220-40t160-110q0 86-55 163t-145 127q-90 50-180 50h-40v150Z"/></svg>`;
const DELETE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;


// Storage Keys
const CONVERSATIONS_STORAGE_KEY = 'gemini-conversations';
const ACTIVE_CONVO_ID_KEY = 'gemini-active-convo-id';
const THEME_STORAGE_KEY = 'theme';

const copyButtonTimeouts = new Map<HTMLElement, number>();
let attachedFile: { base64: string; mimeType: string } | null = null;
let activeConversationId: string | null = null;

// Speech Recognition
const SpeechRecognitionAPI: SpeechRecognitionStatic =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
let recognition: SpeechRecognition | null = null;
let isListening = false;
let activeThreadParentId: string | null = null;

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/** Generates a unique ID. */
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

/**
 * Checks if the user is scrolled to the bottom of a container.
 * @param container The container to check.
 * @returns True if the user is at the bottom, false otherwise.
 */
function isUserAtBottom(container: HTMLElement): boolean {
  const threshold = 100;
  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <=
    threshold
  );
}

/**
 * Scrolls a container to the bottom.
 * @param container The container to scroll.
 * @param behavior - The scroll behavior ('smooth' or 'auto').
 */
function scrollToBottom(container: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  container.scrollTo({ top: container.scrollHeight, behavior });
}

/** Toggles the disabled state of the chat form elements. */
function toggleForm(isDisabled: boolean): void {
  chatInput.disabled = isDisabled;
  sendButton.disabled = isDisabled;
  voiceInputButton.disabled = isDisabled;
  attachFileButton.disabled = isDisabled;
  if (!isDisabled) chatInput.focus();
}

/** Formats an error into a user-friendly string for the chat UI. */
function formatErrorMessage(error: unknown): string {
  let message =
    'An unexpected error occurred. Please check the console for details.';
  if (error instanceof Error) message = error.message;
  return `**Oops! An error occurred.**\n\n${message}`;
}

/** Handles the click event for a copy button. */
function handleCopyClick(
  copyButton: HTMLButtonElement,
  content: string
): void {
  if (copyButtonTimeouts.has(copyButton)) {
    clearTimeout(copyButtonTimeouts.get(copyButton));
  }
  navigator.clipboard
    .writeText(content)
    .then(() => {
      copyButton.innerHTML = COPIED_ICON;
      copyButton.classList.add('copied');
      const timeoutId = window.setTimeout(() => {
        copyButton.innerHTML = COPY_ICON;
        copyButton.classList.remove('copied');
        copyButtonTimeouts.delete(copyButton);
      }, 2000);
      copyButtonTimeouts.set(copyButton, timeoutId);
    })
    .catch((err) => console.error('Failed to copy text: ', err));
}

/**
 * Parses a markdown string and splits it into text and code segments.
 * @param markdown The markdown string to parse.
 * @returns An array of segments.
 */
function parseAndSplitResponse(markdown: string): { type: 'text' | 'code'; content: string; lang?: string }[] {
  const segments: { type: 'text' | 'code'; content: string; lang?: string }[] = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    // Add the text part before the code block if it exists
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: markdown.substring(lastIndex, match.index) });
    }
    // Add the code block, defaulting language to 'plaintext'
    segments.push({ type: 'code', content: match[2], lang: match[1] || 'plaintext' });
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last code block
  if (lastIndex < markdown.length) {
    segments.push({ type: 'text', content: markdown.substring(lastIndex) });
  }

  // If no code blocks were found, return the original text as a single segment
  if (segments.length === 0) {
    return [{ type: 'text', content: markdown }];
  }

  return segments.filter(segment => segment.content.trim().length > 0);
}


// ==============================================================================
// THEME & SIDEBAR MANAGEMENT
// ==============================================================================

function setTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  lightThemeLink.disabled = theme === 'dark';
  darkThemeLink.disabled = theme === 'light';
  themeToggle.checked = theme === 'light';
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

function toggleSidebar(force?: boolean) {
    const isOpen = sidebar.classList.toggle('open', force);
    sidebarOverlay.classList.toggle('hidden', !isOpen);
}


// ==============================================================================
// MESSAGE ELEMENT CREATION & EDITING
// ==============================================================================
/**
 * Creates a message element for a code block.
 * @param codeContent The raw code content.
 * @param lang The language of the code.
 * @param originalMessageId The ID of the original message this block belongs to.
 * @returns An HTMLElement representing the code message.
 */
async function createCodeMessageElement(codeContent: string, lang: string, originalMessageId: string): Promise<HTMLElement> {
    const wrapper = document.createElement('div');
    wrapper.classList.add('message-wrapper', 'model');
    wrapper.dataset.messageId = originalMessageId;

    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    avatar.innerHTML = MODEL_ICON;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'code-message');

    const header = document.createElement('div');
    header.className = 'code-header';
    const langSpan = document.createElement('span');
    langSpan.textContent = lang;
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.innerHTML = COPY_ICON;
    copyButton.title = 'Copy code';
    copyButton.addEventListener('click', () => handleCopyClick(copyButton, codeContent));
    header.appendChild(langSpan);
    header.appendChild(copyButton);

    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    code.innerHTML = hljs.highlight(codeContent, { language }).value;
    pre.appendChild(code);
    contentElement.appendChild(pre);

    messageElement.appendChild(header);
    messageElement.appendChild(contentElement);
    wrapper.appendChild(avatar);
    wrapper.appendChild(messageElement);
    return wrapper;
}


/**
 * Creates a standard message element for user or model text.
 * @param message The message object.
 * @param allHistory The complete chat history for context.
 * @param isPartial A flag to indicate if this is part of a larger, split message.
 * @returns An HTMLElement representing the message.
 */
async function createMessageElement(
  message: ChatMessage,
  allHistory: ChatMessage[],
  isPartial = false
): Promise<HTMLElement> {
  const { id, content } = message;
  const isUser = content.role === 'user';
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', isUser ? 'user' : 'model');
  wrapper.dataset.messageId = id;

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.innerHTML = isUser ? USER_ICON : MODEL_ICON;
  
  if (isUser) {
    userDetailsContainer.innerHTML = '';
    userDetailsContainer.appendChild(avatar.cloneNode(true));
    const userName = document.createElement('span');
    userName.textContent = 'User';
    userDetailsContainer.appendChild(userName);
  }

  const messageElement = document.createElement('div');
  messageElement.classList.add('message', isUser ? 'user-message' : 'model-message');

  const contentElement = document.createElement('div');
  contentElement.classList.add('message-content');
  const originalContentContainer = document.createElement('div');

  let fullTextContent = '';
  let hasImage = false;

  for (const part of content.parts) {
    if (part.text) {
      fullTextContent += part.text;
    } else if (part.inlineData) {
      hasImage = true;
      const img = document.createElement('img');
      img.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      img.alt = 'User-uploaded image';
      originalContentContainer.appendChild(img);
    }
  }

  if (fullTextContent) {
    const textDiv = document.createElement('div');
    textDiv.innerHTML = await marked.parse(fullTextContent);
    originalContentContainer.appendChild(textDiv);
  }

  contentElement.appendChild(originalContentContainer);
  messageElement.appendChild(contentElement);

  // Only add actions if not a partial message, or if it's a user message
  if (!isPartial) {
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('message-actions');

    if (isUser) {
      const hasReplies = allHistory.some((m) => m.parentId === id);
      const editButton = document.createElement('button');
      editButton.classList.add('edit-button');
      editButton.innerHTML = EDIT_ICON;
      editButton.title = hasReplies ? 'Cannot edit a message with replies' : 'Edit message';
      editButton.disabled = hasReplies;
      editButton.addEventListener('click', () => {
        if (hasImage) {
          alert('Editing messages with images is not supported.');
          return;
        }
        enterEditMode(wrapper, originalContentContainer, fullTextContent);
      });
      actionsContainer.appendChild(editButton);
    } else {
      const replyButton = document.createElement('button');
      replyButton.classList.add('reply-button');
      replyButton.innerHTML = REPLY_ICON;
      replyButton.title = 'Reply in thread';
      replyButton.addEventListener('click', () => openThread(id));

      const copyButton = document.createElement('button');
      copyButton.classList.add('copy-button');
      copyButton.innerHTML = COPY_ICON;
      copyButton.title = 'Copy message';
      copyButton.addEventListener('click', () => handleCopyClick(copyButton, fullTextContent));

      const thumbsUpButton = document.createElement('button');
      thumbsUpButton.classList.add('feedback-button');
      thumbsUpButton.innerHTML = THUMBS_UP_ICON;
      thumbsUpButton.title = 'Good response';

      const thumbsDownButton = document.createElement('button');
      thumbsDownButton.classList.add('feedback-button');
      thumbsDownButton.innerHTML = THUMBS_DOWN_ICON;
      thumbsDownButton.title = 'Bad response';

      const handleFeedback = (event: MouseEvent) => {
        const clickedButton = event.currentTarget as HTMLButtonElement;
        clickedButton.classList.add('active');
        thumbsUpButton.disabled = true;
        thumbsDownButton.disabled = true;
      };

      thumbsUpButton.addEventListener('click', handleFeedback);
      thumbsDownButton.addEventListener('click', handleFeedback);

      actionsContainer.appendChild(replyButton);
      actionsContainer.appendChild(thumbsUpButton);
      actionsContainer.appendChild(thumbsDownButton);
      actionsContainer.appendChild(copyButton);
    }
    messageElement.appendChild(actionsContainer);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(messageElement);

  const replyCount = allHistory.filter((m) => m.parentId === id).length;
  if (replyCount > 0) {
    const threadIndicator = document.createElement('div');
    threadIndicator.classList.add('thread-indicator');
    threadIndicator.textContent = `${replyCount} ${replyCount > 1 ? 'replies' : 'reply'}`;
    threadIndicator.addEventListener('click', () => openThread(id));
    messageElement.appendChild(threadIndicator);
  }

  return wrapper;
}


function enterEditMode(wrapper: HTMLElement, originalContentContainer: HTMLElement, originalText: string) {
  originalContentContainer.style.display = 'none';

  const contentElement = wrapper.querySelector('.message-content')!;
  const editContainer = document.createElement('div');
  editContainer.className = 'edit-container';

  const textArea = document.createElement('textarea');
  textArea.className = 'edit-textarea';
  textArea.value = originalText;

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'edit-actions';

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.className = 'edit-save';
  saveButton.onclick = () => saveEdit(wrapper, textArea.value);

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.className = 'edit-cancel';
  cancelButton.onclick = () => exitEditMode(wrapper, originalContentContainer);

  actionsContainer.appendChild(cancelButton);
  actionsContainer.appendChild(saveButton);
  editContainer.appendChild(textArea);
  editContainer.appendChild(actionsContainer);
  contentElement.appendChild(editContainer);

  textArea.focus();
  textArea.style.height = 'auto';
  textArea.style.height = `${textArea.scrollHeight}px`;
}

function exitEditMode(wrapper: HTMLElement, originalContentContainer: HTMLElement) {
  originalContentContainer.style.display = 'block';
  const editContainer = wrapper.querySelector('.edit-container');
  if (editContainer) editContainer.remove();
}

async function saveEdit(wrapper: HTMLElement, newText: string) {
  const messageId = wrapper.dataset.messageId;
  if (!messageId || !activeConversationId) return;

  const conversations = loadConversations();
  const activeConvo = conversations[activeConversationId];
  const history = activeConvo.history;
  
  const originalMessage = history.find(m => m.id === messageId);
  if (!originalMessage) return;

  const messagesToRemove = new Set<string>();
  let found = false;
  for (const msg of history) {
      if (msg.parentId === originalMessage.parentId) {
          if (msg.id === messageId) found = true;
          if (found) messagesToRemove.add(msg.id);
      }
  }

  activeConvo.history = history.filter(m => !messagesToRemove.has(m.id));
  saveConversations(conversations);
  await renderAll();

  await sendMessage([{ text: newText }], originalMessage.parentId);
}

function showLoadingIndicator(container: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message-wrapper', 'model', 'loading');

  const avatar = document.createElement('div');
  avatar.classList.add('avatar');
  avatar.innerHTML = MODEL_ICON;

  const loadingElement = document.createElement('div');
  loadingElement.classList.add('message', 'model-message', 'loading');
  loadingElement.innerHTML = `<span></span><span></span><span></span>`;

  wrapper.appendChild(avatar);
  wrapper.appendChild(loadingElement);
  
  const shouldScroll = isUserAtBottom(container);
  container.appendChild(wrapper);
  if (shouldScroll) scrollToBottom(container, 'auto');

  return wrapper;
}

// ==============================================================================
// FILE HANDLING
// ==============================================================================

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

function displayFilePreview() {
  if (!attachedFile) return;
  filePreviewContainer.innerHTML = '';
  const img = document.createElement('img');
  img.src = `data:${attachedFile.mimeType};base64,${attachedFile.base64}`;
  const removeButton = document.createElement('button');
  removeButton.id = 'remove-file-button';
  removeButton.innerHTML = '&times;';
  removeButton.addEventListener('click', removeAttachedFile);
  filePreviewContainer.appendChild(img);
  filePreviewContainer.appendChild(removeButton);
  filePreviewContainer.classList.remove('hidden');
}

function removeAttachedFile() {
  attachedFile = null;
  fileInput.value = '';
  filePreviewContainer.innerHTML = '';
  filePreviewContainer.classList.add('hidden');
}

// ==============================================================================
// SUGGESTION CHIPS
// ==============================================================================

/** Clears all suggestion chips from the UI. */
function clearSuggestions(): void {
  suggestionChipsContainer.innerHTML = '';
}

/**
 * Generates and displays follow-up suggestion chips based on the last model response.
 * @param lastModelResponse The text content of the last model response.
 */
async function generateAndDisplaySuggestions(lastModelResponse: string): Promise<void> {
  if (lastModelResponse.includes('**Oops! An error occurred.**') || lastModelResponse.includes('**Fatal Error:**')) {
      return;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on this AI response, provide three short, relevant follow-up questions or actions a user might find helpful:\n\n---\n\n${lastModelResponse}`,
      config: {
        systemInstruction: `You are an expert at anticipating user needs. Your task is to generate three concise and relevant follow-up suggestions based on a given AI response. The suggestions should be actions or questions. Provide the output as a JSON object with a single key "suggestions" which is an array of strings. Example: {"suggestions": ["Summarize this.", "Explain it simply.", "Give me a code example."]}.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const jsonResponse = JSON.parse(response.text);
    const suggestions: string[] | undefined = jsonResponse.suggestions;

    if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
      clearSuggestions();
      suggestions.slice(0, 3).forEach((suggestionText, index) => {
        const chip = document.createElement('button');
        chip.type = 'button'; 
        chip.className = 'suggestion-chip';
        chip.textContent = suggestionText;
        chip.style.animationDelay = `${index * 80}ms`;
        chip.onclick = () => {
          chatInput.value = suggestionText;
          chatForm.requestSubmit();
        };
        suggestionChipsContainer.appendChild(chip);
      });
    }
  } catch (error) {
    console.error('Failed to generate suggestions:', error);
    clearSuggestions();
  }
}

// ==============================================================================
// HISTORY & RENDERING MANAGEMENT
// ==============================================================================

function saveConversations(conversations: Record<string, Conversation>) {
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
}

function loadConversations(): Record<string, Conversation> {
  const stored = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

async function deleteConversation(idToDelete: string) {
    const conversations = loadConversations();
    const convoToDelete = conversations[idToDelete];
    if (!convoToDelete) return;

    if (!window.confirm(`Are you sure you want to delete "${convoToDelete.title}"? This action cannot be undone.`)) {
        return;
    }

    delete conversations[idToDelete];
    saveConversations(conversations);

    if (activeConversationId === idToDelete) {
        const remainingIds = Object.keys(conversations);
        if (remainingIds.length > 0) {
            await loadConversation(remainingIds[0]);
        } else {
            await startNewChat();
        }
    } else {
        await renderAll();
    }
}


function generateTitle(history: ChatMessage[]): string {
    const firstUserMessage = history.find(m => m.content.role === 'user');
    if (firstUserMessage) {
        const firstTextPart = firstUserMessage.content.parts.find(p => p.text);
        if(firstTextPart && firstTextPart.text) {
            return firstTextPart.text.substring(0, 30) + (firstTextPart.text.length > 30 ? '...' : '');
        }
    }
    return "New Chat";
}

/** Renders a single message, splitting it into multiple elements if it contains code. */
async function renderMessage(message: ChatMessage, allHistory: ChatMessage[], container: HTMLElement) {
  const { id, content } = message;
  const isUser = content.role === 'user';

  // For user messages, render as a single block
  if (isUser) {
    const userMessageElement = await createMessageElement(message, allHistory);
    container.appendChild(userMessageElement);
    return;
  }

  // For model messages, parse and split into text and code blocks
  const fullTextContent = content.parts.map(part => part.text || '').join('');
  const segments = parseAndSplitResponse(fullTextContent);
  const renderedElements: HTMLElement[] = [];

  for (const segment of segments) {
    if (segment.type === 'code') {
      renderedElements.push(await createCodeMessageElement(segment.content, segment.lang || 'plaintext', id));
    } else { // segment.type === 'text'
      const partialMessage: ChatMessage = {
        ...message,
        content: { role: 'model', parts: [{ text: segment.content }] }
      };
      // Pass 'true' to indicate this is a partial message and shouldn't get actions yet
      renderedElements.push(await createMessageElement(partialMessage, allHistory, true));
    }
  }

  // Add actions to the very last rendered element of the split message
  if (renderedElements.length > 0) {
    const lastElement = renderedElements[renderedElements.length - 1];
    const lastMessageBubble = lastElement.querySelector('.message');

    if (lastMessageBubble) {
      const actionsContainer = document.createElement('div');
      actionsContainer.classList.add('message-actions');

      const replyButton = document.createElement('button');
      replyButton.classList.add('reply-button');
      replyButton.innerHTML = REPLY_ICON;
      replyButton.title = 'Reply in thread';
      replyButton.addEventListener('click', () => openThread(id));

      const thumbsUpButton = document.createElement('button');
      thumbsUpButton.classList.add('feedback-button');
      thumbsUpButton.innerHTML = THUMBS_UP_ICON;
      thumbsUpButton.title = 'Good response';

      const thumbsDownButton = document.createElement('button');
      thumbsDownButton.classList.add('feedback-button');
      thumbsDownButton.innerHTML = THUMBS_DOWN_ICON;
      thumbsDownButton.title = 'Bad response';

      const handleFeedback = (event: MouseEvent) => {
        const clickedButton = event.currentTarget as HTMLButtonElement;
        clickedButton.classList.add('active');
        thumbsUpButton.disabled = true;
        thumbsDownButton.disabled = true;
      };
      thumbsUpButton.addEventListener('click', handleFeedback);
      thumbsDownButton.addEventListener('click', handleFeedback);

      actionsContainer.appendChild(replyButton);
      actionsContainer.appendChild(thumbsUpButton);
      actionsContainer.appendChild(thumbsDownButton);

      // Only add a generic copy button if the last part is text
      if (!lastMessageBubble.classList.contains('code-message')) {
        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.innerHTML = COPY_ICON;
        copyButton.title = 'Copy message';
        const lastTextSegment = segments.filter(s => s.type === 'text').pop();
        if (lastTextSegment) {
          copyButton.addEventListener('click', () => handleCopyClick(copyButton, lastTextSegment.content));
          actionsContainer.appendChild(copyButton);
        }
      }
      lastMessageBubble.appendChild(actionsContainer);
    }
  }

  renderedElements.forEach(el => container.appendChild(el));
}


/** Renders the main chat view for the active conversation. */
async function renderHistory() {
  chatContainer.innerHTML = '';
  if (!activeConversationId) return;

  const conversations = loadConversations();
  const activeConvo = conversations[activeConversationId];
  if (!activeConvo) return;
  
  const history = activeConvo.history;
  const topLevelMessages = history.filter((msg) => msg.parentId === null);
  for (const message of topLevelMessages) {
    await renderMessage(message, history, chatContainer);
  }
}

/** Renders the view for a specific thread. */
async function renderThreadView(parentId: string) {
  threadContentContainer.innerHTML = '';
  if (!activeConversationId) return;

  const conversations = loadConversations();
  const history = conversations[activeConversationId]?.history || [];
  const parentMessage = history.find((m) => m.id === parentId);
  const replies = history.filter((m) => m.parentId === parentId);

  if (parentMessage) {
    const parentElement = await createMessageElement(parentMessage, history);
    parentElement.classList.add('thread-parent-message');
    threadContentContainer.appendChild(parentElement);
  }

  const repliesContainer = document.createElement('div');
  repliesContainer.classList.add('thread-replies-container');
  for (const message of replies) {
    await renderMessage(message, history, repliesContainer);
  }
  threadContentContainer.appendChild(repliesContainer);
}

function renderSidebar() {
    historyList.innerHTML = '';
    const conversations = loadConversations();
    Object.values(conversations).forEach(convo => {
        const li = document.createElement('li');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = convo.title;
        titleSpan.className = 'history-title-text';
        li.appendChild(titleSpan);

        li.dataset.conversationId = convo.id;
        li.className = convo.id === activeConversationId ? 'active' : '';

        li.addEventListener('click', () => {
            if (li.classList.contains('editing')) return;
            loadConversation(convo.id);
        });

        li.addEventListener('dblclick', () => {
            if (document.querySelector('#history-list li.editing')) return;

            li.classList.add('editing');
            titleSpan.style.display = 'none';

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'history-title-editor';
            input.value = titleSpan.textContent || '';

            const finishEditing = (save: boolean) => {
                const newTitle = input.value.trim();
                if (save && newTitle && newTitle !== convo.title) {
                    const allConvos = loadConversations();
                    if (allConvos[convo.id]) {
                        allConvos[convo.id].title = newTitle;
                        saveConversations(allConvos);
                    }
                    titleSpan.textContent = newTitle;
                } else {
                    titleSpan.textContent = convo.title;
                }
                li.removeChild(input);
                titleSpan.style.display = '';
                li.classList.remove('editing');
            };

            input.addEventListener('blur', () => finishEditing(true));
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    finishEditing(true);
                } else if (e.key === 'Escape') {
                    finishEditing(false);
                }
            });

            li.appendChild(input);
            input.focus();
            input.select();
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'history-delete-button';
        deleteButton.innerHTML = DELETE_ICON;
        deleteButton.title = 'Delete chat';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteConversation(convo.id);
        });
        li.appendChild(deleteButton);


        historyList.appendChild(li);
    });
}

/** Renders all UI parts from the source of truth. */
async function renderAll() {
    renderSidebar();
    await renderHistory();
    if (activeThreadParentId) {
        await renderThreadView(activeThreadParentId);
    }
}


// ==============================================================================
// THREAD MANAGEMENT
// ==============================================================================

async function openThread(parentId: string) {
  activeThreadParentId = parentId;
  await renderThreadView(parentId);
  threadPanel.classList.remove('hidden');
  threadInput.focus();
}

function closeThread() {
  activeThreadParentId = null;
  threadPanel.classList.add('hidden');
}

// ==============================================================================
// SPEECH RECOGNITION
// ==============================================================================

function handleVoiceInput() {
  if (isListening) {
    recognition?.stop();
  } else {
    startListening();
  }
}

function startListening() {
  if (!SpeechRecognitionAPI) return;
  isListening = true;
  voiceInputButton.innerHTML = MIC_ACTIVE_ICON;
  voiceInputButton.classList.add('listening');
  recognition = new SpeechRecognitionAPI();
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    let transcript = '';
    for (const result of Array.from(event.results)) {
      transcript += result[0].transcript;
    }
    chatInput.value = transcript;
  };
  recognition.onerror = (event) =>
    console.error('Speech recognition error:', event.error);
  recognition.onend = () => {
    isListening = false;
    voiceInputButton.innerHTML = MIC_ICON;
    voiceInputButton.classList.remove('listening');
    recognition = null;
  };
  recognition.start();
}

// ==============================================================================
// COMMAND PALETTE
// ==============================================================================

let commands: Command[] = [];
let activeCommandIndex = -1;

function openCommandPalette() {
  commandPaletteOverlay.classList.remove('hidden');
  commandPaletteInput.value = '';
  renderCommands();
  commandPaletteInput.focus();
}

function closeCommandPalette() {
  commandPaletteOverlay.classList.add('hidden');
}

function renderCommands(filter = '') {
  commandPaletteList.innerHTML = '';
  const lowerCaseFilter = filter.toLowerCase();
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowerCaseFilter) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(lowerCaseFilter))
  );

  filteredCommands.forEach((cmd, index) => {
    const li = document.createElement('li');
    li.textContent = cmd.name;
    li.dataset.commandId = cmd.id;
    li.addEventListener('click', () => {
      cmd.action();
      closeCommandPalette();
    });
    commandPaletteList.appendChild(li);
  });
  activeCommandIndex = -1;
  if (filteredCommands.length > 0) {
    activeCommandIndex = 0;
    commandPaletteList.children[0].classList.add('active');
  }
}

function handleCommandPaletteNavigation(event: KeyboardEvent) {
  const items = commandPaletteList.children;
  if (items.length === 0) return;

  items[activeCommandIndex]?.classList.remove('active');

  if (event.key === 'ArrowDown') {
    activeCommandIndex = (activeCommandIndex + 1) % items.length;
  } else if (event.key === 'ArrowUp') {
    activeCommandIndex = (activeCommandIndex - 1 + items.length) % items.length;
  }

  const activeItem = items[activeCommandIndex] as HTMLLIElement;
  activeItem?.classList.add('active');
  activeItem?.scrollIntoView({ block: 'nearest' });
}

function executeActiveCommand() {
  if (activeCommandIndex < 0) return;
  const activeItem = commandPaletteList.children[activeCommandIndex] as HTMLLIElement;
  const commandId = activeItem?.dataset.commandId;
  const command = commands.find((cmd) => cmd.id === commandId);
  if (command) {
    command.action();
    closeCommandPalette();
  }
}

// ==============================================================================
// CORE CHAT LOGIC
// ==============================================================================

const ai = new GoogleGenAI({ apiKey: window.GEMINI_API_KEY });

/** Builds the historical context for an API call by traversing up the message tree. */
function buildContextForSending(leafId: string, allHistory: ChatMessage[]): Content[] {
    const context: Content[] = [];
    let currentId: string | null = leafId;
    while (currentId) {
        const message = allHistory.find(m => m.id === currentId);
        if (!message) break;
        context.unshift(message.content);
        currentId = message.parentId;
    }
    return context;
}

/**
 * Handles the process of sending a message and streaming the response.
 * @param userParts The content parts of the user's message.
 * @param parentId The parent ID of the message (null for main chat).
 */
async function sendMessage(userParts: Part[], parentId: string | null) {
  if (!activeConversationId) return;
  
  const isThread = parentId !== null;
  const container = isThread ? threadContentContainer : chatContainer;
  const shouldAutoScroll = isUserAtBottom(container);
  toggleForm(true);

  const conversations = loadConversations();
  const activeConvo = conversations[activeConversationId];
  if (!activeConvo) {
      toggleForm(false);
      return;
  }

  const userMessage: ChatMessage = {
    id: generateId(),
    parentId,
    content: { role: 'user', parts: userParts },
  };
  activeConvo.history.push(userMessage);
  saveConversations(conversations); // Save user message immediately
  await renderMessage(userMessage, activeConvo.history, container);
  if (shouldAutoScroll) scrollToBottom(container, 'auto');

  const loadingIndicator = showLoadingIndicator(container);
  
  try {
    const context = buildContextForSending(userMessage.id, activeConvo.history).slice(0, -1);
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: context,
        config: {
            systemInstruction: 'You are a helpful and friendly assistant.',
        },
    });

    const responseStream = await chat.sendMessageStream({ message: userMessage.content.parts });
    let fullResponse = '';
    for await (const chunk of responseStream) {
        fullResponse += chunk.text;
    }
    
    loadingIndicator.remove();
    
    if (fullResponse) {
        const modelMessage: ChatMessage = {
            id: generateId(),
            parentId,
            content: { role: 'model', parts: [{ text: fullResponse }] },
        };
        activeConvo.history.push(modelMessage);
        
        await renderMessage(modelMessage, activeConvo.history, container);

        if (activeConvo.history.length <= 2 && parentId === null) {
            activeConvo.title = generateTitle(activeConvo.history);
        }
        
        saveConversations(conversations);
        renderSidebar();
        await generateAndDisplaySuggestions(fullResponse);
    }

  } catch (error) {
    console.error('API Error:', error);
    loadingIndicator.remove();
    const errorContent = {
      role: 'model',
      parts: [{ text: formatErrorMessage(error) }],
    };
    const errorMessage: ChatMessage = {
        id: generateId(),
        parentId,
        content: errorContent
    };
    activeConvo.history.push(errorMessage);
    saveConversations(conversations);
    await renderMessage(errorMessage, activeConvo.history, container);
  } finally {
    toggleForm(false);
    if(isThread) threadInput.focus();
    scrollToBottom(container, 'smooth');
  }
}

async function startNewChat(): Promise<void> {
  closeThread();
  
  const conversations = loadConversations();
  if (activeConversationId) {
      const currentConvo = conversations[activeConversationId];
      // Only generate a title if it's still the default and has content
      if (currentConvo && currentConvo.history.length > 1 && currentConvo.title === "New Chat") {
          currentConvo.title = generateTitle(currentConvo.history);
      } else if (currentConvo && currentConvo.history.length <= 1) { // A new chat with only the welcome message
        delete conversations[activeConversationId];
      }
  }

  const newId = generateId();
  const welcomeText = "Hello! I'm a helpful assistant. How can I help you today?";
  const welcomeMessage: ChatMessage = {
      id: generateId(),
      parentId: null,
      content: { role: 'model', parts: [{ text: welcomeText }] }
  };
  const newConvo: Conversation = {
      id: newId,
      title: 'New Chat',
      history: [welcomeMessage]
  };
  conversations[newId] = newConvo;
  
  activeConversationId = newId;
  localStorage.setItem(ACTIVE_CONVO_ID_KEY, newId);
  saveConversations(conversations);
  
  removeAttachedFile();
  await renderAll();
  scrollToBottom(chatContainer, 'auto');
}

async function loadConversation(id: string) {
    activeConversationId = id;
    localStorage.setItem(ACTIVE_CONVO_ID_KEY, id);
    await renderAll();
    scrollToBottom(chatContainer, 'auto');
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
}


// ==============================================================================
// EVENT LISTENERS & INITIALIZATION
// ==============================================================================

function setupEventListeners(): void {
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userMessage = chatInput.value.trim();
    if (!userMessage && !attachedFile) return;

    const userParts: Part[] = [];
    if (attachedFile) {
        userParts.push({ inlineData: { data: attachedFile.base64, mimeType: attachedFile.mimeType } });
    }
    if (userMessage) {
        userParts.push({ text: userMessage });
    }
    
    chatInput.value = '';
    removeAttachedFile();
    clearSuggestions();
    await sendMessage(userParts, null);
  });
  
  threadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userMessage = threadInput.value.trim();
    if (!userMessage) return;

    threadInput.value = '';
    await sendMessage([{ text: userMessage }], activeThreadParentId);
  });

  chatInput.addEventListener('input', () => {
    if (chatInput.value.trim() !== '') {
      clearSuggestions();
    }
  });


  if (SpeechRecognitionAPI) {
    voiceInputButton.addEventListener('click', handleVoiceInput);
  }

  attachFileButton.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      try {
        clearSuggestions();
        attachedFile = await fileToBase64(file);
        displayFilePreview();
      } catch (error) {
        console.error('Error reading file:', error);
        removeAttachedFile();
        alert('Could not read the selected file.');
      }
    }
  });

  newChatButton.addEventListener('click', async () => {
    await startNewChat();
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
  });

  chatContainer.addEventListener('scroll', () => {
    scrollToBottomButton.classList.toggle('visible', !isUserAtBottom(chatContainer));
  });

  scrollToBottomButton.addEventListener('click', () => scrollToBottom(chatContainer));
  closeThreadButton.addEventListener('click', closeThread);

  themeToggle.addEventListener('change', () => {
    setTheme(themeToggle.checked ? 'light' : 'dark');
  });

  aboutButton.addEventListener('click', () => aboutModal.classList.remove('hidden'));
  closeModalButton.addEventListener('click', () => aboutModal.classList.add('hidden'));
  aboutModal.addEventListener('click', (event) => {
    if (event.target === aboutModal) aboutModal.classList.add('hidden');
  });
  
  menuButton.addEventListener('click', () => toggleSidebar());
  sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

  commandPaletteOverlay.addEventListener('click', (e) => {
      if (e.target === commandPaletteOverlay) closeCommandPalette();
  });
  commandPaletteInput.addEventListener('input', () => {
      renderCommands(commandPaletteInput.value);
  });
  commandPaletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          handleCommandPaletteNavigation(e);
      } else if (e.key === 'Enter') {
          e.preventDefault();
          executeActiveCommand();
      }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (!aboutModal.classList.contains('hidden')) aboutModal.classList.add('hidden');
        if (!threadPanel.classList.contains('hidden')) closeThread();
        if (!commandPaletteOverlay.classList.contains('hidden')) closeCommandPalette();
        if (sidebar.classList.contains('open') && window.innerWidth <= 768) toggleSidebar(false);
    }
    
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openCommandPalette();
    }
  });
}

function initializeCommands() {
    commands = [
        {
            id: 'new-chat',
            name: 'Start New Chat',
            keywords: ['new', 'clear', 'reset'],
            action: () => newChatButton.click(),
        },
        {
            id: 'about',
            name: 'Open About Modal',
            keywords: ['info', 'help', 'about'],
            action: () => aboutButton.click(),
        },
        {
            id: 'toggle-sidebar',
            name: 'Toggle Sidebar',
            keywords: ['menu', 'history', 'conversations'],
            action: () => toggleSidebar(),
        },
    ];
}


async function main() {
  try {
    if (!window.GEMINI_API_KEY || window.GEMINI_API_KEY === '%%GEMINI_API_KEY%%') {
        throw new Error('API_KEY is not set. Please configure it in your Vercel environment variables.');
    }
    
    initializeTheme();
    initializeCommands();
    setupEventListeners();

    if (!SpeechRecognitionAPI) {
      voiceInputButton.style.display = 'none';
      console.warn('Speech Recognition API not supported.');
    } else {
      voiceInputButton.innerHTML = MIC_ICON;
    }

    const conversations = loadConversations();
    activeConversationId = localStorage.getItem(ACTIVE_CONVO_ID_KEY);
    
    if (!activeConversationId || !conversations[activeConversationId]) {
        const firstConvoId = Object.keys(conversations)[0];
        if (firstConvoId) {
            activeConversationId = firstConvoId;
        } else {
            await startNewChat();
            return;
        }
    }
    
    await renderAll();
    scrollToBottom(chatContainer, 'auto');

  } catch (error) {
    console.error('Initialization Error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    const errorContent: Content = { role: 'model', parts: [{ text: `**Fatal Error:** ${message}` }]};
    const errorMessage: ChatMessage = {id: generateId(), parentId: null, content: errorContent };
    await renderMessage(errorMessage, [], chatContainer);
    toggleForm(true);
  }
}

main();