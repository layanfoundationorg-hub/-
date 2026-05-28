/**
 * Admin Dashboard Logic - Layan Platform
 */

// Global state
let currentUser = null;
let isMaster = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin Dashboard Loaded');
    
    // Check authentication
    checkAuth();
    
    // Wire logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل تريد تسجيل الخروج؟')) {
                localStorage.removeItem('layan_user');
                window.location.href = 'login.html';
            }
        });
    }

    // Initialize Dashboard
    updateDashboardStats();
});

function checkAuth() {
    const userData = localStorage.getItem('layan_user');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(userData);
    isMaster = currentUser.Email === 'jjbb3782@gmail.com';

    // Update top bar with real user name
    const userNameEl = document.getElementById('topbar-username');
    if (userNameEl) userNameEl.textContent = currentUser.Name || 'مستخدم';

    // Show 'add user' button only for master
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn && isMaster) {
        addUserBtn.classList.remove('hidden');
    }

    // Hide restricted sections from non-masters
    if (!isMaster) {
        const navUsers = document.querySelector('[onclick="showSection(\'users\')"]');
        const navDashboard = document.querySelector('[onclick="showSection(\'dashboard\')"]');
        const navStats = document.querySelector('[onclick="showSection(\'stats\')"]');
        
        if (navUsers) navUsers.classList.add('hidden');
        if (navDashboard) navDashboard.classList.add('hidden');
        if (navStats) navStats.classList.add('hidden');

        // Hide default dashboard and show news for non-masters
        setTimeout(() => {
            document.getElementById('section-dashboard').classList.add('hidden');
            showSection('news');
        }, 50);
    }
}

function showSection(sectionId) {
    // Permission check
    if (!isMaster && (sectionId === 'dashboard' || sectionId === 'users' || sectionId === 'stats')) {
        alert('هذه الصفحة متاحة فقط للإدارة العليا.');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show target section
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Update sidebar UI
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(sectionId)) {
            item.classList.add('active');
        }
    });
    
    // Update Title
    const titleMap = {
        'dashboard': 'الرئيسية',
        'projects': 'إدارة المشاريع',
        'initiatives': 'المبادرات',
        'news': 'إدارة الأخبار',
        'media': 'المركز الإعلامي',
        'users': 'إدارة المستخدمين',
        'stats': 'الإحصائيات',
        'badwords': 'الكلمات المحظورة'
    };
    document.getElementById('section-title').innerText = titleMap[sectionId] || 'لوحة التحكم';
    
    // Load section specific data
    loadSectionData(sectionId);
}

async function loadSectionData(sectionId) {
    console.log('Loading section:', sectionId);
    const tableIds = {
        'news': 'news-table',
        'projects': 'projects-table',
        'users': 'users-table',
        'badwords': 'badwords-table'
    };
    
    const tableId = tableIds[sectionId];
    if (tableId) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center"><i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i><p class="mt-2 text-slate-500">جاري تحميل البيانات...</p></td></tr>`;
    }

    if (sectionId === 'news') {
        const news = await API.get('getNews');
        renderAdminTable('news-table', news, ['Title', 'Date', 'Category'], 'news', 'Title');
    } else if (sectionId === 'projects') {
        const projects = await API.get('getProjects');
        renderAdminTable('projects-table', projects, ['Title', 'Region', 'Beneficiaries'], 'projects', 'Title');
    } else if (sectionId === 'users') {
        // Get DOM elements here (after page load)
        const warning = document.getElementById('users-permission-warning');
        const addBtn = document.getElementById('add-user-btn');

        if (isMaster) {
            if (warning) warning.classList.add('hidden');
            if (addBtn) addBtn.classList.remove('hidden');
        } else {
            if (warning) warning.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
        }

        const users = await API.get('getUsers');
        
        const tbody = document.querySelector('#users-table tbody');
        if (!tbody) return;
        if (!users || !Array.isArray(users) || users.length === 0 || users.error) {
            tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 italic">لا توجد بيانات</td></tr>`;
        } else {
            tbody.innerHTML = users.map(item => `
                <tr>
                    <td class="p-4 text-slate-700">${item.Name || '-'}</td>
                    <td class="p-4 text-slate-700">${item.Email || '-'}</td>
                    <td class="p-4"><span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">${item.Role || 'مستخدم'}</span></td>
                    <td class="p-4 text-slate-700">${item.CreatedAt || '-'}</td>
                    <td class="p-4">
                        ${isMaster ? `
                        <div class="flex gap-2">
                            <button onclick="deleteItem('Users', '${item.Email}', 'Email')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف المستخدم"><i class="fas fa-trash"></i></button>
                        </div>
                        ` : '<span class="text-xs text-slate-400">غير مصرح</span>'}
                    </td>
                </tr>
            `).join('');
        }
    } else if (sectionId === 'initiatives') {
        const initiatives = await API.get('getInitiatives');
        renderInitiativesList(initiatives);
    } else if (sectionId === 'media') {
        const media = await API.get('getMedia');
        renderMediaList(media);
    } else if (sectionId === 'dashboard') {
        updateDashboardStats();
    } else if (sectionId === 'badwords') {
        const words = await API.get('getBadWords');
        const tbody = document.querySelector('#badwords-table tbody');
        if (!tbody) return;
        if (!words || words.length === 0 || words.error) {
            tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-slate-400 italic">لا توجد كلمات محظورة مضافة يدوياً</td></tr>`;
        } else {
            tbody.innerHTML = words.map(item => `
                <tr>
                    <td class="p-4 text-red-600 font-bold">${item.Word || '-'}</td>
                    <td class="p-4">
                        <button onclick="deleteItem('BadWords', '${item.Word}', 'Word')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function renderAdminTable(tableId, data, fields, sheetName, idField) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    
    if (!data || data.length === 0 || data.error) {
        tbody.innerHTML = `<tr><td colspan="${fields.length + 1}" class="p-8 text-center text-slate-400 italic">لا توجد بيانات متاحة</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr>
            ${fields.map(f => `<td class="p-4 text-slate-700">${item[f] || '-'}</td>`).join('')}
            <td class="p-4">
                <div class="flex gap-2">
                    <button onclick="editItem('${sheetName}', '${item[idField]}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteItem('${sheetName}', '${item[idField]}', '${idField}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function deleteItem(sheet, id, header) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنصر؟')) return;
    
    const result = await API.post('deleteRow', { sheet, id, header });
    if (result.success) {
        alert('تم الحذف بنجاح');
        loadSectionData(sheet.toLowerCase());
    } else {
        alert('خطأ في الحذف: ' + result.error);
    }
}

async function updateDashboardStats() {
    try {
        const projects = await API.get('getProjects');
        const initiatives = await API.get('getInitiatives');
        
        let projectsCount = 0;
        let beneficiariesCount = 0;
        let initiativesCount = 0;
        
        if (Array.isArray(projects)) {
            projectsCount = projects.length;
            projects.forEach(p => {
                const ben = parseInt(p.Beneficiaries);
                if (!isNaN(ben)) {
                    beneficiariesCount += ben;
                }
            });
        }
        
        if (Array.isArray(initiatives)) {
            initiativesCount = initiatives.length;
        }
        
        const projEl = document.getElementById('dash-projects-count');
        if (projEl) projEl.innerText = projectsCount;
        
        const benEl = document.getElementById('dash-beneficiaries-count');
        if (benEl) benEl.innerText = beneficiariesCount.toLocaleString('ar-EG');
        
        const initEl = document.getElementById('dash-initiatives-count');
        if (initEl) initEl.innerText = initiativesCount;
    } catch (e) {
        console.error('Failed to update stats:', e);
    }
}

// Modal Logic
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const formFields = document.getElementById('form-fields');
const modalForm = document.getElementById('modal-form');
let currentModalType = '';

function openModal(type) {
    currentModalType = type;
    modalOverlay.classList.remove('hidden');
    modalOverlay.classList.add('flex');
    
    let fieldsHtml = '';
    
    switch(type) {
        case 'news':
            modalTitle.innerText = 'إضافة خبر جديد';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">عنوان الخبر</label>
                    <input type="text" name="Title" required class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">المحتوى</label>
                    <textarea name="Content" rows="4" required class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">التصنيف</label>
                        <select name="Category" class="w-full p-3 border rounded-xl outline-none">
                            <option>إغاثة</option>
                            <option>تعليم</option>
                            <option>تنمية</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">الصورة</label>
                        <input type="file" name="ImageFile" accept="image/*" class="w-full p-2 border rounded-xl outline-none text-sm">
                    </div>
                </div>
            `;
            break;
        case 'projects':
            modalTitle.innerText = 'إضافة مشروع جديد';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">اسم المشروع</label>
                    <input type="text" name="Title" required class="w-full p-3 border rounded-xl outline-none">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">المنطقة</label>
                        <input type="text" name="Region" required class="w-full p-3 border rounded-xl outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">عدد المستفيدين</label>
                        <input type="number" name="Beneficiaries" class="w-full p-3 border rounded-xl outline-none">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">الوصف التفصيلي</label>
                    <textarea name="Description" rows="3" required class="w-full p-3 border rounded-xl outline-none"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">صورة المشروع</label>
                    <input type="file" name="ImageFile" accept="image/*" class="w-full p-2 border rounded-xl outline-none text-sm">
                </div>
            `;
            break;
        case 'initiatives':
            modalTitle.innerText = 'إضافة مبادرة جديدة';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">اسم المبادرة</label>
                    <input type="text" name="Title" required class="w-full p-3 border rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">الوصف</label>
                    <textarea name="Description" rows="3" required class="w-full p-3 border rounded-xl outline-none"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">صورة المبادرة</label>
                    <input type="file" name="ImageFile" accept="image/*" class="w-full p-2 border rounded-xl outline-none text-sm">
                </div>
            `;
            break;
        case 'media':
            modalTitle.innerText = 'رفع وسائط جديدة';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">رفع ملف (اختياري)</label>
                    <input type="file" name="ImageFile" class="w-full p-2 border rounded-xl outline-none text-sm mb-4">
                </div>
                <div class="text-center font-bold text-slate-400 mb-4">- أو -</div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">رابط الملف المباشر (أو جوجل درايف)</label>
                    <input type="text" name="URL" class="w-full p-3 border rounded-xl outline-none">
                </div>
                <div class="mt-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">نوع الملف</label>
                    <select name="Type" class="w-full p-3 border rounded-xl outline-none">
                        <option>صورة</option>
                        <option>فيديو</option>
                        <option>PDF</option>
                    </select>
                </div>
            `;
            break;
        case 'users':
            modalTitle.innerText = 'إضافة مستخدم جديد';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم</label>
                    <input type="text" name="Name" required class="w-full p-3 border rounded-xl outline-none">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
                    <input type="email" name="Email" required class="w-full p-3 border rounded-xl outline-none text-left" dir="ltr">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
                    <input type="password" name="Password" required class="w-full p-3 border rounded-xl outline-none text-left" dir="ltr">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">الصلاحية</label>
                    <select name="Role" class="w-full p-3 border rounded-xl outline-none">
                        <option value="editor">محرر (نشر أخبار)</option>
                        <option value="admin">مدير (صلاحيات كاملة)</option>
                    </select>
                </div>
                <input type="hidden" name="CreatedAt" value="${new Date().toLocaleDateString('ar-EG')}">
            `;
            break;
        case 'badwords':
            modalTitle.innerText = 'إضافة كلمة محظورة جديدة';
            fieldsHtml = `
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">الكلمة</label>
                    <input type="text" name="Word" required class="w-full p-3 border rounded-xl outline-none">
                    <p class="text-xs text-red-500 mt-2">ملاحظة: سيتم حظر أي تعليق يحتوي على هذه الكلمة فوراً وتلقائياً.</p>
                </div>
            `;
            break;
    }
    
    formFields.innerHTML = fieldsHtml;
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    modalOverlay.classList.remove('flex');
    modalForm.reset();
}

modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(modalForm);
    const data = {};
    formData.forEach((value, key) => {
        if (!(value instanceof File)) {
            data[key] = value;
        }
    });
    
    // Handle File Upload if exists
    const fileInput = modalForm.querySelector('input[type="file"]');
    let hasFile = false;
    if (fileInput && fileInput.files[0]) {
        const file = fileInput.files[0];
        const base64 = await readFileAsBase64(file);
        data.FileData = base64;
        data.FileName = file.name;
        data.FileType = file.type;
        hasFile = true;
    }
    
    if (currentModalType === 'media' && !data.URL && !hasFile) {
        alert('الرجاء رفع ملف أو كتابة رابط.');
        return;
    }
    
    // Add default fields
    data.Date = new Date().toLocaleDateString('ar-EG');
    data.Status = 'نشط';
    
    const submitBtn = modalForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
    
    const actionMap = {
        'news': 'addNews',
        'projects': 'addProject',
        'initiatives': 'addInitiative',
        'media': 'addMedia',
        'users': 'addUser',
        'badwords': 'addBadWord'
    };
    
    const result = await API.post(actionMap[currentModalType], data);
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
    
    if (result.success) {
        alert('تم الحفظ بنجاح!');
        closeModal();
        if (typeof loadSectionData === 'function') loadSectionData(currentModalType);
    } else {
        alert('خطأ في الحفظ: ' + (result.error || 'فشل الاتصال بالقاعدة'));
    }
});

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Sidebar toggle (Mobile)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

function fixDriveUrl(url) {
    if (!url || url.trim() === '' || url === 'undefined') return '';
    try {
        let fileId = null;
        const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([^/?&=]+)/);
        if (lh3Match) fileId = lh3Match[1];
        if (!fileId) {
            const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
            if (driveMatch) fileId = driveMatch[1];
        }
        if (!fileId) {
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
            if (idMatch) fileId = idMatch[1];
        }
        if (!fileId) {
            const bareMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (bareMatch) fileId = bareMatch[1];
        }
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
        }
        return url;
    } catch (error) {
        return url;
    }
}

function renderInitiativesList(data) {
    const listEl = document.getElementById('initiatives-list');
    if (!listEl) return;
    
    if (!data || data.length === 0 || data.error) {
        listEl.innerHTML = `<p class="text-slate-500 italic text-center">لا توجد مبادرات حالياً.</p>`;
        return;
    }
    
    listEl.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-right">
                <thead class="bg-slate-50 text-slate-500 text-sm">
                    <tr>
                        <th class="p-4">الصورة</th>
                        <th class="p-4">اسم المبادرة</th>
                        <th class="p-4">الوصف</th>
                        <th class="p-4">تاريخ النشر</th>
                        <th class="p-4">الحالة</th>
                        <th class="p-4">الإجراءات</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${data.map((item, index) => {
                        const imgUrl = item.Images ? fixDriveUrl(item.Images) : 'https://placehold.co/100x60/e2e8f0/94a3b8?text=Layan';
                        return `
                            <tr>
                                <td class="p-4"><img src="${imgUrl}" class="w-12 h-8 object-cover rounded-lg shadow-sm"></td>
                                <td class="p-4 text-slate-700 font-bold">${item.Title || '-'}</td>
                                <td class="p-4 text-slate-600 text-sm max-w-xs truncate">${item.Description || '-'}</td>
                                <td class="p-4 text-slate-500 text-sm">${item.PublishDate || item.Date || '-'}</td>
                                <td class="p-4"><span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">${item.Status || 'نشط'}</span></td>
                                <td class="p-4">
                                    <div class="flex gap-2">
                                        <button onclick="deleteItem('Initiatives', '${item.Title}', 'Title')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف المبادرة"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderMediaList(data) {
    const listEl = document.getElementById('media-list');
    if (!listEl) return;
    
    if (!data || data.length === 0 || data.error) {
        listEl.innerHTML = `<p class="text-slate-500 italic text-center">لم يتم رفع أي وسائط بعد.</p>`;
        return;
    }
    
    listEl.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            ${data.map((item, index) => {
                let previewHtml = '';
                const fileUrl = item.URL || '';
                
                if (item.Type === 'صورة' || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || fileUrl.includes('drive.google.com') || fileUrl.includes('googleusercontent.com')) {
                    const imgUrl = fixDriveUrl(fileUrl) || fileUrl;
                    previewHtml = `<img src="${imgUrl}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-slate-100" onerror="this.src='https://placehold.co/400x300/e2e8f0/94a3b8?text=Image'">`;
                } else if (item.Type === 'فيديو' || fileUrl.match(/\.(mp4|webm|ogg)/i)) {
                    previewHtml = `
                        <div class="w-full h-40 bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-white relative">
                            <i class="fas fa-video text-3xl opacity-50"></i>
                            <span class="absolute bottom-2 right-2 text-xs bg-slate-900/80 px-2 py-0.5 rounded">فيديو</span>
                        </div>
                    `;
                } else {
                    previewHtml = `
                        <div class="w-full h-40 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-500 relative border border-slate-200">
                            <i class="far fa-file-pdf text-4xl text-red-500"></i>
                            <span class="absolute bottom-2 right-2 text-xs bg-slate-200 px-2 py-0.5 rounded">${item.Type || 'ملف'}</span>
                        </div>
                    `;
                }
                
                return `
                    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div>
                            ${previewHtml}
                            <p class="text-xs text-slate-400 mb-1">${item.UploadDate || item.Date || '-'}</p>
                            <a href="${fileUrl}" target="_blank" class="text-sm font-bold text-blue-600 hover:underline block truncate mb-3" title="${fileUrl}">
                                <i class="fas fa-external-link-alt ml-1"></i> فتح الرابط
                            </a>
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span class="text-xs text-slate-500">بواسطة: ${item.Uploader || 'المدير'}</span>
                            <button onclick="deleteItem('Media', '${item.URL}', 'URL')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="حذف"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}
