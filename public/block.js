// Sahifani himoyalash funksiyalari

// 1. Matnni belgilash va nusxalashni oldini olish
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());

// 2. O'ng tugma (kontekst menyusi) ni bloklash
document.addEventListener('contextmenu', e => {
    e.preventDefault();
    return false;
});

// 3. Klaviatura qisqartmalarini bloklash
document.addEventListener('keydown', e => {
    // Ctrl + A, Ctrl + C, Ctrl + S, Ctrl + U, Ctrl + Shift + I, F12 va boshqalar
    if (
        e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 's' || e.key === 'u' || e.key === 'A' || e.key === 'C' || e.key === 'S' || e.key === 'U') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

// 4. Copy eventlarini tozalash (qo'shimcha himoya)
document.addEventListener('copy', e => {
    e.preventDefault();
    return false;
});

document.addEventListener('cut', e => {
    e.preventDefault();
    return false;
});

// 5. Sahifani chop etishni cheklash (Ctrl+P)
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
    }
});

// Qo'shimcha: body ga user-select: none qo'shish (CSS orqali ham yaxshi)
document.body.style.userSelect = 'none';
document.body.style.webkitUserSelect = 'none';
document.body.style.mozUserSelect = 'none';
document.body.style.msUserSelect = 'none';
