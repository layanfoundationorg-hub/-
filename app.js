/**
 * Public Site Logic - Layan Platform
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Layan Platform Loaded');

    loadStats();
    loadNews();
    loadProjects();
    loadMedia();
    setupHeaderScroll();
    setupMobileMenu();
});

/* =========================
   HEADER EFFECT
========================= */
function setupHeaderScroll() {
    const header = document.querySelector('header');

    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('py-2', 'shadow-md');
            header.classList.remove('py-4', 'shadow-sm');
        } else {
            header.classList.add('py-4', 'shadow-sm');
            header.classList.remove('py-2', 'shadow-md');
        }
    });
}

/* =========================
   LOAD STATS
========================= */
async function loadStats() {

    try {

        const cachedStats = localStorage.getItem('layan_stats');

        if (cachedStats) {
            renderStats(JSON.parse(cachedStats));
        }

        const data = await API.get('getStats');

        if (data && !data.error) {
            localStorage.setItem('layan_stats', JSON.stringify(data));
            renderStats(data);
        }

    } catch (error) {
        console.error('Stats Error:', error);
    }
}

function renderStats(data) {

    const statsMap = {
        'المشاريع': 'stat-projects',
        'المستفيدين': 'stat-beneficiaries',
        'المبادرات': 'stat-initiatives',
        'المتطوعين': 'stat-volunteers'
    };

    data.forEach(stat => {

        const id = statsMap[stat.Label];

        if (id) {

            const element = document.getElementById(id);

            if (element) {
                element.innerText =
                    Number(stat.Value).toLocaleString();
            }
        }
    });
}

/* =========================
   LOAD NEWS
========================= */
async function loadNews() {

    const newsContainer =
        document.getElementById('news-container');

    if (!newsContainer) return;

    try {

        // عرض مؤقت أثناء التحميل
        newsContainer.innerHTML = `
            <div class="col-span-full text-center py-10">
                <div class="animate-pulse text-slate-400">
                    جاري تحميل الأخبار...
                </div>
            </div>
        `;

        // Cache
        const cachedNews =
            localStorage.getItem('layan_news');

        if (cachedNews) {
            renderNews(JSON.parse(cachedNews));
        }

        console.log('Fetching news...');

        const news = await API.get('getNews');

        console.log('News received:', news);

        if (
            news &&
            Array.isArray(news) &&
            news.length > 0
        ) {

            localStorage.setItem(
                'layan_news',
                JSON.stringify(news)
            );

            renderNews(news);

        } else {

            newsContainer.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fas fa-newspaper text-5xl mb-4 opacity-20"></i>
                    <p>لا توجد أخبار منشورة حالياً.</p>
                </div>
            `;
        }

    } catch (error) {

        console.error('News Error:', error);

        newsContainer.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-400">
                حدث خطأ أثناء تحميل الأخبار
            </div>
        `;
    }
}

/* =========================
   FIX GOOGLE DRIVE IMAGE URL
========================= */
function fixDriveUrl(url) {

    if (!url || url.trim() === '' || url === 'undefined') {
        return 'https://placehold.co/800x450/e2e8f0/94a3b8?text=Layan+News';
    }

    try {
        // Extract file ID from any Google Drive URL format
        let fileId = null;

        // Format: lh3.googleusercontent.com/d/FILE_ID
        const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([^/?&=]+)/);
        if (lh3Match) fileId = lh3Match[1];

        // Format: drive.google.com/file/d/FILE_ID/
        if (!fileId) {
            const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
            if (driveMatch) fileId = driveMatch[1];
        }

        // Format: id=FILE_ID
        if (!fileId) {
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
            if (idMatch) fileId = idMatch[1];
        }

        // Format: bare file ID (any long alphanumeric string)
        if (!fileId) {
            const bareMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (bareMatch) fileId = bareMatch[1];
        }

        if (fileId) {
            // Use thumbnail API - most reliable for public Drive files
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        }

        return url;

    } catch (error) {
        console.error('Image URL Error:', error);
        return 'https://placehold.co/800x450/e2e8f0/94a3b8?text=Image+Error';
    }
}

/* =========================
   RENDER NEWS
========================= */
function renderNews(news) {

    const newsContainer =
        document.getElementById('news-container');

    if (!newsContainer) return;

    // Store all news in localStorage for detail page
    localStorage.setItem('layan_all_news', JSON.stringify(news));

    newsContainer.innerHTML = news
        .slice(0, 3)
        .map((item, index) => {

            const imageUrl = fixDriveUrl(item.Images);
            const newsId = encodeURIComponent(item.Title || index);

            return `
            <div class="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition-all group">

                <div class="relative h-56 overflow-hidden bg-slate-100">

                    <img
                        src="${imageUrl}"
                        alt="${item.Title || 'News Image'}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                        loading="lazy"
                        onerror="
                            this.onerror=null;
                            this.src='https://placehold.co/800x450/e2e8f0/94a3b8?text=Layan';
                        "
                    >

                    <div class="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ${item.Category || 'أخبار'}
                    </div>

                </div>

                <div class="p-6">

                    <div class="text-slate-400 text-xs mb-3 flex items-center gap-2">
                        <i class="far fa-calendar-alt"></i>
                        ${item.Date || ''}
                    </div>

                    <h4 class="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                        ${item.Title || ''}
                    </h4>

                    <p class="text-slate-600 text-sm mb-6 line-clamp-3">
                        ${item.Content || ''}
                    </p>

                    <a
                        href="news.html?id=${newsId}"
                        class="text-blue-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all"
                    >
                        اقرأ المزيد
                        <i class="fas fa-arrow-left"></i>
                    </a>

                </div>
            </div>
        `;
        })
        .join('');
}

/* =========================
   SMOOTH SCROLL
========================= */
document.querySelectorAll('a[href^="#"]')
    .forEach(anchor => {

        anchor.addEventListener('click', function (e) {

            e.preventDefault();

            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target =
                document.querySelector(href);

            if (target) {

                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

/* =========================
   LOAD PROJECTS
========================= */
async function loadProjects() {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;

    try {
        const cachedProjects = localStorage.getItem('layan_projects');
        if (cachedProjects) {
            renderProjects(JSON.parse(cachedProjects));
        }

        const projects = await API.get('getProjects');
        if (projects && Array.isArray(projects) && projects.length > 0) {
            localStorage.setItem('layan_projects', JSON.stringify(projects));
            renderProjects(projects);
        } else {
            projectsContainer.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fas fa-briefcase text-5xl mb-4 opacity-20"></i>
                    <p>لا توجد مشاريع منشورة حالياً.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Projects Error:', error);
    }
}

function renderProjects(projects) {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;

    projectsContainer.innerHTML = projects.map(item => {
        const imageUrl = fixDriveUrl(item.Images);
        return `
            <div class="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 hover:shadow-xl transition-all flex flex-col justify-between">
                <div>
                    <div class="relative h-48 overflow-hidden bg-slate-100">
                        <img src="${imageUrl}" alt="${item.Title}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='https://placehold.co/800x450/e2e8f0/94a3b8?text=Project';">
                        <div class="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            ${item.Category || 'تنموي'}
                        </div>
                    </div>
                    <div class="p-6">
                        <h4 class="text-xl font-bold text-slate-900 mb-3">${item.Title}</h4>
                        <p class="text-slate-600 text-sm line-clamp-3 mb-4">${item.Description || ''}</p>
                    </div>
                </div>
                <div class="px-6 pb-6 pt-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <span class="text-xs text-slate-500 font-semibold"><i class="fas fa-map-marker-alt text-blue-500 ml-1"></i> ${item.Region || 'الرقة'}</span>
                    <span class="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                        ${Number(item.Beneficiaries || 0).toLocaleString()} مستفيد
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/* =========================
   LOAD MEDIA
========================= */
async function loadMedia() {
    const mediaContainer = document.getElementById('media-container');
    if (!mediaContainer) return;

    try {
        const cachedMedia = localStorage.getItem('layan_media');
        if (cachedMedia) {
            renderMedia(JSON.parse(cachedMedia));
        }

        const media = await API.get('getMedia');
        if (media && Array.isArray(media) && media.length > 0) {
            localStorage.setItem('layan_media', JSON.stringify(media));
            renderMedia(media);
        } else {
            mediaContainer.innerHTML = `
                <div class="col-span-full text-center py-12 text-slate-400">
                    <i class="fas fa-photo-video text-5xl mb-4 opacity-20"></i>
                    <p>لا توجد وسائط منشورة حالياً.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Media Error:', error);
    }
}

function renderMedia(media) {
    const mediaContainer = document.getElementById('media-container');
    if (!mediaContainer) return;

    // Only take the last 8 media uploads for the gallery
    mediaContainer.innerHTML = media.slice(-8).reverse().map(item => {
        let previewHtml = '';
        const fileUrl = item.URL || '';
        
        if (item.Type === 'صورة' || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || fileUrl.includes('drive.google.com') || fileUrl.includes('googleusercontent.com')) {
            const imgUrl = fixDriveUrl(fileUrl) || fileUrl;
            previewHtml = `<img src="${imgUrl}" class="w-full h-48 object-cover group-hover:scale-105 transition-all duration-500" onerror="this.src='https://placehold.co/400x300/e2e8f0/94a3b8?text=Image';">`;
        } else if (item.Type === 'فيديو' || fileUrl.match(/\.(mp4|webm|ogg)/i)) {
            previewHtml = `
                <div class="w-full h-48 bg-slate-900 flex items-center justify-center text-white relative">
                    <i class="fas fa-play text-4xl opacity-80 group-hover:scale-110 transition-all duration-300"></i>
                    <span class="absolute bottom-2 right-2 text-xs bg-slate-900/80 px-2 py-0.5 rounded">فيديو</span>
                </div>
            `;
        } else {
            previewHtml = `
                <div class="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-500 relative border border-slate-200">
                    <i class="far fa-file-pdf text-5xl text-red-500"></i>
                    <span class="absolute bottom-2 right-2 text-xs bg-slate-200 px-2 py-0.5 rounded">${item.Type || 'ملف'}</span>
                </div>
            `;
        }

        return `
            <a href="${fileUrl}" target="_blank" class="block rounded-2xl overflow-hidden shadow-sm border border-slate-150 hover:shadow-md transition-all group bg-white">
                <div class="relative overflow-hidden bg-slate-50">
                    ${previewHtml}
                </div>
            </a>
        `;
    }).join('');
}

/* =========================
   MOBILE MENU TOGGLE
========================= */
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const links = document.querySelectorAll('.mobile-nav-link');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
    });

    const closeMenu = () => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

    // Close when clicking background
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) closeMenu();
    });

    // Close when clicking links
    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

/* =========================
   PWA & SERVICE WORKER LOGIC
========================= */
let deferredPrompt;
const installPrompt = document.getElementById('pwa-install-prompt');
const installBtn = document.getElementById('pwa-install-btn');
const closeBtn = document.getElementById('pwa-close-btn');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Check if user previously dismissed it
    if (!localStorage.getItem('layan_pwa_dismissed') && installPrompt) {
        installPrompt.classList.remove('hidden');
        // Small delay for animation
        setTimeout(() => {
            installPrompt.classList.remove('translate-y-[150%]');
        }, 100);
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        installPrompt.classList.add('translate-y-[150%]');
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            localStorage.setItem('layan_pwa_dismissed', 'true');
        }
        deferredPrompt = null;
        
        setTimeout(() => {
            installPrompt.classList.add('hidden');
        }, 500);
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        installPrompt.classList.add('translate-y-[150%]');
        localStorage.setItem('layan_pwa_dismissed', 'true');
        setTimeout(() => {
            installPrompt.classList.add('hidden');
        }, 500);
    });
}

window.addEventListener('appinstalled', () => {
    if (installPrompt) {
        installPrompt.classList.add('translate-y-[150%]');
        setTimeout(() => { installPrompt.classList.add('hidden'); }, 500);
    }
    deferredPrompt = null;
    console.log('PWA was installed');
});