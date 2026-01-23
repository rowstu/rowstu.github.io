/**
 * ChordScope - Song Key & Chord Analyzer
 *
 * This application searches for song chords, identifies keys,
 * and displays chord progressions with Nashville number notation.
 *
 * IMPORTANT NOTE ON DATA SOURCES:
 * Most chord websites (Ultimate Guitar, Chordify, etc.) don't provide public APIs
 * and have strict CORS policies. This app uses a combination of:
 * 1. CORS proxy services for fetching data
 * 2. Fallback to a demo/mock mode with sample songs
 *
 * For production use, you would need to:
 * - Set up a backend proxy server
 * - Use official APIs where available (e.g., Genius API for lyrics)
 * - Consider services like Hooktheory or Chordify's potential API access
 */

// ═══════════════════════════════════════════════════════════════
// Constants and Configuration
// ═══════════════════════════════════════════════════════════════

/**
 * Musical note constants and chord quality definitions
 * Used for key identification and Nashville number calculations
 */
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Enharmonic equivalents for normalization
const ENHARMONIC_MAP = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B',
    'E#': 'F', 'B#': 'C'
};

/**
 * Scale intervals for major and minor keys
 * Used to build diatonic chords in any key
 */
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

/**
 * Chord qualities for each scale degree
 * Major: I ii iii IV V vi vii°
 * Minor: i ii° III iv v VI VII
 */
const MAJOR_CHORD_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];
const MINOR_CHORD_QUALITIES = ['m', 'dim', '', 'm', 'm', '', ''];

// Nashville number symbols
const NASHVILLE_NUMBERS = ['1', '2', '3', '4', '5', '6', '7'];

// CORS proxy options (these may have rate limits or go offline)
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
];

// ═══════════════════════════════════════════════════════════════
// Sample Song Database (Fallback when APIs unavailable)
// ═══════════════════════════════════════════════════════════════

/**
 * Sample songs with pre-analyzed chord data
 * Used as fallback when external sources are unavailable
 */
const SAMPLE_SONGS = {
    'hotel california|eagles': {
        title: 'Hotel California',
        artist: 'Eagles',
        key: 'Bm',
        secondaryKey: null,
        sections: [
            {
                type: 'intro',
                label: 'Intro',
                chords: [
                    { chord: 'Bm', beats: 4 },
                    { chord: 'F#7', beats: 4 },
                    { chord: 'A', beats: 4 },
                    { chord: 'E', beats: 4 },
                    { chord: 'G', beats: 4 },
                    { chord: 'D', beats: 4 },
                    { chord: 'Em', beats: 4 },
                    { chord: 'F#7', beats: 4 }
                ]
            },
            {
                type: 'verse',
                label: 'Verse 1',
                chords: [
                    { chord: 'Bm', beats: 4, lyrics: 'On a dark desert highway' },
                    { chord: 'F#7', beats: 4, lyrics: 'cool wind in my hair' },
                    { chord: 'A', beats: 4, lyrics: 'Warm smell of colitas' },
                    { chord: 'E', beats: 4, lyrics: 'rising up through the air' },
                    { chord: 'G', beats: 4, lyrics: 'Up ahead in the distance' },
                    { chord: 'D', beats: 4, lyrics: 'I saw a shimmering light' },
                    { chord: 'Em', beats: 4, lyrics: 'My head grew heavy and my sight grew dim' },
                    { chord: 'F#7', beats: 4, lyrics: 'I had to stop for the night' }
                ]
            },
            {
                type: 'chorus',
                label: 'Chorus',
                chords: [
                    { chord: 'G', beats: 4, lyrics: 'Welcome to the Hotel California' },
                    { chord: 'D', beats: 4 },
                    { chord: 'F#7', beats: 4, lyrics: 'Such a lovely place' },
                    { chord: 'Bm', beats: 4 },
                    { chord: 'G', beats: 4, lyrics: 'Plenty of room at the Hotel California' },
                    { chord: 'D', beats: 4 },
                    { chord: 'Em', beats: 4, lyrics: 'Any time of year' },
                    { chord: 'F#7', beats: 4, lyrics: 'You can find it here' }
                ]
            }
        ],
        source: 'Sample Database'
    },

    'wonderwall|oasis': {
        title: 'Wonderwall',
        artist: 'Oasis',
        key: 'F#m',
        secondaryKey: null,
        sections: [
            {
                type: 'intro',
                label: 'Intro',
                chords: [
                    { chord: 'Em7', beats: 2 },
                    { chord: 'G', beats: 2 },
                    { chord: 'Dsus4', beats: 2 },
                    { chord: 'A7sus4', beats: 2 }
                ]
            },
            {
                type: 'verse',
                label: 'Verse',
                chords: [
                    { chord: 'Em7', beats: 2, lyrics: 'Today is gonna be the day' },
                    { chord: 'G', beats: 2 },
                    { chord: 'Dsus4', beats: 2, lyrics: 'That they\'re gonna throw it back to you' },
                    { chord: 'A7sus4', beats: 2 },
                    { chord: 'Em7', beats: 2, lyrics: 'By now you should\'ve somehow' },
                    { chord: 'G', beats: 2 },
                    { chord: 'Dsus4', beats: 2, lyrics: 'Realized what you gotta do' },
                    { chord: 'A7sus4', beats: 2 }
                ]
            },
            {
                type: 'chorus',
                label: 'Chorus',
                chords: [
                    { chord: 'C', beats: 2, lyrics: 'And all the roads we have to walk are winding' },
                    { chord: 'D', beats: 2 },
                    { chord: 'Em', beats: 4 },
                    { chord: 'C', beats: 2, lyrics: 'And all the lights that lead us there are blinding' },
                    { chord: 'D', beats: 2 },
                    { chord: 'Em', beats: 4 },
                    { chord: 'C', beats: 2 },
                    { chord: 'D', beats: 2 },
                    { chord: 'G', beats: 2, lyrics: 'I said maybe' },
                    { chord: 'D', beats: 1 },
                    { chord: 'Em7', beats: 1 },
                    { chord: 'C', beats: 2, lyrics: 'You\'re gonna be the one that saves me' },
                    { chord: 'Em7', beats: 2 },
                    { chord: 'G', beats: 2, lyrics: 'And after all' },
                    { chord: 'Em7', beats: 2 },
                    { chord: 'C', beats: 2, lyrics: 'You\'re my wonderwall' },
                    { chord: 'Em7', beats: 2 }
                ]
            }
        ],
        source: 'Sample Database'
    },

    'let it be|the beatles': {
        title: 'Let It Be',
        artist: 'The Beatles',
        key: 'C',
        secondaryKey: null,
        sections: [
            {
                type: 'verse',
                label: 'Verse 1',
                chords: [
                    { chord: 'C', beats: 2, lyrics: 'When I find myself in times of trouble' },
                    { chord: 'G', beats: 2 },
                    { chord: 'Am', beats: 2, lyrics: 'Mother Mary comes to me' },
                    { chord: 'F', beats: 2 },
                    { chord: 'C', beats: 2, lyrics: 'Speaking words of wisdom' },
                    { chord: 'G', beats: 2 },
                    { chord: 'F', beats: 1, lyrics: 'Let it be' },
                    { chord: 'Em', beats: 1 },
                    { chord: 'Dm', beats: 1 },
                    { chord: 'C', beats: 1 }
                ]
            },
            {
                type: 'chorus',
                label: 'Chorus',
                chords: [
                    { chord: 'Am', beats: 2, lyrics: 'Let it be, let it be' },
                    { chord: 'G', beats: 2 },
                    { chord: 'F', beats: 2, lyrics: 'Let it be, let it be' },
                    { chord: 'C', beats: 2 },
                    { chord: 'C', beats: 2, lyrics: 'Whisper words of wisdom' },
                    { chord: 'G', beats: 2 },
                    { chord: 'F', beats: 1, lyrics: 'Let it be' },
                    { chord: 'Em', beats: 1 },
                    { chord: 'Dm', beats: 1 },
                    { chord: 'C', beats: 1 }
                ]
            }
        ],
        source: 'Sample Database'
    },

    'sweet home alabama|lynyrd skynyrd': {
        title: 'Sweet Home Alabama',
        artist: 'Lynyrd Skynyrd',
        key: 'D',
        secondaryKey: 'G',
        sections: [
            {
                type: 'intro',
                label: 'Intro/Main Riff',
                chords: [
                    { chord: 'D', beats: 2 },
                    { chord: 'C', beats: 2 },
                    { chord: 'G', beats: 4 }
                ]
            },
            {
                type: 'verse',
                label: 'Verse',
                chords: [
                    { chord: 'D', beats: 2, lyrics: 'Big wheels keep on turning' },
                    { chord: 'C', beats: 2 },
                    { chord: 'G', beats: 4, lyrics: 'Carry me home to see my kin' },
                    { chord: 'D', beats: 2, lyrics: 'Singing songs about the Southland' },
                    { chord: 'C', beats: 2 },
                    { chord: 'G', beats: 4, lyrics: 'I miss Alabama once again' }
                ]
            },
            {
                type: 'chorus',
                label: 'Chorus',
                chords: [
                    { chord: 'D', beats: 2, lyrics: 'Sweet home Alabama' },
                    { chord: 'C', beats: 2 },
                    { chord: 'G', beats: 4, lyrics: 'Where the skies are so blue' },
                    { chord: 'D', beats: 2, lyrics: 'Sweet home Alabama' },
                    { chord: 'C', beats: 2 },
                    { chord: 'G', beats: 4, lyrics: 'Lord, I\'m coming home to you' }
                ]
            }
        ],
        source: 'Sample Database'
    },

    'hallelujah|leonard cohen': {
        title: 'Hallelujah',
        artist: 'Leonard Cohen',
        key: 'C',
        secondaryKey: null,
        sections: [
            {
                type: 'verse',
                label: 'Verse 1',
                chords: [
                    { chord: 'C', beats: 4, lyrics: 'I\'ve heard there was a secret chord' },
                    { chord: 'Am', beats: 4, lyrics: 'That David played, and it pleased the Lord' },
                    { chord: 'C', beats: 2, lyrics: 'But you don\'t really' },
                    { chord: 'Am', beats: 2, lyrics: 'care for music, do you?' },
                    { chord: 'F', beats: 2, lyrics: 'It goes like this' },
                    { chord: 'G', beats: 2, lyrics: 'The fourth, the fifth' },
                    { chord: 'Am', beats: 2, lyrics: 'The minor fall' },
                    { chord: 'F', beats: 2, lyrics: 'the major lift' },
                    { chord: 'G', beats: 2, lyrics: 'The baffled king' },
                    { chord: 'E7', beats: 2, lyrics: 'composing Hallelujah' }
                ]
            },
            {
                type: 'chorus',
                label: 'Chorus',
                chords: [
                    { chord: 'F', beats: 4, lyrics: 'Hallelujah' },
                    { chord: 'Am', beats: 4, lyrics: 'Hallelujah' },
                    { chord: 'F', beats: 4, lyrics: 'Hallelujah' },
                    { chord: 'C', beats: 2, lyrics: 'Hallelu' },
                    { chord: 'G', beats: 2, lyrics: 'jah' },
                    { chord: 'C', beats: 4 }
                ]
            }
        ],
        source: 'Sample Database'
    },

    'stairway to heaven|led zeppelin': {
        title: 'Stairway to Heaven',
        artist: 'Led Zeppelin',
        key: 'Am',
        secondaryKey: 'C',
        sections: [
            {
                type: 'intro',
                label: 'Intro',
                chords: [
                    { chord: 'Am', beats: 2 },
                    { chord: 'E+/G#', beats: 2 },
                    { chord: 'C/G', beats: 2 },
                    { chord: 'D/F#', beats: 2 },
                    { chord: 'Fmaj7', beats: 4 },
                    { chord: 'G', beats: 2 },
                    { chord: 'Am', beats: 2 }
                ]
            },
            {
                type: 'verse',
                label: 'Verse 1',
                chords: [
                    { chord: 'Am', beats: 2, lyrics: 'There\'s a lady who\'s sure' },
                    { chord: 'E+/G#', beats: 2 },
                    { chord: 'C/G', beats: 2, lyrics: 'all that glitters is gold' },
                    { chord: 'D/F#', beats: 2 },
                    { chord: 'Fmaj7', beats: 2, lyrics: 'And she\'s buying a stairway' },
                    { chord: 'G', beats: 2, lyrics: 'to heaven' },
                    { chord: 'Am', beats: 4 }
                ]
            },
            {
                type: 'bridge',
                label: 'Bridge (Rock Section)',
                chords: [
                    { chord: 'Am', beats: 2, lyrics: 'And as we wind on down the road' },
                    { chord: 'G', beats: 2 },
                    { chord: 'F', beats: 2, lyrics: 'Our shadows taller than our soul' },
                    { chord: 'G', beats: 2 },
                    { chord: 'Am', beats: 2, lyrics: 'There walks a lady we all know' },
                    { chord: 'G', beats: 2 },
                    { chord: 'F', beats: 2, lyrics: 'Who shines white light and wants to show' },
                    { chord: 'G', beats: 2 }
                ]
            }
        ],
        source: 'Sample Database'
    }
};

// ═══════════════════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════════════════

const elements = {
    searchForm: document.getElementById('search-form'),
    songInput: document.getElementById('song-input'),
    artistInput: document.getElementById('artist-input'),
    searchBtn: document.getElementById('search-btn'),
    loading: document.getElementById('loading'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    results: document.getElementById('results'),
    resultSong: document.getElementById('result-song'),
    resultArtist: document.getElementById('result-artist'),
    keyDisplay: document.getElementById('key-display'),
    chordLegend: document.getElementById('chord-legend'),
    songStructure: document.getElementById('song-structure'),
    markdownView: document.getElementById('markdown-view'),
    markdownContent: document.getElementById('markdown-content'),
    copyMarkdown: document.getElementById('copy-markdown'),
    sourceAttribution: document.getElementById('source-attribution'),
    viewToggleBtns: document.querySelectorAll('.toggle-btn')
};

// Current song data for view switching
let currentSongData = null;

// ═══════════════════════════════════════════════════════════════
// Music Theory Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Normalizes a chord root to sharp notation
 * @param {string} note - The note to normalize (e.g., 'Bb', 'F#')
 * @returns {string} - Normalized note with sharps
 */
function normalizeNote(note) {
    if (!note) return null;

    // Handle enharmonic equivalents
    if (ENHARMONIC_MAP[note]) {
        return ENHARMONIC_MAP[note];
    }

    return note;
}

/**
 * Extracts the root note from a chord symbol
 * @param {string} chord - Full chord symbol (e.g., 'Am7', 'F#m', 'Cmaj7')
 * @returns {string} - Root note
 */
function getChordRoot(chord) {
    if (!chord) return null;

    // Match the root note (letter + optional # or b)
    const match = chord.match(/^([A-G][#b]?)/);
    return match ? normalizeNote(match[1]) : null;
}

/**
 * Determines if a chord is minor
 * @param {string} chord - Full chord symbol
 * @returns {boolean}
 */
function isMinorChord(chord) {
    if (!chord) return false;

    // Remove root note and check for minor indicators
    const quality = chord.replace(/^[A-G][#b]?/, '');
    return quality.startsWith('m') && !quality.startsWith('maj');
}

/**
 * Determines if a chord is diminished
 * @param {string} chord - Full chord symbol
 * @returns {boolean}
 */
function isDiminishedChord(chord) {
    if (!chord) return false;

    const quality = chord.replace(/^[A-G][#b]?/, '').toLowerCase();
    return quality.includes('dim') || quality.includes('°');
}

/**
 * Gets the semitone index of a note (0-11)
 * @param {string} note - Note name
 * @returns {number} - Semitone index
 */
function getNoteIndex(note) {
    const normalized = normalizeNote(note);
    const index = NOTES.indexOf(normalized);
    return index >= 0 ? index : FLAT_NOTES.indexOf(note);
}

/**
 * Gets a note name from semitone index
 * @param {number} index - Semitone index (0-11)
 * @param {boolean} useFlats - Whether to use flat notation
 * @returns {string} - Note name
 */
function getNoteName(index, useFlats = false) {
    const normalizedIndex = ((index % 12) + 12) % 12;
    return useFlats ? FLAT_NOTES[normalizedIndex] : NOTES[normalizedIndex];
}

/**
 * Builds the diatonic chords for a given key
 * @param {string} root - Root note of the key
 * @param {boolean} isMinor - Whether the key is minor
 * @returns {Array} - Array of chord objects with degree, chord name, and quality
 */
function buildDiatonicChords(root, isMinor) {
    const rootIndex = getNoteIndex(root);
    const intervals = isMinor ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
    const qualities = isMinor ? MINOR_CHORD_QUALITIES : MAJOR_CHORD_QUALITIES;

    return intervals.map((interval, degree) => {
        const noteIndex = (rootIndex + interval) % 12;
        const noteName = getNoteName(noteIndex);
        const quality = qualities[degree];

        return {
            degree: degree + 1,
            nashville: NASHVILLE_NUMBERS[degree] + (quality === 'm' ? 'm' : quality === 'dim' ? '°' : ''),
            chord: noteName + quality,
            root: noteName,
            quality: quality || 'maj'
        };
    });
}

/**
 * Calculates the Nashville number for a chord in a given key
 * @param {string} chord - Full chord symbol
 * @param {string} keyRoot - Root of the key
 * @param {boolean} isMinorKey - Whether the key is minor
 * @returns {string} - Nashville number notation
 */
function getChordNashvilleNumber(chord, keyRoot, isMinorKey) {
    const chordRoot = getChordRoot(chord);
    if (!chordRoot || !keyRoot) return '?';

    const keyRootIndex = getNoteIndex(keyRoot);
    const chordRootIndex = getNoteIndex(chordRoot);

    // Calculate interval from key root
    const interval = ((chordRootIndex - keyRootIndex) + 12) % 12;

    // Map interval to scale degree
    const intervals = isMinorKey ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
    const degreeIndex = intervals.indexOf(interval);

    if (degreeIndex === -1) {
        // Non-diatonic chord - show as chromatic alteration
        // Find closest diatonic note
        for (let i = 0; i < intervals.length; i++) {
            if (intervals[i] === interval - 1) {
                return '#' + NASHVILLE_NUMBERS[i];
            }
            if (intervals[i] === interval + 1) {
                return 'b' + NASHVILLE_NUMBERS[(i + 1) % 7];
            }
        }
        return '?';
    }

    let nashville = NASHVILLE_NUMBERS[degreeIndex];

    // Add quality indicator
    if (isMinorChord(chord)) {
        nashville += 'm';
    } else if (isDiminishedChord(chord)) {
        nashville += '°';
    }

    // Add extensions if present
    const extensions = chord.replace(/^[A-G][#b]?m?/, '');
    if (extensions && !extensions.startsWith('aj')) {
        // Filter out 'maj' but keep things like '7', 'sus4', etc.
        const cleanExt = extensions.replace(/^(dim|°)/, '');
        if (cleanExt) {
            nashville += cleanExt;
        }
    }

    return nashville;
}

/**
 * Analyzes a collection of chords to determine the likely key
 * Uses chord frequency analysis and common progression patterns
 * @param {Array} allChords - Array of chord symbols
 * @returns {Object} - Key analysis result with primary and secondary keys
 */
function analyzeKey(allChords) {
    if (!allChords || allChords.length === 0) {
        return { primary: { root: 'C', isMinor: false }, secondary: null };
    }

    // Count chord occurrences
    const chordCounts = {};
    allChords.forEach(chord => {
        const root = getChordRoot(chord);
        if (root) {
            const key = root + (isMinorChord(chord) ? 'm' : '');
            chordCounts[key] = (chordCounts[key] || 0) + 1;
        }
    });

    // Score each possible key
    const keyScores = {};

    NOTES.forEach(note => {
        // Score as major key
        const majorChords = buildDiatonicChords(note, false);
        let majorScore = 0;
        majorChords.forEach((diatonic, index) => {
            const chordKey = diatonic.root + (diatonic.quality === 'm' ? 'm' : '');
            if (chordCounts[chordKey]) {
                // Weight by chord function (I, IV, V more important)
                const weight = [3, 1, 1, 2, 2.5, 1.5, 0.5][index];
                majorScore += chordCounts[chordKey] * weight;
            }
        });
        keyScores[note] = { score: majorScore, isMinor: false };

        // Score as minor key
        const minorChords = buildDiatonicChords(note, true);
        let minorScore = 0;
        minorChords.forEach((diatonic, index) => {
            const chordKey = diatonic.root + (diatonic.quality === 'm' ? 'm' : '');
            if (chordCounts[chordKey]) {
                const weight = [3, 0.5, 1.5, 2, 2, 1.5, 1][index];
                minorScore += chordCounts[chordKey] * weight;
            }
        });

        if (minorScore > keyScores[note].score) {
            keyScores[note] = { score: minorScore, isMinor: true };
        }
    });

    // Find top two keys
    const sortedKeys = Object.entries(keyScores)
        .sort((a, b) => b[1].score - a[1].score);

    const primary = {
        root: sortedKeys[0][0],
        isMinor: sortedKeys[0][1].isMinor
    };

    // Check for secondary key (modulation) if score is close
    let secondary = null;
    if (sortedKeys[1][1].score > sortedKeys[0][1].score * 0.6) {
        secondary = {
            root: sortedKeys[1][0],
            isMinor: sortedKeys[1][1].isMinor
        };
    }

    return { primary, secondary };
}

/**
 * Formats a key for display
 * @param {Object} key - Key object with root and isMinor
 * @returns {string} - Formatted key name
 */
function formatKeyName(key) {
    if (!key) return '';
    return key.root + (key.isMinor ? 'm' : '');
}

// ═══════════════════════════════════════════════════════════════
// Data Fetching Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Attempts to fetch chord data from external sources
 * Falls back to sample database if external sources fail
 * @param {string} song - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object>} - Song data object
 */
async function fetchChordData(song, artist) {
    const searchKey = `${song.toLowerCase()}|${artist.toLowerCase()}`;

    // First check sample database
    if (SAMPLE_SONGS[searchKey]) {
        return SAMPLE_SONGS[searchKey];
    }

    // Try to find partial matches in sample database
    for (const [key, data] of Object.entries(SAMPLE_SONGS)) {
        const [sampleSong, sampleArtist] = key.split('|');
        if (sampleSong.includes(song.toLowerCase()) ||
            song.toLowerCase().includes(sampleSong)) {
            return data;
        }
    }

    // Attempt external API fetch (with CORS proxy)
    // Note: Most chord sites don't have public APIs, so this is demonstrative
    try {
        const data = await tryExternalSources(song, artist);
        if (data) return data;
    } catch (error) {
        console.log('External source fetch failed:', error.message);
    }

    // Return null to indicate not found
    return null;
}

/**
 * Attempts to fetch from external sources using CORS proxies
 * This is a placeholder for potential API integrations
 * @param {string} song - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>}
 */
async function tryExternalSources(song, artist) {
    // Note: This is demonstrative. Real implementation would need:
    // 1. A backend proxy server
    // 2. API keys for services that offer them
    // 3. Proper scraping permissions/agreements

    // Example: Try to parse a chord sheet from a public source
    // Most sites block CORS, so this typically won't work from browser

    console.log(`Searching external sources for: ${song} by ${artist}`);

    // Return null - external sources not available in demo mode
    return null;
}

/**
 * Parses raw chord sheet text into structured data
 * @param {string} rawText - Raw chord sheet text
 * @returns {Object} - Parsed song data
 */
function parseChordSheet(rawText) {
    const lines = rawText.split('\n');
    const sections = [];
    let currentSection = null;

    const sectionPatterns = {
        verse: /\[?\s*(verse|v\d*)\s*\]?/i,
        chorus: /\[?\s*(chorus|ch)\s*\]?/i,
        bridge: /\[?\s*(bridge|br)\s*\]?/i,
        intro: /\[?\s*(intro)\s*\]?/i,
        outro: /\[?\s*(outro|end)\s*\]?/i,
        preChorus: /\[?\s*(pre-?chorus|pc)\s*\]?/i
    };

    const chordLinePattern = /^[\s]*([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d)*[\s]*)+$/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for section markers
        let sectionType = null;
        for (const [type, pattern] of Object.entries(sectionPatterns)) {
            if (pattern.test(line)) {
                sectionType = type;
                break;
            }
        }

        if (sectionType) {
            if (currentSection && currentSection.chords.length > 0) {
                sections.push(currentSection);
            }
            currentSection = {
                type: sectionType,
                label: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
                chords: []
            };
            continue;
        }

        // Check for chord lines
        if (chordLinePattern.test(line) && line.length > 0) {
            if (!currentSection) {
                currentSection = {
                    type: 'verse',
                    label: 'Verse',
                    chords: []
                };
            }

            // Extract chords from line
            const chords = line.match(/[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|\d)*/g) || [];
            const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

            // Check if next line is lyrics
            const isLyricLine = nextLine && !chordLinePattern.test(nextLine) &&
                               !Object.values(sectionPatterns).some(p => p.test(nextLine));

            chords.forEach((chord, idx) => {
                currentSection.chords.push({
                    chord,
                    beats: 4,
                    lyrics: idx === 0 && isLyricLine ? nextLine : undefined
                });
            });

            if (isLyricLine) i++; // Skip lyrics line since we captured it
        }
    }

    if (currentSection && currentSection.chords.length > 0) {
        sections.push(currentSection);
    }

    return sections;
}

// ═══════════════════════════════════════════════════════════════
// UI Rendering Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Shows the loading state
 */
function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.results.classList.add('hidden');
    elements.errorContainer.classList.add('hidden');
    elements.searchBtn.disabled = true;
}

/**
 * Hides the loading state
 */
function hideLoading() {
    elements.loading.classList.add('hidden');
    elements.searchBtn.disabled = false;
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    hideLoading();
    elements.errorContainer.classList.remove('hidden');
    elements.results.classList.add('hidden');
    elements.errorMessage.textContent = message;
}

/**
 * Renders the full results UI
 * @param {Object} songData - Processed song data
 */
function renderResults(songData) {
    hideLoading();
    elements.errorContainer.classList.add('hidden');
    elements.results.classList.remove('hidden');

    currentSongData = songData;

    // Render song header
    elements.resultSong.textContent = songData.title;
    elements.resultArtist.textContent = songData.artist;

    // Analyze key from all chords
    const allChords = songData.sections.flatMap(s => s.chords.map(c => c.chord));
    const keyAnalysis = analyzeKey(allChords);

    // Override with provided key if available
    if (songData.key) {
        const isMinor = songData.key.includes('m');
        keyAnalysis.primary = {
            root: songData.key.replace('m', ''),
            isMinor
        };
    }

    if (songData.secondaryKey) {
        const isMinor = songData.secondaryKey.includes('m');
        keyAnalysis.secondary = {
            root: songData.secondaryKey.replace('m', ''),
            isMinor
        };
    }

    songData.keyAnalysis = keyAnalysis;

    // Render key display
    renderKeyDisplay(keyAnalysis);

    // Render chord legend
    renderChordLegend(keyAnalysis.primary);

    // Render song structure
    renderSongStructure(songData.sections, keyAnalysis.primary);

    // Generate markdown content
    generateMarkdown(songData);

    // Update source attribution
    elements.sourceAttribution.textContent = songData.source ?
        `Source: ${songData.source}` : '';
}

/**
 * Renders the key analysis display
 * @param {Object} keyAnalysis - Key analysis result
 */
function renderKeyDisplay(keyAnalysis) {
    let html = `
        <div class="key-badge primary">
            <span class="key-label">Primary Key</span>
            <span class="key-value">${formatKeyName(keyAnalysis.primary)}</span>
            <span class="key-type">${keyAnalysis.primary.isMinor ? 'Minor' : 'Major'}</span>
        </div>
    `;

    if (keyAnalysis.secondary) {
        html += `
            <div class="key-badge">
                <span class="key-label">Secondary Key</span>
                <span class="key-value">${formatKeyName(keyAnalysis.secondary)}</span>
                <span class="key-type">${keyAnalysis.secondary.isMinor ? 'Minor' : 'Major'}</span>
            </div>
        `;
    }

    elements.keyDisplay.innerHTML = html;
}

/**
 * Renders the chord legend (Nashville numbers)
 * @param {Object} key - Primary key object
 */
function renderChordLegend(key) {
    const diatonicChords = buildDiatonicChords(key.root, key.isMinor);

    const html = diatonicChords.map(chord => `
        <div class="legend-item">
            <span class="legend-number">${chord.nashville}</span>
            <span class="legend-chord">${chord.chord}</span>
            <span class="legend-quality">${chord.quality}</span>
        </div>
    `).join('');

    elements.chordLegend.innerHTML = html;
}

/**
 * Renders the song structure with chords and Nashville numbers
 * @param {Array} sections - Song sections array
 * @param {Object} key - Primary key for numbering
 */
function renderSongStructure(sections, key) {
    const html = sections.map(section => {
        const chordLines = [];
        let currentLine = [];

        section.chords.forEach((chordData, idx) => {
            const nashville = getChordNashvilleNumber(
                chordData.chord,
                key.root,
                key.isMinor
            );

            currentLine.push({
                chord: chordData.chord,
                nashville,
                lyrics: chordData.lyrics
            });

            // Group chords into lines (4 per line or when lyrics change)
            if (currentLine.length >= 4 || chordData.lyrics || idx === section.chords.length - 1) {
                chordLines.push([...currentLine]);
                currentLine = [];
            }
        });

        const chordsHtml = chordLines.map(line => {
            const chordItemsHtml = line.map(item => `
                <span class="chord-item">
                    <span class="chord-name">${item.chord}</span>
                    <span class="chord-number">${item.nashville}</span>
                </span>
            `).join('');

            const lyricsHtml = line.find(i => i.lyrics) ?
                `<div class="lyrics-line">${line.find(i => i.lyrics).lyrics}</div>` : '';

            return `
                <div class="chord-line">${chordItemsHtml}</div>
                ${lyricsHtml}
            `;
        }).join('');

        return `
            <div class="section-block ${section.type}">
                <span class="section-label">${section.label}</span>
                <div class="section-chords">
                    ${chordsHtml}
                </div>
            </div>
        `;
    }).join('');

    elements.songStructure.innerHTML = html;
}

/**
 * Generates markdown representation of the song
 * @param {Object} songData - Full song data
 */
function generateMarkdown(songData) {
    const key = songData.keyAnalysis.primary;
    let md = `# ${songData.title}\n`;
    md += `**Artist:** ${songData.artist}\n\n`;
    md += `## Key: ${formatKeyName(key)} ${key.isMinor ? '(Minor)' : '(Major)'}\n\n`;

    if (songData.keyAnalysis.secondary) {
        md += `**Secondary Key:** ${formatKeyName(songData.keyAnalysis.secondary)}\n\n`;
    }

    // Nashville number legend
    md += `## Nashville Numbers\n`;
    const diatonicChords = buildDiatonicChords(key.root, key.isMinor);
    md += `| Number | Chord | Quality |\n`;
    md += `|--------|-------|--------|\n`;
    diatonicChords.forEach(chord => {
        md += `| ${chord.nashville} | ${chord.chord} | ${chord.quality} |\n`;
    });
    md += `\n`;

    // Song structure
    md += `## Song Structure\n\n`;

    songData.sections.forEach(section => {
        md += `### ${section.label}\n`;
        md += `\`\`\`\n`;

        const chordLine = section.chords.map(c => c.chord).join('  ');
        const numberLine = section.chords.map(c =>
            getChordNashvilleNumber(c.chord, key.root, key.isMinor)
        ).join('  ');

        md += `Chords:   ${chordLine}\n`;
        md += `Numbers:  ${numberLine}\n`;
        md += `\`\`\`\n\n`;
    });

    elements.markdownContent.textContent = md;
}

/**
 * Toggles between formatted and markdown views
 * @param {string} view - 'formatted' or 'markdown'
 */
function toggleView(view) {
    elements.viewToggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (view === 'markdown') {
        elements.markdownView.classList.remove('hidden');
        document.querySelectorAll('.analysis-card').forEach(el => {
            el.classList.add('hidden');
        });
    } else {
        elements.markdownView.classList.add('hidden');
        document.querySelectorAll('.analysis-card').forEach(el => {
            el.classList.remove('hidden');
        });
    }
}

/**
 * Copies markdown to clipboard
 */
async function copyMarkdown() {
    try {
        await navigator.clipboard.writeText(elements.markdownContent.textContent);
        elements.copyMarkdown.classList.add('copied');
        elements.copyMarkdown.querySelector('.copy-icon').textContent = '✓';

        setTimeout(() => {
            elements.copyMarkdown.classList.remove('copied');
            elements.copyMarkdown.querySelector('.copy-icon').textContent = '📋';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

// ═══════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════

/**
 * Handles the search form submission
 * @param {Event} e - Submit event
 */
async function handleSearch(e) {
    e.preventDefault();

    const song = elements.songInput.value.trim();
    const artist = elements.artistInput.value.trim();

    // Validate inputs
    if (!song || !artist) {
        showError('Please enter both a song title and artist name.');
        return;
    }

    showLoading();

    try {
        const songData = await fetchChordData(song, artist);

        if (!songData) {
            showError(
                `Could not find chord data for "${song}" by ${artist}. ` +
                `Try one of these sample songs: Hotel California (Eagles), ` +
                `Wonderwall (Oasis), Let It Be (The Beatles), ` +
                `Sweet Home Alabama (Lynyrd Skynyrd), Hallelujah (Leonard Cohen), ` +
                `or Stairway to Heaven (Led Zeppelin).`
            );
            return;
        }

        renderResults(songData);

    } catch (error) {
        console.error('Search error:', error);
        showError(`An error occurred while searching: ${error.message}`);
    }
}

/**
 * Handles retry button click
 */
function handleRetry() {
    elements.errorContainer.classList.add('hidden');
    elements.songInput.focus();
}

/**
 * Handles view toggle button clicks
 * @param {Event} e - Click event
 */
function handleViewToggle(e) {
    const view = e.target.dataset.view;
    if (view) {
        toggleView(view);
    }
}

// ═══════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════

/**
 * Initializes the application
 */
function init() {
    // Attach event listeners
    elements.searchForm.addEventListener('submit', handleSearch);
    elements.retryBtn.addEventListener('click', handleRetry);
    elements.copyMarkdown.addEventListener('click', copyMarkdown);

    elements.viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', handleViewToggle);
    });

    // Focus on song input
    elements.songInput.focus();

    console.log('ChordScope initialized. Ready to analyze songs!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
