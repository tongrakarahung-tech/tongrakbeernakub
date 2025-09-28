// ====================================
// 0. ข้อมูลรูปภาพสำหรับหน้า Login, Jigsaw และ Valentine
// ====================================
const LOGIN_IMAGES = [
    "p1.jpg", "p2.jpg", "p3.jpg", "p4.jpg", "p5.jpg",
    "p6.jpg", "p7.jpg", "p8.jpg", "p9.jpg", "p10.jpg",
    "p15.jpg", "p16.jpg", "p17.jpg", "p18.jpg"
];

const VALENTINE_IMAGES = [
    "p5.jpg", 
    "p6.jpg",
    "p8.jpg",
    "p9.jpg",
    "p10.jpg",
    "p1.jpg", 
    "p2.jpg",
    "p3.jpg",
    "p4.jpg",
    "p7.jpg"
];

// ใช้สำหรับเกมจับคู่รูปภาพ (สมมติว่าเป็นรูปสกรูที่บี๋ชอบ)
const MATCHING_ICONS = [
    'image_b86497.png', 'image_b95539.png', 'image_b9b650.png', 
    'image_b9bd7b.png', 'image_b9c996.png', 'image_ad7050.jpg'
];


let currentImageIndex = 0;
let currentValentineImageIndex = 0; 
let yesButtonScale = 1; 
let valentineImageInterval; 

// Matching Game Variables
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let matchesFound = 0;

function cycleLoginImage() {
    const imageElement = document.getElementById('loginImage');
    if (imageElement) {
        currentImageIndex = (currentImageIndex + 1) % LOGIN_IMAGES.length;
        const nextImageURL = LOGIN_IMAGES[currentImageIndex];
        
        imageElement.style.backgroundImage = `url('${nextImageURL}')`;
        imageElement.classList.remove('image-fade');
        void imageElement.offsetWidth;
        imageElement.classList.add('image-fade');
    }
}

// ====================================
// 1. DOM Content Loaded: จัดการ Event Listener
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    const monthlyMessageElement = document.getElementById('monthlyMessage');
    if (monthlyMessageElement) {
        displayMonthlyMessage(); 
    }
    
    const loginContainer = document.querySelector('.container');
    if (loginContainer && loginContainer.querySelector('.numpad-grid')) {
        setupNumpad();
        const loginImageElement = document.getElementById('loginImage');
        if(loginImageElement) {
            loginImageElement.style.backgroundImage = `url('${LOGIN_IMAGES[currentImageIndex]}')`;
        }
    }
    
    // Jigsaw Game
    const jigsawArea = document.getElementById('jigsawContainer');
    if (jigsawArea) {
        setupJigsaw(); 
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        if (prevBtn) prevBtn.addEventListener('click', () => changeJigsawImage(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => changeJigsawImage(1));
    }
    
    // Valentine Page
    const valentineContainer = document.querySelector('.valentine-container');
    if (valentineContainer) {
        startValentineImageCycle();
    }
    
    // Matching Game
    const matchGame = document.getElementById('matchGame');
    if (matchGame) {
        setupMatchingGame(); 
    }
});


// ====================================
// 1.5 Logic สำหรับ Main Menu (ข้อความตามเดือน)
// ====================================

const monthlyMessages = {
    // 0=ม.ค. ถึง 11=ธ.ค.
    8: "บี๋ลองเล่นดูนะเค้าตั้งใจทำให้ ❤️", 
    9: "บี๋ลองเล่นดูนะเค้าตั้งใจทำให้💖", 
    10: "บี๋ลองเล่นดูนะเค้าตั้งใจทำให้ 🍂", 
    11: "บี๋ลองเล่นดูนะเค้าตั้งใจทำให้ 🎉" 
};

function displayMonthlyMessage() {
    const messageElement = document.getElementById('monthlyMessage');
    if (messageElement) {
        const date = new Date();
        const currentMonth = date.getMonth(); 

        if (monthlyMessages[currentMonth]) {
            messageElement.textContent = monthlyMessages[currentMonth];
        } else {
            messageElement.textContent = "วันนี้อยากทำอะไรดีน้า? เลือกเลย!";
        }
    }
}


// ====================================
// 2. Logic สำหรับหน้า Login (Numpad) 
// ====================================

let currentPassword = "";
const MAX_PASSWORD_LENGTH = 8; 

function updateDisplay() {
    const hiddenPassword = '•'.repeat(currentPassword.length);
    document.getElementById('passwordDisplay').textContent = hiddenPassword;
}

function setupNumpad() {
    const keys = document.querySelectorAll('.numpad-key');
    keys.forEach(key => {
        key.addEventListener('click', handleNumpadKey);
    });
}

function handleNumpadKey(event) {
    const key = event.currentTarget.dataset.key;
    const message = document.getElementById('message');
    if(message) message.classList.add('hidden');

    if (key >= '0' && key <= '9') {
        if (currentPassword.length < MAX_PASSWORD_LENGTH) {
            currentPassword += key;
            cycleLoginImage();
        }
    } else if (key === 'C') {
        currentPassword = currentPassword.slice(0, -1);
        cycleLoginImage();
    } else if (key === 'L') {
        checkPassword(currentPassword);
        return;
    }
    updateDisplay();
}

function checkPassword(password) {
    const correctPassword = "29042025"; 
    const message = document.getElementById('message');

    if (password === correctPassword) {
        window.location.href = "main_menu.html"; 
    } else {
        if (message) {
            message.classList.remove('hidden');
            message.classList.add('error');
            currentPassword = "";
            updateDisplay();
        }
    }
}


// ====================================
// 3. Logic สำหรับหน้าเกมต่อจิ๊กซอว์ (แก้ไขการคำนวณด้วย Pixel)
// ====================================

const JIGSAW_OPTIONS = [
    { id: 'p15', fileName: "p15.jpg", label: 'รูปคู่ 15' },
    { id: 'p16', fileName: "p16.jpg", label: 'รูปคู่ 16' }, 
    { id: 'p17', fileName: "p17.jpg", label: 'รูปคู่ 17' },
    { id: 'p18', fileName: "p18.jpg", label: 'รูปคู่ 18' }
];

const ROWS = 3;
const COLS = 3;
const TOTAL_PIECES = ROWS * COLS;
// **ค่าที่สำคัญ:** ขนาดคอนเทนเนอร์ Jigsaw ที่กำหนดไว้ใน style.css คือ 450px
const JIGSAW_CONTAINER_SIZE = 450; 
// **ขนาดชิ้นส่วน:** 450px / 3 = 150px
const PIECE_SIZE = JIGSAW_CONTAINER_SIZE / COLS;

let pieces = [];
let selectedPieces = [];
let currentJigsawIndex = 0;
let currentImageUrl = ''; 

function setupJigsaw() {
    const container = document.getElementById('jigsawContainer');
    if (!container) return;

    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    loadJigsawImage(currentJigsawIndex);
}

function loadJigsawImage(index) {
    if (index < 0 || index >= JIGSAW_OPTIONS.length) return;

    const selector = document.getElementById('imageSelector');
    selector.innerHTML = ''; 
    
    const option = JIGSAW_OPTIONS[index];
    const img = document.createElement('img');
    img.src = option.fileName;
    img.alt = option.label;
    img.classList.add('image-choice'); 
    img.dataset.filename = option.fileName;
    img.title = option.label;
    
    selector.appendChild(img);

    currentJigsawIndex = index;
    currentImageUrl = option.fileName;
    resetJigsawGame(currentImageUrl); 
    
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    if (prevBtn) prevBtn.disabled = (currentJigsawIndex === 0);
    if (nextBtn) nextBtn.disabled = (currentJigsawIndex === JIGSAW_OPTIONS.length - 1);
}

function changeJigsawImage(direction) {
    let newIndex = currentJigsawIndex + direction;

    if (newIndex >= 0 && newIndex < JIGSAW_OPTIONS.length) {
        loadJigsawImage(newIndex);
    }
}

function resetJigsawGame(imageUrl) {
    const container = document.getElementById('jigsawContainer');
    const message = document.getElementById('jigsawMessage');
    
    container.innerHTML = '';
    pieces = [];
    selectedPieces = [];
    
    createAndShufflePieces(imageUrl, container);

    const currentPieces = Array.from(container.children);
    currentPieces.forEach(piece => {
        piece.addEventListener('click', handleJigsawClick);
    });
    
    message.textContent = "คลิกที่ชิ้นส่วนที่ต้องการสลับ!";
}

function createAndShufflePieces(imageUrl, container) {
    // ขนาดภาพพื้นหลังทั้งหมด: 450px
    const backgroundSize = JIGSAW_CONTAINER_SIZE; 
    
    // ขนาดชิ้นส่วน (Piece Size) คือ 150px
    const pieceSize = PIECE_SIZE; 

    for (let i = 0; i < TOTAL_PIECES; i++) {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.dataset.correctIndex = i; 
        
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        
        // **การคำนวณตำแหน่งภาพที่แก้ไข: ใช้ Pixel (px)**
        // ตำแหน่ง X: 0, -150px, -300px
        const xPos = -col * pieceSize; 
        // ตำแหน่ง Y: 0, -150px, -300px
        const yPos = -row * pieceSize;
        
        piece.style.backgroundImage = `url('${imageUrl}')`; 
        
        // Background Size ถูกกำหนดให้เป็นขนาดของคอนเทนเนอร์ Jigsaw เลย (450px)
        piece.style.backgroundSize = `${JIGSAW_CONTAINER_SIZE}px ${JIGSAW_CONTAINER_SIZE}px`; 
        
        // กำหนดตำแหน่งด้วย Pixel
        piece.style.backgroundPosition = `${xPos}px ${yPos}px`; 
        
        pieces.push(piece);
    }

    shuffleAndDrawPieces(container);
}

function shuffleAndDrawPieces(container) {
    let shuffledIndices = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    
    let isShuffled = false;
    // ตรวจสอบให้แน่ใจว่ามีการสลับ ไม่ใช่ภาพที่ถูกต้องอยู่แล้ว
    while (!isShuffled) {
        shuffledIndices.sort(() => Math.random() - 0.5);
        // ตรวจสอบว่ามีชิ้นส่วนอย่างน้อยหนึ่งชิ้นที่ไม่อยู่ในตำแหน่งที่ถูกต้อง
        isShuffled = shuffledIndices.some((val, idx) => val !== idx);
    }

    const shuffledPieces = shuffledIndices.map(index => pieces[index]);

    container.innerHTML = '';
    
    shuffledPieces.forEach((piece, currentDisplayIndex) => {
        piece.dataset.currentDisplayIndex = currentDisplayIndex; 
        container.appendChild(piece);
    });
}


function handleJigsawClick(event) {
    const piece = event.currentTarget;
    const message = document.getElementById('jigsawMessage');

    if (message.textContent.includes('สำเร็จ!')) return;

    if (piece.classList.contains('selected')) {
        piece.classList.remove('selected');
        selectedPieces = selectedPieces.filter(p => p !== piece);
        message.textContent = "ยกเลิกการเลือก";
    } else {
        if (selectedPieces.length < 2) {
            piece.classList.add('selected');
            selectedPieces.push(piece);
            
            if (selectedPieces.length === 2) {
                message.textContent = "กำลังสลับชิ้นส่วน...";
                
                swapPiecesInDOM(selectedPieces[0], selectedPieces[1]);
                
                selectedPieces = [];
                
                checkWin();
                
            } else {
                message.textContent = "เลือกชิ้นส่วนที่สอง...";
            }
        }
    }
}

function swapPiecesInDOM(p1, p2) {
    const container = document.getElementById('jigsawContainer');
    
    // ใช้วิธีเปลี่ยนตำแหน่งใน DOM โดยใช้ replaceChild
    const p1Placeholder = document.createElement('div');
    const p2Placeholder = document.createElement('div');

    container.replaceChild(p1Placeholder, p1);
    container.replaceChild(p2Placeholder, p2);

    container.replaceChild(p2, p1Placeholder);
    container.replaceChild(p1, p2Placeholder);
    
    // นำ class selected ออก
    p1.classList.remove('selected');
    p2.classList.remove('selected');
    
    // ลบ placeholder ที่ไม่จำเป็น
    p1Placeholder.remove();
    p2Placeholder.remove();
}


function checkWin() {
    const container = document.getElementById('jigsawContainer');
    const currentPieces = Array.from(container.children);
    let isCorrect = true;

    currentPieces.forEach((piece, index) => {
        if (parseInt(piece.dataset.correctIndex) !== index) {
            isCorrect = false;
        }
    });

    const message = document.getElementById('jigsawMessage');
    if (isCorrect) {
        message.textContent = "🎉 ยอดเยี่ยมมาก! ต่อจิ๊กซอว์สำเร็จแล้ว! ❤️";
        currentPieces.forEach(p => p.style.border = 'none');
    } else {
        setTimeout(() => {
             if (!message.textContent.includes('สำเร็จ!')) {
                 message.textContent = "เกือบแล้ว! ลองสลับชิ้นส่วนอื่นต่อสิ 🧐";
             }
        }, 300);
    }
}


// ====================================
// 4. Logic สำหรับ Gallery Lightbox และ Logout
// ====================================

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('myLightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    lightbox.style.display = "flex"; 
    lightboxImage.src = imageSrc;
    document.body.style.overflow = 'hidden'; 
}

function closeLightbox(event) {
    const lightbox = document.getElementById('myLightbox');
    if (event.target === lightbox || event.target.classList.contains('close-button')) {
        lightbox.style.display = "none";
        document.body.style.overflow = 'auto'; 
    }
}

window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

// (ไม่จำเป็นต้องมีฟังก์ชัน logout เพราะใช้ window.location ใน HTML แล้ว)


// ====================================
// 5. Logic สำหรับหน้า Valentine 
// ====================================

function startValentineImageCycle() {
    const catImage = document.querySelector('.cat-image');
    if (!catImage) return; 

    catImage.src = VALENTINE_IMAGES[currentValentineImageIndex];

    if (valentineImageInterval) {
        clearInterval(valentineImageInterval);
    }

    valentineImageInterval = setInterval(() => {
        currentValentineImageIndex = (currentValentineImageIndex + 1) % VALENTINE_IMAGES.length;
        catImage.classList.add('image-fade-out'); 

        setTimeout(() => {
            catImage.src = VALENTINE_IMAGES[currentValentineImageIndex];
            catImage.classList.remove('image-fade-out'); 
        }, 500); 
        
    }, 4000); 
}


function moveButton() {
    const noBtn = document.getElementById('noBtn');
    
    // ทำให้ปุ่ม No ขยับไปในกรอบ 250px จากจุดศูนย์กลาง
    const maxMoveX = 250; 
    const maxMoveY = 150; 
    const newX = Math.random() * (maxMoveX * 2) - maxMoveX;
    const newY = Math.random() * (maxMoveY * 2) - maxMoveY;
    
    noBtn.style.transform = `translate(${newX}px, ${newY}px) scale(0.8)`;
    
    const messages = ['ไม่เอาหรอ? 🤔', 'แน่ใจนะ 🥺', 'ลองคิดดูใหม่สิ!', 'กดไม่ได้หรอก 😝'];
    noBtn.textContent = messages[Math.floor(Math.random() * messages.length)];

    const yesBtn = document.getElementById('yesBtn');
    if (yesBtn) {
        yesButtonScale += 0.05; 
        yesBtn.style.transform = `scale(${yesButtonScale})`;
        // ข้อความจะเปลี่ยนเป็น Yes (5%), Yes (10%), ...
        yesBtn.textContent = `Yes (${Math.round((yesButtonScale - 1) * 100)}%)`; 
    }
}

function handleYes() {
    const container = document.querySelector('.valentine-container');
    
    if (valentineImageInterval) {
        clearInterval(valentineImageInterval);
    }

    // หยุด Animation หัวใจที่อาจจะเล่นอยู่ (ถ้าใส่ใน CSS)
    container.style.animation = 'none'; 
    
    const randomIndex = Math.floor(Math.random() * VALENTINE_IMAGES.length);
    const randomImageSrc = VALENTINE_IMAGES[randomIndex];

    container.innerHTML = `
        <h1 style="font-size: 3em;">YES! I love you too! 🥰</h1>
        <img src="${randomImageSrc}" alt="Happy Couple Image" class="cat-image" style="width: 200px; height: 200px;">
        <p style="color: #ff69b4; font-size: 24px; font-weight: bold;">เค้าก็รักบี๋เหมือนกันเด้อออออ ❤️</p>
        <button onclick="window.location.href='main_menu.html'" style="background-color: #ff69b4; color: white; margin-top: 20px; padding: 12px 25px; border-radius: 10px; border: none; cursor: pointer; font-weight: bold;">
            กลับเมนูหลัก 🏡
        </button>
    `;
    
    document.body.style.backgroundColor = '#ffd8e1';
}

window.moveButton = moveButton;
window.handleYes = handleYes;


// ====================================
// 6. Logic สำหรับหน้าเกมจับคู่รูปภาพ
// ====================================

function setupMatchingGame() {
    const gameContainer = document.getElementById('matchGame');
    if (!gameContainer) return;

    // สร้างคู่ไอคอน (6 ไอคอน x 2)
    let cards = [...MATCHING_ICONS, ...MATCHING_ICONS];
    shuffle(cards);
    matchesFound = 0; 
    
    // กำหนด grid template 4x3 (12 ช่อง)
    gameContainer.style.gridTemplateColumns = 'repeat(4, 1fr)'; 

    cards.forEach((icon, index) => {
        const card = document.createElement('div');
        card.classList.add('match-card');
        card.dataset.icon = icon;
        card.dataset.index = index;
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back" style="background-image: url('${icon}');"></div>
            </div>
        `;
        card.addEventListener('click', flipCard);
        gameContainer.appendChild(card);
    });
    
    document.getElementById('gameMessage').textContent = 'พลิกการ์ดสองใบเพื่อหาคู่!';
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
        // การ์ดแรก
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // การ์ดที่สอง
    secondCard = this;
    
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.icon === secondCard.dataset.icon;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    matchesFound++;
    document.getElementById('gameMessage').textContent = `จับคู่ได้ ${matchesFound} คู่แล้ว!`;
    
    if (matchesFound === MATCHING_ICONS.length) {
        document.getElementById('gameMessage').textContent = '🎉 ยอดเยี่ยม! จับคู่ครบทุกคู่แล้ว!';
    }

    resetBoard();
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');

        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}