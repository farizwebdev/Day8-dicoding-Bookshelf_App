// INISIALISASI VARIABEL & KONSTANTA
const books = [];
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'saved-book';
const STORAGE_KEY = 'BOOKSHELF_APPS';

// Variabel untuk menyimpan status mode Edit
let isEditing = false;
let editedBookId = null;

// --- FUNGSI UTILITAS (HELPER) ---

// Menghasilkan ID unik berdasarkan timestamp
function generateId() {
  return +new Date();
}

// Membuat object buku baru
function generateBookObject(id, title, author, year, isComplete) {
  return {
    id,
    title,
    author,
    year: parseInt(year), // Pastikan tahun menjadi tipe Number
    isComplete
  };
}

// Mencari object buku berdasarkan ID
function findBook(bookId) {
  for (const bookItem of books) {
    if (bookItem.id === bookId) {
      return bookItem;
    }
  }
  return null;
}

// Mencari index buku di array berdasarkan ID
function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id === bookId) {
      return index;
    }
  }
  return -1;
}

// --- FUNGSI LOCAL STORAGE ---

// Cek apakah browser mendukung LocalStorage
function isStorageExist() {
  if (typeof (Storage) === undefined) {
    alert('Browser kamu tidak mendukung local storage');
    return false;
  }
  return true;
}

// Simpan data array 'books' ke LocalStorage
function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
    document.dispatchEvent(new Event(SAVED_EVENT));
  }
}

// Muat data dari LocalStorage ke array 'books' saat aplikasi dimulai
function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const book of data) {
      books.push(book);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

// --- FUNGSI MANIPULASI DOM (TAMPILAN) ---

// Membuat elemen HTML untuk satu buku
function makeBookElement(bookObject) {
  // a. Elemen Judul
  const textTitle = document.createElement('h3');
  textTitle.innerText = bookObject.title;
  textTitle.setAttribute('data-testid', 'bookItemTitle');

  // b. Elemen Penulis
  const textAuthor = document.createElement('p');
  textAuthor.innerText = `Penulis: ${bookObject.author}`;
  textAuthor.setAttribute('data-testid', 'bookItemAuthor');

  // c. Elemen Tahun
  const textYear = document.createElement('p');
  textYear.innerText = `Tahun: ${bookObject.year}`;
  textYear.setAttribute('data-testid', 'bookItemYear');

  // d. Container untuk Tombol Aksi
  const actionContainer = document.createElement('div');

  // Tombol Selesai/Belum Selesai
  const completeButton = document.createElement('button');
  completeButton.setAttribute('data-testid', 'bookItemIsCompleteButton');

  if (bookObject.isComplete) {
    completeButton.innerText = 'Belum selesai dibaca';
    completeButton.addEventListener('click', function () {
      undoBookFromCompleted(bookObject.id);
    });
  } else {
    completeButton.innerText = 'Selesai dibaca';
    completeButton.addEventListener('click', function () {
      addBookToCompleted(bookObject.id);
    });
  }

  // Tombol Hapus
  const deleteButton = document.createElement('button');
  deleteButton.innerText = 'Hapus buku';
  deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
  deleteButton.addEventListener('click', function () {
    // Tambahkan konfirmasi sederhana (opsional UX)
    if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        removeBook(bookObject.id);
    }
  });

  // Tombol Edit
  const editButton = document.createElement('button');
  editButton.innerText = 'Edit buku';
  editButton.setAttribute('data-testid', 'bookItemEditButton');
  editButton.addEventListener('click', function () {
    enableEditMode(bookObject.id);
  });

  // Masukkan tombol-tombol ke container aksi
  actionContainer.append(completeButton, deleteButton, editButton);

  // e. Container Utama (Card Buku)
  const container = document.createElement('div');
  container.setAttribute('data-bookid', bookObject.id); // Wajib ada ID
  container.setAttribute('data-testid', 'bookItem');    // Wajib ada testid
  
  // Rakit elemen ke dalam container utama
  container.append(textTitle, textAuthor, textYear, actionContainer);

  return container;
}

// --- LOGIKA UTAMA (CRUD) ---

// Menambahkan Buku Baru
function addBook() {
  const textTitle = document.getElementById('bookFormTitle').value;
  const textAuthor = document.getElementById('bookFormAuthor').value;
  const textYear = document.getElementById('bookFormYear').value;
  const isComplete = document.getElementById('bookFormIsComplete').checked;

  const generatedID = generateId();
  const bookObject = generateBookObject(generatedID, textTitle, textAuthor, textYear, isComplete);
  books.push(bookObject);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Pindah ke Rak Selesai
function addBookToCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isComplete = true;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Pindah ke Rak Belum Selesai (Undo)
function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  bookTarget.isComplete = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// Menghapus Buku
function removeBook(bookId) {
  const bookTargetIndex = findBookIndex(bookId);
  if (bookTargetIndex === -1) return;

  books.splice(bookTargetIndex, 1);
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// --- LOGIKA EDIT BUKU ---

// Mengaktifkan mode edit dan mengisi form
function enableEditMode(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;

  // Isi form dengan data buku yang dipilih
  document.getElementById('bookFormTitle').value = bookTarget.title;
  document.getElementById('bookFormAuthor').value = bookTarget.author;
  document.getElementById('bookFormYear').value = bookTarget.year;
  document.getElementById('bookFormIsComplete').checked = bookTarget.isComplete;

  // Set status edit
  isEditing = true;
  editedBookId = bookId;

  // Ubah tampilan tombol submit agar user tahu sedang mengedit
  const submitBtn = document.getElementById('bookFormSubmit');
  submitBtn.innerHTML = 'Edit Buku';
  
  // Scroll ke form agar user melihat
  document.getElementById('bookForm').scrollIntoView({ behavior: 'smooth' });
}

// Menyimpan perubahan edit
function updateBook() {
  const bookTarget = findBook(editedBookId);
  if (bookTarget == null) return;

  // Update nilai properti buku
  bookTarget.title = document.getElementById('bookFormTitle').value;
  bookTarget.author = document.getElementById('bookFormAuthor').value;
  bookTarget.year = parseInt(document.getElementById('bookFormYear').value);
  bookTarget.isComplete = document.getElementById('bookFormIsComplete').checked;

  // Reset mode edit ke mode tambah
  isEditing = false;
  editedBookId = null;
  
  // Kembalikan teks tombol submit
  document.getElementById('bookFormSubmit').innerHTML = 'Masukkan Buku ke rak <span>Belum selesai dibaca</span>';

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
}

// --- EVENT LISTENER UTAMA ---

document.addEventListener('DOMContentLoaded', function () {
  const submitForm = document.getElementById('bookForm');
  const searchForm = document.getElementById('searchBook');

  // Handler saat form disubmit (Bisa tambah atau edit)
  submitForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Mencegah reload halaman

    if (isEditing) {
      updateBook();
    } else {
      addBook();
    }
    
    // Reset form setelah submit
    submitForm.reset(); 
  });

  // Handler untuk fitur pencarian
  searchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const searchTitle = document.getElementById('searchBookTitle').value.toLowerCase();
    
    // Kirim event render dengan membawa data pencarian
    const searchEvent = new CustomEvent(RENDER_EVENT, { detail: { searchTitle } });
    document.dispatchEvent(searchEvent);
  });

  // Muat data jika storage ada
  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

// Event Listener untuk Render (Menampilkan Data)
document.addEventListener(RENDER_EVENT, function (event) {
  const incompleteBookList = document.getElementById('incompleteBookList');
  const completeBookList = document.getElementById('completeBookList');

  // Bersihkan HTML lama
  incompleteBookList.innerHTML = '';
  completeBookList.innerHTML = '';

  // Cek apakah ada pencarian judul
  const searchTitle = event.detail ? event.detail.searchTitle : null;

  for (const bookItem of books) {
    // Jika sedang mencari dan judul tidak cocok, lewati buku ini
    if (searchTitle && !bookItem.title.toLowerCase().includes(searchTitle)) {
      continue;
    }

    const bookElement = makeBookElement(bookItem);
    
    if (!bookItem.isComplete) {
      incompleteBookList.append(bookElement);
    } else {
      completeBookList.append(bookElement);
    }
  }
});

// Event Listener Debugging (Opsional)
document.addEventListener(SAVED_EVENT, function () {
  console.log(localStorage.getItem(STORAGE_KEY));
});