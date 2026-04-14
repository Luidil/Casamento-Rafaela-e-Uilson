/**
 * Wedding Website - JavaScript
 * Funcionalidades: RSVP Form, Upload de Fotos, Navegação
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa todas as funcionalidades
    initNavigation();
    initRSVPForm();
    initPhotoUpload();
    initScrollEffects();
});

/**
 * Navegação suave e navbar fixo
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const navbar = document.querySelector('.navbar');
    
    // Smooth scroll para links internos
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Atualiza link ativo no scroll
    window.addEventListener('scroll', () => {
        updateActiveNavLink();
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    const navHeight = document.querySelector('.navbar').offsetHeight;
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - navHeight - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Formulário de Confirmação de Presença (RSVP)
 */
function initRSVPForm() {
    const form = document.getElementById('rsvpForm');
    const statusDiv = document.getElementById('rsvpStatus');
    
    if (!form) return;
    
    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = `(${value}`;
                } else if (value.length <= 6) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                } else if (value.length <= 10) {
                    value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
                } else {
                    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
                }
            }
            e.target.value = value;
        });
    }
    
    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Coleta os dados do formulário
        const formData = new FormData(form);
        const data = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            acompanhantes: formData.get('acompanhantes'),
            presenca: formData.get('presenca'),
            mensagem: formData.get('mensagem')
        };
        
        // Validação básica
        if (!data.nome || !data.email || !data.telefone || !data.presenca) {
            showAlert('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Simula o envio (aqui você pode conectar com um backend real)
        try {
            await simulateRSVPSubmit(data);
            
            // Oculta o formulário e mostra mensagem de sucesso
            form.style.display = 'none';
            statusDiv.style.display = 'block';
            
            // Feedback visual de sucesso
            showAlert('Confirmação enviada com sucesso!', 'success');
            
        } catch (error) {
            showAlert('Erro ao enviar confirmação. Tente novamente.', 'error');
            console.error('RSVP Error:', error);
        }
    });
}

/**
 * Simula o envio dos dados (substitua por chamada real à API)
 */
function simulateRSVPSubmit(data) {
    return new Promise((resolve) => {
        // Simula delay de rede
        setTimeout(() => {
            console.log('RSVP Data:', data);
            
            // Salva no localStorage para demonstração
            const rsvps = JSON.parse(localStorage.getItem('rsvps') || '[]');
            rsvps.push({
                ...data,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('rsvps', JSON.stringify(rsvps));
            
            resolve({ success: true });
        }, 1500);
    });
}

/**
 * Upload de Fotos
 */
function initPhotoUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const filesGrid = document.getElementById('filesGrid');
    
    if (!uploadArea || !fileInput) return;
    
    let uploadedFiles = [];
    
    // Clique na área de upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Clique no botão selecionar
    if (selectFilesBtn) {
        selectFilesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    
    // Seleção de arquivos
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });
    
    function handleFiles(files) {
        if (!files || files.length === 0) return;
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
        
        Array.from(files).forEach(file => {
            if (validTypes.includes(file.type)) {
                uploadFile(file);
            } else {
                showAlert(`Arquivo "${file.name}" não é suportado. Use imagens ou vídeos.`, 'error');
            }
        });
    }
    
    function uploadFile(file) {
        // Mostra progresso
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = `Enviando ${file.name}...`;
        
        // Simula upload (aqui você pode conectar com um backend real)
        const formData = new FormData();
        formData.append('file', file);
        
        // Simula progresso
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Enviando ${file.name}... ${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Adiciona arquivo à lista
                const fileId = Date.now() + Math.random();
                const fileUrl = URL.createObjectURL(file);
                
                uploadedFiles.push({
                    id: fileId,
                    name: file.name,
                    url: fileUrl,
                    type: file.type.startsWith('image') ? 'image' : 'video'
                });
                
                renderFiles();
                
                // Salva no localStorage para demonstração
                saveFilesToStorage();
                
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    showAlert(`${file.name} enviado com sucesso!`, 'success');
                }, 500);
            }
        }, 200);
    }
    
    function renderFiles() {
        filesGrid.innerHTML = '';
        
        uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.id = file.id;
            
            if (file.type === 'image') {
                fileItem.innerHTML = `
                    <img src="${file.url}" alt="${file.name}" loading="lazy">
                    <button class="remove-btn" onclick="removeFile(${file.id})">×</button>
                `;
            } else {
                fileItem.innerHTML = `
                    <video src="${file.url}" muted></video>
                    <button class="remove-btn" onclick="removeFile(${file.id})">×</button>
                `;
            }
            
            filesGrid.appendChild(file-item);
        });
    }
    
    function saveFilesToStorage() {
        // Salva apenas metadados (não objetos blob grandes)
        const fileMeta = uploadedFiles.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type
        }));
        localStorage.setItem('weddingFiles', JSON.stringify(fileMeta));
    }
    
    // Função global para remover arquivo
    window.removeFile = function(fileId) {
        uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
        renderFiles();
        saveFilesToStorage();
        showAlert('Arquivo removido.', 'success');
    };
    
    // Carrega arquivos do localStorage
    loadFilesFromStorage();
    
    function loadFilesFromStorage() {
        try {
            const saved = localStorage.getItem('weddingFiles');
            if (saved) {
                // Nota: URLs de blob não persistem após refresh
                // Esta é uma implementação básica para demonstração
                console.log('Carregando arquivos do storage:', JSON.parse(saved));
            }
        } catch (e) {
            console.error('Erro ao carregar arquivos:', e);
        }
    }
}

/**
 * Efeitos de Scroll
 */
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
    });
    
    // Reveal animation para seções
    const sections = document.querySelectorAll('.section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
}

/**
 * Utilitários
 */
function showAlert(message, type = 'info') {
    // Remove alertas existentes
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.textContent = message;
    
    // Estilos do alerta
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        alert.style.background = '#4A7C59';
        alert.style.color = '#fff';
    } else if (type === 'error') {
        alert.style.background = '#A65D57';
        alert.style.color = '#fff';
    } else {
        alert.style.background = '#3E5C58';
        alert.style.color = '#fff';
    }
    
    document.body.appendChild(alert);
    
    // Remove após 3 segundos
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Adiciona estilos de animação dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .custom-alert {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(style);

/**
 * Configurações do Google Maps (substitua com sua localização real)
 */
function initMap() {
    // Exemplo de configuração de mapa
    // Você pode substituir o iframe no HTML com suas coordenadas
    
    const mapLocations = {
        church: {
            lat: -23.55051998500243,
            lng: -46.65390188554444,
            title: 'Igreja Nossa Senhora das Graças'
        },
        reception: {
            lat: -23.56051998500243,
            lng: -46.66390188554444,
            title: 'Salão de Eventos Villaggio'
        }
    };
    
    return mapLocations;
}
