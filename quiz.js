document.addEventListener('DOMContentLoaded', function() {
    // Ambil data dari sessionStorage
    const nama = sessionStorage.getItem('nama');
    const kelas = sessionStorage.getItem('kelas');
    const mapel = sessionStorage.getItem('mapel');
    
    // Tampilkan data siswa
    document.getElementById('displayNama').textContent = nama;
    document.getElementById('displayKelas').textContent = kelas;
    document.getElementById('displayMapel').textContent = mapel;
    
    // Variabel kuis
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let score = 0;
    
    // Elemen DOM
    const questionText = document.getElementById('questionText');
    const questionImage = document.getElementById('questionImage');
    const optionsContainer = document.getElementById('optionsContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    
    // Ambil file soal berdasarkan kelas dan mapel
    const kelasNumber = kelas.substring(0, 1);
    const soalFile = `soal/${mapel}${kelasNumber}.txt`;
    
    fetch(soalFile)
        .then(response => {
            if (!response.ok) {
                throw new Error('File soal tidak ditemukan');
            }
            return response.text();
        })
        .then(text => {
            questions = parseQuestions(text);
            userAnswers = new Array(questions.length).fill(null);
            showQuestion(currentQuestionIndex);
            updateProgressBar();
            prevBtn.style.display = 'none';
            if (questions.length === 1) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            questionText.textContent = 'Gagal memuat soal. Silakan hubungi administrator.';
            optionsContainer.innerHTML = `<a href="index.html" class="return-btn">Kembali ke Login</a>`;
        });
    
    function parseQuestions(text) {
        const questionBlocks = text.split('\n\n');
        const questions = [];
        
        for (const block of questionBlocks) {
            if (block.trim() === '') continue;
            
            const lines = block.split('\n');
            const question = {
                text: '',
                options: [],
                answer: '',
                image: ''
            };
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (i === 0 && line.startsWith('SOAL')) {
                    question.text = lines[i+1].trim();
                    i++;
                } else if (line.startsWith('A.')) question.options[0] = line.substring(2).trim();
                else if (line.startsWith('B.')) question.options[1] = line.substring(2).trim();
                else if (line.startsWith('C.')) question.options[2] = line.substring(2).trim();
                else if (line.startsWith('D.')) question.options[3] = line.substring(2).trim();
                else if (line.startsWith('Kunci :')) question.answer = line.substring(7).trim();
                else if (line.startsWith('Gambar :')) question.image = line.substring(8).trim();
            }
            
            if (question.text && question.options.length === 4 && question.answer) {
                questions.push(question);
            }
        }
        
        return questions;
    }
    
    function showQuestion(index) {
        if (index < 0 || index >= questions.length) return;
        
        const question = questions[index];
        currentQuestionIndex = index;
        
        questionText.textContent = `${index + 1}. ${question.text}`;
        
        if (question.image && question.image.trim() !== '') {
            questionImage.src = `gambar/${question.image.trim()}`;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }
        
        optionsContainer.innerHTML = '';
        question.options.forEach((option, i) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            if (userAnswers[index] === String.fromCharCode(65 + i)) {
                optionDiv.classList.add('selected');
            }
            
            optionDiv.innerHTML = `
                <input type="radio" name="answer" id="option${i}" value="${String.fromCharCode(65 + i)}" 
                    ${userAnswers[index] === String.fromCharCode(65 + i) ? 'checked' : ''}>
                <label for="option${i}">${String.fromCharCode(65 + i)}. ${option}</label>
            `;
            
            optionDiv.addEventListener('click', function() {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const selectedOption = this.querySelector('input').value;
                userAnswers[index] = selectedOption;
            });
            
            optionsContainer.appendChild(optionDiv);
        });
        
        prevBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.style.display = index === questions.length - 1 ? 'none' : 'block';
        submitBtn.style.display = index === questions.length - 1 ? 'block' : 'none';
    }
    
    function updateProgressBar() {
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    prevBtn.addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
            updateProgressBar();
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
            updateProgressBar();
        }
    });
    
    submitBtn.addEventListener('click', function() {
        calculateScore();
    });
    
    function calculateScore() {
        let correct = 0;
        let wrong = 0;
        let unanswered = 0;
        
        for (let i = 0; i < questions.length; i++) {
            if (userAnswers[i] === null) {
                unanswered++;
            } else if (userAnswers[i] === questions[i].answer) {
                correct++;
            } else {
                wrong++;
            }
        }
        
        score = Math.round((correct / questions.length) * 100);
        
        sessionStorage.setItem('score', score);
        sessionStorage.setItem('correct', correct);
        sessionStorage.setItem('wrong', wrong);
        sessionStorage.setItem('unanswered', unanswered);
        
        sendDataToGoogleSheets(nama, kelas, mapel, score);
    }

    // Fungsi untuk kirim data ke Google Sheets
    function sendDataToGoogleSheets(nama, kelas, mapel, skor) {
    const timestamp = new Date().toISOString();
    const url = 'https://script.google.com/macros/s/AKfycbyBFRAH7IonEJBFSEy7xSW7QIsR2pzQEAQxBFbay33-hmpY0HpsALezj9VH4ryBOIHuGw/exec';

    const data = {
        nama: nama,
        kelas: kelas,
        mapel: mapel,
        skor: skor,
        timestamp: timestamp
    };

    fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        window.location.href = 'result.html';
    })
    .catch(error => {
        console.error('Error:', error);
        window.location.href = 'result.html';
    });
}
});
