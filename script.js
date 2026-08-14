// Get the page elements we need.
const player = document.getElementById('video-player');
const video = document.getElementById('video');
const videoInput = document.getElementById('video-input');
const dropZone = document.getElementById('drop-zone');
const fileName = document.getElementById('file-name');
const playButton = document.getElementById('play');
const bigPlayButton = document.getElementById('big-play');
const backwardButton = document.getElementById('backward');
const forwardButton = document.getElementById('forward');
const muteButton = document.getElementById('mute');
const volumeSlider = document.getElementById('volume');
const progressSlider = document.getElementById('progress');
const timestamp = document.getElementById('timestamp');
const speedSelect = document.getElementById('speed');
const pipButton = document.getElementById('picture-in-picture');
const fullscreenButton = document.getElementById('fullscreen');
const subtitleButton = document.getElementById('subtitle-button');
const subtitleInput = document.getElementById('subtitle-input');
const bookmarkButton = document.getElementById('bookmark-button');
const bookmarkList = document.getElementById('bookmark-list');
const clearBookmarksButton = document.getElementById('clear-bookmarks');
const snapshotButton = document.getElementById('snapshot-button');
const theaterButton = document.getElementById('theater-button');
const themeSelect = document.getElementById('theme');
const toast = document.getElementById('toast');

let videoUrl = '';
let subtitleUrl = '';
let currentVideoKey = '';
let bookmarks = [];
let toastTimer;

// Show a small message in the bottom-right corner.
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2400);
}

function hasVideo() {
    if (!video.src) {
        showToast('Choose a video first.');
        return false;
    }

    return true;
}

// Convert seconds to 00:00 or 00:00:00.
function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return '00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(remainingSeconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${paddedMinutes}:${paddedSeconds}`;
}

// Open a video file without uploading it anywhere.
function loadVideo(file) {
    const videoExtensions = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv'];
    const extension = file ? file.name.split('.').pop().toLowerCase() : '';
    const isVideo = file && (file.type.startsWith('video/') || videoExtensions.includes(extension));

    if (!isVideo) {
        showToast('Please choose a valid video file.');
        return;
    }

    if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
    }

    videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.load();

    fileName.textContent = file.name;
    player.classList.add('has-video', 'paused');

    currentVideoKey = `localplay-${file.name}-${file.size}-${file.lastModified}`;
    loadBookmarks();
    showToast('Video opened locally.');
}

async function togglePlay() {
    if (!hasVideo()) {
        return;
    }

    if (video.paused) {
        try {
            await video.play();
        } catch (error) {
            showToast('This video could not be played.');
        }
    } else {
        video.pause();
    }
}

function updatePlayButton() {
    const isPaused = video.paused;
    playButton.textContent = isPaused ? '▶' : '❚❚';
    playButton.title = isPaused ? 'Play' : 'Pause';
    player.classList.toggle('paused', isPaused);
}

function updateProgress() {
    if (!Number.isFinite(video.duration)) {
        progressSlider.value = 0;
        timestamp.textContent = '00:00 / 00:00';
        return;
    }

    progressSlider.value = (video.currentTime / video.duration) * 100;
    timestamp.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
}

function seekFromSlider() {
    if (Number.isFinite(video.duration)) {
        video.currentTime = (progressSlider.value / 100) * video.duration;
    }
}

function skip(seconds) {
    if (!hasVideo()) {
        return;
    }

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
}

function changeVolume() {
    video.volume = volumeSlider.value;
    video.muted = Number(volumeSlider.value) === 0;
}

function toggleMute() {
    if (!hasVideo()) {
        return;
    }

    video.muted = !video.muted;
}

function updateVolumeButton() {
    if (video.muted || video.volume === 0) {
        muteButton.textContent = '🔇';
        muteButton.title = 'Unmute';
    } else if (video.volume < 0.5) {
        muteButton.textContent = '🔉';
        muteButton.title = 'Mute';
    } else {
        muteButton.textContent = '🔊';
        muteButton.title = 'Mute';
    }
}

async function toggleFullscreen() {
    if (!hasVideo()) {
        return;
    }

    try {
        if (!document.fullscreenElement) {
            await player.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        showToast('Fullscreen is not available in this browser.');
    }
}

function updateFullscreenButton() {
    const isFullscreen = document.fullscreenElement === player;
    fullscreenButton.textContent = isFullscreen ? '✕' : '⛶';
    fullscreenButton.title = isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
}

async function togglePictureInPicture() {
    if (!hasVideo()) {
        return;
    }

    if (!document.pictureInPictureEnabled) {
        showToast('Picture in picture is not supported here.');
        return;
    }

    try {
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await video.requestPictureInPicture();
        }
    } catch (error) {
        showToast('Picture in picture could not be opened.');
    }
}

// Add a local WebVTT subtitle file to the video.
function loadSubtitles(file) {
    if (!hasVideo() || !file) {
        return;
    }

    if (!file.name.toLowerCase().endsWith('.vtt')) {
        showToast('Subtitles must be a .vtt file.');
        return;
    }

    if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
    }

    subtitleUrl = URL.createObjectURL(file);

    const oldTrack = video.querySelector('track');
    if (oldTrack) {
        oldTrack.remove();
    }

    const track = document.createElement('track');
    track.kind = 'captions';
    track.label = file.name;
    track.src = subtitleUrl;
    track.default = true;
    video.appendChild(track);

    track.addEventListener('load', function () {
        track.track.mode = 'showing';
    });

    showToast('Subtitles loaded.');
}

// Bookmarks are saved only in this browser.
function saveBookmarks() {
    if (currentVideoKey) {
        localStorage.setItem(`${currentVideoKey}-bookmarks`, JSON.stringify(bookmarks));
    }
}

function loadBookmarks() {
    const savedBookmarks = localStorage.getItem(`${currentVideoKey}-bookmarks`);

    try {
        bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
    } catch (error) {
        bookmarks = [];
    }

    renderBookmarks();
}

function addBookmark() {
    if (!hasVideo()) {
        return;
    }

    const time = Math.floor(video.currentTime);

    if (bookmarks.includes(time)) {
        showToast('That moment is already bookmarked.');
        return;
    }

    bookmarks.push(time);
    bookmarks.sort(function (a, b) {
        return a - b;
    });

    saveBookmarks();
    renderBookmarks();
    showToast(`Bookmarked ${formatTime(time)}.`);
}

function removeBookmark(time) {
    bookmarks = bookmarks.filter(function (bookmark) {
        return bookmark !== time;
    });

    saveBookmarks();
    renderBookmarks();
}

function renderBookmarks() {
    bookmarkList.innerHTML = '';

    if (bookmarks.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'Add a bookmark to save an interesting moment.';
        bookmarkList.appendChild(emptyMessage);
        return;
    }

    bookmarks.forEach(function (time) {
        const item = document.createElement('div');
        const timeButton = document.createElement('button');
        const removeButton = document.createElement('button');

        item.className = 'bookmark-item';
        timeButton.className = 'bookmark-time';
        removeButton.className = 'bookmark-remove';

        timeButton.textContent = formatTime(time);
        removeButton.textContent = '×';
        removeButton.title = 'Remove bookmark';

        timeButton.addEventListener('click', function () {
            video.currentTime = time;
        });

        removeButton.addEventListener('click', function () {
            removeBookmark(time);
        });

        item.append(timeButton, removeButton);
        bookmarkList.appendChild(item);
    });
}

function clearBookmarks() {
    bookmarks = [];
    saveBookmarks();
    renderBookmarks();
    showToast('Bookmarks cleared.');
}

// Draw the current frame on a canvas and download it as a PNG.
function saveSnapshot() {
    if (!hasVideo() || !video.videoWidth) {
        showToast('Play the video before saving a snapshot.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(function (blob) {
        if (!blob) {
            showToast('The snapshot could not be saved.');
            return;
        }

        const snapshotUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        downloadLink.href = snapshotUrl;
        downloadLink.download = `snapshot-${formatTime(video.currentTime).replaceAll(':', '-')}.png`;
        downloadLink.click();

        setTimeout(function () {
            URL.revokeObjectURL(snapshotUrl);
        }, 1000);
        showToast('Snapshot saved.');
    }, 'image/png');
}

function toggleTheaterMode() {
    document.body.classList.toggle('theater');
    const isTheater = document.body.classList.contains('theater');
    theaterButton.lastChild.textContent = isTheater ? ' Exit theater' : ' Theater mode';
}

function changeTheme() {
    document.documentElement.dataset.theme = themeSelect.value;
    localStorage.setItem('localplay-theme', themeSelect.value);
}

// Drag-and-drop events.
['dragenter', 'dragover'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropZone.classList.add('dragging');
    });
});

['dragleave', 'drop'].forEach(function (eventName) {
    dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropZone.classList.remove('dragging');
    });
});

dropZone.addEventListener('drop', function (event) {
    loadVideo(event.dataTransfer.files[0]);
});

// Player events.
videoInput.addEventListener('change', function () {
    loadVideo(videoInput.files[0]);
    videoInput.value = '';
});

video.addEventListener('click', togglePlay);
video.addEventListener('dblclick', toggleFullscreen);
video.addEventListener('play', updatePlayButton);
video.addEventListener('pause', updatePlayButton);
video.addEventListener('ended', updatePlayButton);
video.addEventListener('timeupdate', updateProgress);
video.addEventListener('loadedmetadata', updateProgress);
video.addEventListener('volumechange', updateVolumeButton);

playButton.addEventListener('click', togglePlay);
bigPlayButton.addEventListener('click', togglePlay);
backwardButton.addEventListener('click', function () {
    skip(-10);
});
forwardButton.addEventListener('click', function () {
    skip(10);
});
muteButton.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', changeVolume);
progressSlider.addEventListener('input', seekFromSlider);
speedSelect.addEventListener('change', function () {
    video.playbackRate = Number(speedSelect.value);
});
pipButton.addEventListener('click', togglePictureInPicture);
fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);

subtitleButton.addEventListener('click', function () {
    if (hasVideo()) {
        subtitleInput.click();
    }
});
subtitleInput.addEventListener('change', function () {
    loadSubtitles(subtitleInput.files[0]);
    subtitleInput.value = '';
});

bookmarkButton.addEventListener('click', addBookmark);
clearBookmarksButton.addEventListener('click', clearBookmarks);
snapshotButton.addEventListener('click', saveSnapshot);
theaterButton.addEventListener('click', toggleTheaterMode);
themeSelect.addEventListener('change', changeTheme);

// Keyboard shortcuts do not run while a form control is selected.
document.addEventListener('keydown', function (event) {
    const tagName = document.activeElement.tagName;

    if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'BUTTON') {
        return;
    }

    if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
    } else if (event.key === 'ArrowLeft') {
        skip(-10);
    } else if (event.key === 'ArrowRight') {
        skip(10);
    } else if (event.key.toLowerCase() === 'm') {
        toggleMute();
    } else if (event.key.toLowerCase() === 'f') {
        toggleFullscreen();
    } else if (event.key.toLowerCase() === 'p') {
        togglePictureInPicture();
    } else if (event.key.toLowerCase() === 'b') {
        addBookmark();
    }
});

// Load the previously selected color theme.
const savedTheme = localStorage.getItem('localplay-theme') || 'violet';
themeSelect.value = savedTheme;
changeTheme();

if (!document.pictureInPictureEnabled) {
    pipButton.hidden = true;
}

window.addEventListener('beforeunload', function () {
    if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
    }

    if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
    }
});
