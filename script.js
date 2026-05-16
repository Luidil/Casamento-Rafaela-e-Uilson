/**
 * Wedding Website - JavaScript
 * Funcionalidades: RSVP Form, Upload de Fotos, Navegação
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa todas as funcionalidades
    initCountdown();
    initCarousel();
    initNavigation();
    initRSVPForm();
    initPhotoUpload();
    initPhotoShareQr();
    initScrollEffects();
});

const appState = {
    uploadedFiles: [],
    carouselIndex: 0,
    carouselImages: []
};

/**
 * Contagem Regressiva para o Casamento
 */
function initCountdown() {
    const weddingDate = new Date('2026-09-01T00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = weddingDate - now;
        
        if (distance < 0) {
            // O casamento já aconteceu
            document.getElementById('days').textContent = '0';
            document.getElementById('hours').textContent = '0';
            document.getElementById('minutes').textContent = '0';
            document.getElementById('seconds').textContent = '0';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }
    
    // Atualiza a contagem regressiva imediatamente
    updateCountdown();
    
    // Atualiza a cada segundo
    setInterval(updateCountdown, 1000);
}

/**
 * Carrossel de Fotos na Hero Section
 */
function initCarousel() {
    const carouselContainer = document.querySelector('.carousel-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselDots = document.getElementById('carouselDots');
    
    if (!carouselContainer) return;
    
    // Carrega imagens da pasta 'fotos'
    loadCarouselImages();
    
    function loadCarouselImages() {
        // Carrega imagens da pasta 'Fotos'
        const imageFiles = [
            '/Fotos/1.png',
            '/Fotos/2.png',
            '/Fotos/3.png',
            '/Fotos/5.jpg',
            '/Fotos/6.jpg',
            '/Fotos/7.jpg',
            '/Fotos/8.jpg',
            '/Fotos/9.png',
            '/Fotos/10.png',
            '/Fotos/11.png',
            '/Fotos/14.jpg',
            '/Fotos/15.jpg',
            '/Fotos/16.jpg',
            '/Fotos/17.jpg',
            '/Fotos/18.jpg',
            '/Fotos/19.jpg',
            '/Fotos/20.jpg',
            '/Fotos/21.jpg',
            '/Fotos/22.jpg',
            '/Fotos/23.jpg'
        ];
        
        appState.carouselImages = imageFiles;
        renderCarousel();
    }
    
    function renderCarousel() {
        carouselContainer.innerHTML = '';
        carouselDots.innerHTML = '';
        
        appState.carouselImages.forEach((image, index) => {
            // Cria slide
            const slide = document.createElement('div');
            slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
            slide.innerHTML = `<img src="${image}" alt="Foto ${index + 1}" class="carousel-image" onerror="this.src='/Fotos/1.png'">`;
            carouselContainer.appendChild(slide);
            
            // Cria dot
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => showSlide(index));
            carouselDots.appendChild(dot);
        });
    }
    
    function showSlide(index) {
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.carousel-dot');
        
        if (index >= slides.length) {
            appState.carouselIndex = 0;
        } else if (index < 0) {
            appState.carouselIndex = slides.length - 1;
        } else {
            appState.carouselIndex = index;
        }
        
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[appState.carouselIndex].classList.add('active');
        dots[appState.carouselIndex].classList.add('active');
    }
    
    function nextSlide() {
        showSlide(appState.carouselIndex + 1);
    }
    
    function prevSlide() {
        showSlide(appState.carouselIndex - 1);
    }
    
    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    
    // Auto-play do carrossel a cada 5 segundos
    setInterval(nextSlide, 5000);
}

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
        
        // Se houver foto, envia primeiro
        let fotoUrl = '';
        if (appState.uploadedFiles.length > 0) {
            fotoUrl = appState.uploadedFiles[0].url;
        }
        
        const data = {
            nome: formData.get('nome'),
            email: formData.get('email'),
            presenca: formData.get('presenca'),
            mensagem: formData.get('mensagem'),
            fotoUrl: fotoUrl
        };
        
        console.log('Dados coletados:', data);
        
        // Validação básica
        if (!data.nome || !data.presenca) {
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
 * Envia os dados para a API
 */
async function simulateRSVPSubmit(data) {
    const response = await fetch('https://casamento-rafaela-e-uilson.vercel.app/api/confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.message);
    }
    
    return result;
}

function initPhotoShareQr() {
    const canvas = document.getElementById('qrCodeCanvas');
    
    if (!canvas) return;

    const shareUrl = new URL(window.location.href);
    shareUrl.hash = 'fotos';

    const shareTarget = `${shareUrl.pathname}${shareUrl.search}${shareUrl.hash}`;
    
    // Usar API de QR Code confiável
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareTarget)}&color=8B5E4A&bgcolor=FAF7F2`;
    
    const img = document.createElement('img');
    img.src = qrApiUrl;
    img.style.maxWidth = '250px';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.alt = 'QR Code';
    
    canvas.parentNode.replaceChild(img, canvas);
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
        
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'video/mp4', 'video/webm', 'video/quicktime'];
        
        Array.from(files).forEach(file => {
            if (validTypes.includes(file.type) || file.type.startsWith('image/') || file.type.startsWith('video/')) {
                uploadFile(file);
            } else {
                showAlert(`Arquivo "${file.name}" não é suportado. Use imagens ou vídeos.`, 'error');
            }
        });
    }
    
    async function uploadFile(file) {
        // Mostra progresso
        uploadProgress.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = `Enviando ${file.name}...`;
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('https://casamento-rafaela-e-uilson.vercel.app/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Adiciona arquivo à lista com URL do servidor
                const fileId = Date.now();
                
                appState.uploadedFiles.push({
                    id: fileId,
                    name: file.name,
                    url: result.url,
                    type: file.type.startsWith('image') ? 'image' : 'video'
                });
                
                renderFiles();
                saveFilesToStorage();
                
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    showAlert(`${file.name} enviado com sucesso!`, 'success');
                }, 500);
            } else {
                throw new Error(result.message || 'Erro ao enviar');
            }
        } catch (error) {
            uploadProgress.style.display = 'none';
            showAlert(`Erro ao enviar ${file.name}: ${error.message}`, 'error');
            console.error('Upload error:', error);
        }
    }
    
    function renderFiles() {
        filesGrid.innerHTML = '';
        
        appState.uploadedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.id = file.id;
            
            if (file.type === 'image') {
                fileItem.innerHTML = `
                    <img src="${file.url}" alt="${file.name}" loading="lazy" class="file-item-media">
                    <button class="remove-btn" onclick="removeFile(${file.id})">×</button>
                `;
                fileItem.querySelector('.file-item-media').addEventListener('click', () => {
                    openViewModal(file.url, 'image');
                });
            } else {
                fileItem.innerHTML = `
                    <video src="${file.url}" muted class="file-item-media"></video>
                    <button class="remove-btn" onclick="removeFile(${file.id})">×</button>
                `;
                fileItem.querySelector('.file-item-media').addEventListener('click', () => {
                    openViewModal(file.url, 'video');
                });
            }
            
            filesGrid.appendChild(fileItem);
        });
        
        // Mostra/esconde botão de download
        const downloadBtn = document.getElementById('downloadAllPhotosBtn');
        if (downloadBtn) {
            downloadBtn.style.display = appState.uploadedFiles.length > 0 ? 'block' : 'none';
        }
    }
    
    function saveFilesToStorage() {
        // Salva apenas metadados (não objetos blob grandes)
        const fileMeta = appState.uploadedFiles.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type
        }));
        localStorage.setItem('weddingFiles', JSON.stringify(fileMeta));
    }
    
    // Função global para remover arquivo
    window.removeFile = function(fileId) {
        const modal = document.getElementById('confirmModal');
        const overlay = document.getElementById('modalOverlay');
        const modalConfirm = document.getElementById('modalConfirm');
        const modalCancel = document.getElementById('modalCancel');
        const modalClose = document.getElementById('modalClose');
        
        // Mostra o modal
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // Função para fechar o modal
        const closeModal = () => {
            modal.style.display = 'none';
            overlay.style.display = 'none';
        };
        
        // Confirmar remoção
        modalConfirm.onclick = () => {
            appState.uploadedFiles = appState.uploadedFiles.filter(f => f.id !== fileId);
            renderFiles();
            saveFilesToStorage();
            showAlert('Foto removida com sucesso.', 'success');
            closeModal();
        };
        
        // Cancelar
        modalCancel.onclick = closeModal;
        modalClose.onclick = closeModal;
        
        // Fechar ao clicar no overlay
        overlay.onclick = closeModal;
    };
    
    // Função para abrir modal de visualização
    window.openViewModal = function(src, type) {
        const viewModal = document.getElementById('viewModal');
        const viewOverlay = document.getElementById('viewModalOverlay');
        const viewImage = document.getElementById('viewModalImage');
        const viewVideo = document.getElementById('viewModalVideo');
        const viewClose = document.getElementById('viewModalClose');
        const viewDownload = document.getElementById('viewModalDownload');
        
        // Limpa os elementos
        viewImage.style.display = 'none';
        viewVideo.style.display = 'none';
        
        // Mostra o tipo correto
        if (type === 'image') {
            viewImage.src = src;
            viewImage.style.display = 'block';
        } else {
            viewVideo.src = src;
            viewVideo.style.display = 'block';
        }
        
        // Mostra o modal
        viewModal.style.display = 'block';
        viewOverlay.style.display = 'block';
        
        // Função para fechar
        const closeViewModal = () => {
            viewModal.style.display = 'none';
            viewOverlay.style.display = 'none';
        };
        
        // Função para baixar
        viewDownload.onclick = () => {
            const link = document.createElement('a');
            link.href = src;
            link.download = src.split('/').pop() || `download.${type === 'image' ? 'jpg' : 'mp4'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        viewClose.onclick = closeViewModal;
        viewOverlay.onclick = closeViewModal;
        
        // Fechar com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeViewModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    };
    
    // Carrega arquivos do localStorage
    loadFilesFromStorage();
    
    function loadFilesFromStorage() {
        try {
            // Carrega as fotos do servidor via API
            fetch('https://casamento-rafaela-e-uilson.vercel.app/api/uploaded-files')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.files) {
                        appState.uploadedFiles = data.files;
                        renderFiles();
                    }
                })
                .catch(err => console.log('Fotos locais não disponíveis'));
        } catch (e) {
            console.error('Erro ao carregar arquivos:', e);
        }
    }
    
    // Função para baixar todas as fotos
    window.downloadAllPhotos = async function() {
        const filesToDownload = appState.uploadedFiles;
        
        if (filesToDownload.length === 0) {
            showAlert('Nenhuma foto para baixar!', 'error');
            return;
        }
        
        const btn = document.getElementById('downloadAllPhotosBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        
        let downloaded = 0;
        
        for (const file of filesToDownload) {
            try {
                const response = await fetch(file.url);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                
                // Extrai extensão da URL
                const urlParts = file.url.split('.');
                const ext = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
                
                link.download = `foto-${new Date().getTime()}-${downloaded + 1}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                
                downloaded++;
                btn.textContent = `📸 Baixando ${downloaded}/${filesToDownload.length}...`;
                
                // Pequeno delay entre downloads
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Erro ao baixar foto:`, error);
            }
        }
        
        btn.textContent = originalText;
        btn.disabled = false;
        showAlert(`✅ ${downloaded} fotos baixadas com sucesso!`, 'success');
    };
    
    // Adiciona listener ao botão
    const downloadAllBtn = document.getElementById('downloadAllPhotosBtn');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllPhotos);
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
