// --- 50 Names of Christ Loop Matrix ---
const CHRIST_NAMES_DATA = [
    "Savior", "Redeemer", "Bread of Life", "Lord", "Creator", 
    "Son of the Living God", "Only Begotten Son", "Beloved Son", "Holy One of Israel", "Wonderful", 
    "Counsellor", "Mighty God", "Everlasting Father", "Prince of Peace", "King of Kings", 
    "Advocate", "Almighty", "Alpha and Omega", "Amen", "Anointed", 
    "Apostle", "Author of Salvation", "Bishop of Souls", "Branch", "Captain of Salvation", 
    "Chief Shepherd", "Chief Cornerstone", "Emmanuel", "Deliverer", "Door", 
    "Good Shepherd", "High Priest", "I AM", "Light of the World", "Messiah", 
    "The Word", "True Vine", "Rock", "Refuge", "Comforter", 
    "Dayspring", "King Eternal", "Lamb of God", "Last Adam", "Lord of All", 
    "Man of Sorrows", "Mediator", "Resurrection and Life", "Root of David", "Way, Truth, and Life"
];

const BASE_SEQUENCE_STYLES = [
    { id: 'ot', colorClass: 'tile-ot', bgClass: 'bg-ot' },
    { id: 'nt', colorClass: 'tile-nt', bgClass: 'bg-nt' },
    { id: 'bom', colorClass: 'tile-bom', bgClass: 'bg-bom' },
    { id: 'dc', colorClass: 'tile-dc', bgClass: 'bg-dc' },
    { id: 'pgp', colorClass: 'tile-pgp', bgClass: 'bg-pgp' }
];

const BRAND_TILES_CONFIG = CHRIST_NAMES_DATA.map((name, idx) => {
    const layout = BASE_SEQUENCE_STYLES[idx % BASE_SEQUENCE_STYLES.length];
    return {
        id: `name_${idx + 1}`,
        name: name,
        sectionMapId: layout.id,
        tileClass: layout.colorClass,
        bgClass: layout.bgClass
    };
});

const BOOKS_MAPPING = {
    'ot': ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
    'nt': ["Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"],
    'bom': ["1 Nephi", "2 Nephi", "Jacob", "Enos", "Jarom", "Omni", "Words of Mormon", "Mosiah", "Alma", "Helaman", "3 Nephi", "4 Nephi", "Mormon", "Ether", "Moroni"],
    'dc': ["Doctrine and Covenants", "Section", "D&C"],
    'pgp': ["Moses", "Abraham", "Joseph Smith—Matthew", "Joseph Smith—History", "Articles of Faith"]
};

// Global App State
let allVerses = [];
let chapterList = [];
let modulesData = {};
let savedBookmarks = JSON.parse(localStorage.getItem('saved_scripture_bookmarks') || '[]');
let currentChapterIndex = -1;
let viewHistory = ['home-view'];

const elements = {
    backBtn: document.getElementById('back-btn'),
    bookmarksNavBtn: document.getElementById('bookmarks-nav-btn'),
    appTitle: document.getElementById('app-title'),
    tilesGrid: document.getElementById('tiles-grid'),
    homeView: document.getElementById('home-view'),
    modulesView: document.getElementById('modules-view'),
    bookmarksView: document.getElementById('bookmarks-view'),
    modulesContainer: document.getElementById('modules-list-container'),
    bookmarksContainer: document.getElementById('bookmarks-list-container'),
    sectionBanner: document.getElementById('section-banner'),
    bannerTitle: document.getElementById('section-banner-title'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalText: document.getElementById('modal-text'),
    modalRef: document.querySelector('.modal-ref'),
    closeModalBtn: document.querySelector('.main-close'),
    prevChapterBtn: document.getElementById('prev-chapter-btn'),
    nextChapterBtn: document.getElementById('next-chapter-btn')
};

// --- CORE ASSET PARSING AND LOADING ---
async function loadApplicationData() {
    try {
        const textResponse = await fetch('standard_works.txt');
        parseScriptureDatabase(await textResponse.text());

        const jsonResponse = await fetch('modules.json');
        modulesData = await jsonResponse.json();

        initializeAppUI();
    } catch (e) {
        console.error("Critical boot validation check skipped.", e);
        elements.tilesGrid.innerHTML = `<p style='grid-column: span 2; padding:20px; color:red;'>Initialization Error. Ensure standard_works.txt and modules.json exist.</p>`;
    }
}

function parseScriptureDatabase(fullText) {
    const allLines = fullText.split(/\r?\n/);
    const lineRegex = /^((?:[1-4]\s)?[A-Za-z\s\u2014]+\d+:\d+)\s+(.*)$/;
    const uniqueChapters = new Set();

    allLines.forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        const match = cleanLine.match(lineRegex);
        
        if (match) {
            const reference = match[1].trim(); 
            const text = match[2].trim();
            let sourceId = null;
            
            for (const [key, bookSet] of Object.entries(BOOKS_MAPPING)) {
                if (bookSet.some(book => reference.startsWith(book + " "))) {
                    sourceId = key;
                    break;
                }
            }

            if (sourceId) {
                const lastColonIndex = reference.lastIndexOf(':');
                const chapterId = reference.substring(0, lastColonIndex).trim();
                allVerses.push({ ref: reference, text: text, chapterId: chapterId, source: sourceId });
                uniqueChapters.add(chapterId);
            }
        }
    });
    chapterList = Array.from(uniqueChapters);
}

// --- VIEW NAVIGATION SYSTEM ---
function navigateToView(viewId, bgClass = null) {
    document.querySelectorAll('.app-view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    if (viewId === 'home-view') {
        viewHistory = ['home-view'];
        elements.backBtn.classList.add('hidden');
        elements.appTitle.textContent = "Scripture Study";
        BASE_SEQUENCE_STYLES.forEach(b => document.body.classList.remove(b.bgClass));
    } else {
        if (viewHistory[viewHistory.length - 1] !== viewId) viewHistory.push(viewId);
        elements.backBtn.classList.remove('hidden');
    }

    if (bgClass) {
        BASE_SEQUENCE_STYLES.forEach(b => document.body.classList.remove(b.bgClass));
        document.body.classList.add(bgClass);
    }
}

elements.backBtn.addEventListener('click', () => {
    if (viewHistory.length > 1) {
        viewHistory.pop();
        const fallback = viewHistory[viewHistory.length - 1];
        let targetBg = null;
        if (fallback === 'modules-view') {
            const activeSec = BRAND_TILES_CONFIG.find(b => document.body.className.includes(b.bgClass));
            if (activeSec) targetBg = activeSec.bgClass;
        }
        navigateToView(fallback, targetBg);
    }
});

elements.bookmarksNavBtn.addEventListener('click', () => {
    renderBookmarksDashboard();
    navigateToView('bookmarks-view');
    elements.appTitle.textContent = "Bookmarks";
});

// --- RENDER CARD MODULE LIFE CONTROLLERS ---
function initializeAppUI() {
    elements.tilesGrid.innerHTML = '';
    BRAND_TILES_CONFIG.forEach(config => {
        const blockTile = document.createElement('button');
        blockTile.className = `color-tile ${config.tileClass}`;
        blockTile.innerHTML = `<span style="font-size:0.65rem; opacity:0.6;">Title ${config.id.split('_')[1]}</span><span>${config.name}</span>`;
        blockTile.onclick = () => launchSectionView(config);
        elements.tilesGrid.appendChild(blockTile);
    });
}

function launchSectionView(config) {
    elements.appTitle.textContent = config.name;
    elements.bannerTitle.textContent = config.name;
    renderSectionModulesList(config.sectionMapId);
    navigateToView('modules-view', config.bgClass);
}

function renderSectionModulesList(sectionId) {
    elements.modulesContainer.innerHTML = '';
    const items = modulesData[sectionId] || [];

    if (items.length === 0) {
        elements.modulesContainer.innerHTML = `<div class="glass-module-card text-center">No modules compiled for this section profile.</div>`;
        return;
    }

    items.forEach(mod => {
        const card = document.createElement('div');
        card.className = "glass-module-card";
        const snippetText = extractVerseStringFromRange(mod.reference);
        const isBookmarked = savedBookmarks.includes(mod.reference);

        card.innerHTML = `
            <div class="module-title">${mod.label}</div>
            <div class="module-ref">${mod.reference}</div>
            <div class="module-snippet">"${snippetText}"</div>
            <button class="tile-bookmark-toggle ${isBookmarked ? 'active' : ''}">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
            </button>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.tile-bookmark-toggle')) return;
            openChapterReaderModal(mod.reference);
        });

        const bookmarkToggle = card.querySelector('.tile-bookmark-toggle');
        bookmarkToggle.onclick = () => {
            toggleBookmarkValue(mod.reference);
            bookmarkToggle.classList.toggle('active');
        };
        elements.modulesContainer.appendChild(card);
    });
}

function extractVerseStringFromRange(ref) {
    const lastColonIndex = ref.lastIndexOf(':');
    const chapterId = ref.substring(0, lastColonIndex).trim();
    const rangeStr = ref.substring(lastColonIndex + 1);
    
    let targetVerses = [];
    if (rangeStr.includes('-')) {
        const [start, end] = rangeStr.split('-').map(Number);
        for (let i = start; i <= end; i++) targetVerses.push(i);
    } else {
        targetVerses.push(parseInt(rangeStr));
    }

    return allVerses
        .filter(v => v.chapterId === chapterId && targetVerses.includes(parseInt(v.ref.split(':')[1])))
        .map(v => v.text).join(' ');
}

// --- BOTTOM SHEET LAYER TEXT MANAGER ---
function openChapterReaderModal(fullRef) {
    const lastColonIndex = fullRef.lastIndexOf(':');
    const chapterId = fullRef.substring(0, lastColonIndex).trim();
    
    currentChapterIndex = chapterList.indexOf(chapterId);
    if (currentChapterIndex === -1) return;

    elements.modalOverlay.classList.remove('hidden');
    loadChapterTextContent(chapterId, fullRef);
}

function loadChapterTextContent(chapterId, targetHighlightRef = null) {
    elements.modalRef.innerText = chapterId;
    elements.modalText.innerHTML = '';

    let highlightSet = new Set();
    if (targetHighlightRef && targetHighlightRef.includes(':')) {
        const rangeStr = targetHighlightRef.split(':')[1];
        if (rangeStr.includes('-')) {
            const [start, end] = rangeStr.split('-').map(Number);
            for (let i = start; i <= end; i++) highlightSet.add(i);
        } else {
            highlightSet.add(parseInt(rangeStr));
        }
    }

    const matchingVerses = allVerses.filter(v => v.chapterId === chapterId);
    matchingVerses.forEach(v => {
        const verseNum = parseInt(v.ref.split(':')[1]);
        const paragraph = document.createElement('div');
        const isHighlighted = highlightSet.has(verseNum);
        
        paragraph.className = `chapter-verse ${isHighlighted ? 'highlight-verse' : ''}`;
        if (isHighlighted && verseNum === Math.min(...Array.from(highlightSet))) {
            paragraph.id = "reader-scroll-anchor";
        }
        paragraph.innerHTML = `<b>${verseNum}</b>${v.text}`;
        elements.modalText.appendChild(paragraph);
    });

    elements.prevChapterBtn.classList.toggle('hidden', currentChapterIndex <= 0);
    elements.nextChapterBtn.classList.toggle('hidden', currentChapterIndex >= chapterList.length - 1);

    setTimeout(() => {
        const anchor = document.getElementById('reader-scroll-anchor');
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else elements.modalText.scrollTop = 0;
    }, 200);
}

function stepChapterChange(direction) {
    const targetIdx = currentChapterIndex + direction;
    if (targetIdx >= 0 && targetIdx < chapterList.length) {
        currentChapterIndex = targetIdx;
        elements.modalText.style.opacity = '0';
        setTimeout(() => {
            loadChapterTextContent(chapterList[currentChapterIndex]);
            elements.modalText.style.opacity = '1';
        }, 150);
    }
}

elements.prevChapterBtn.onclick = () => stepChapterChange(-1);
elements.nextChapterBtn.onclick = () => stepChapterChange(1);
elements.closeModalBtn.onclick = () => elements.modalOverlay.classList.add('hidden');

// --- SWIPE GESTURE LAYER ---
let touchXStart = 0, touchYStart = 0;
elements.modalText.addEventListener('touchstart', (e) => {
    touchXStart = e.changedTouches[0].screenX;
    touchYStart = e.changedTouches[0].screenY;
}, { passive: true });

elements.modalText.addEventListener('touchend', (e) => {
    const deltaX = touchXStart - e.changedTouches[0].screenX;
    const deltaY = touchYStart - e.changedTouches[0].screenY;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.4) return;
    if (deltaX > 45) stepChapterChange(1);
    else if (deltaX < -45) stepChapterChange(-1);
}, { passive: true });

// --- LOCAL STORAGE MANAGER ---
function toggleBookmarkValue(ref) {
    const idx = savedBookmarks.indexOf(ref);
    if (idx > -1) savedBookmarks.splice(idx, 1);
    else savedBookmarks.unshift(ref);
    localStorage.setItem('saved_scripture_bookmarks', JSON.stringify(savedBookmarks));
}

function renderBookmarksDashboard() {
    elements.bookmarksContainer.innerHTML = '';
    if (savedBookmarks.length === 0) {
        elements.bookmarksContainer.innerHTML = `<p style="color:#94a3b8; font-style:italic; text-align:center; padding:20px;">No saved bookmarks yet.</p>`;
        return;
    }
    savedBookmarks.forEach(ref => {
        const card = document.createElement('div');
        card.className = "glass-module-card";
        card.innerHTML = `<div class="module-title">${ref.split(':')[0]}</div><div class="module-ref">${ref}</div><div class="module-snippet">"${extractVerseStringFromRange(ref)}"</div>`;
        card.onclick = () => openChapterReaderModal(ref);
        elements.bookmarksContainer.appendChild(card);
    });
}

window.addEventListener('DOMContentLoaded', loadApplicationData);
