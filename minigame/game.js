document.addEventListener('DOMContentLoaded', () => {
    const ball = document.getElementById('ball');
    const cups = document.querySelectorAll('.cup');
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const messageElement = document.getElementById('message');
    const gameArea = document.querySelector('.game-area');
    const cupsContainer = document.querySelector('.cups-container');

    let score = 0;
    let isPlaying = false;
    let correctCup = null;
    let timeLeft = 10;
    let timerInterval = null;
    
    function showMessage(text, isSuccess = true) {
        messageElement.textContent = text;
        messageElement.style.color = isSuccess ? '#27ae60' : '#c0392b';
    }

    function updateTimer() {
        timerElement.textContent = timeLeft;
        if (timeLeft <= 3) {
            timerElement.parentElement.classList.add('warning');
        } else {
            timerElement.parentElement.classList.remove('warning');
        }
    }

    function startTimer() {
        timeLeft = 10;
        updateTimer();
        clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                if (isPlaying) {
                    handleTimeUp();
                }
            }
        }, 1000);
    }

    function handleTimeUp() {
        isPlaying = false;
        showMessage('Время вышло! Попробуйте еще раз', false);
        
        cups.forEach(c => {
            c.classList.add('lifted');
        });
        
        ball.classList.remove('in-cup');
        placeBallUnderCup(correctCup);
        
        setTimeout(() => {
            cups.forEach(c => {
                if (c !== correctCup) {
                    c.classList.remove('lifted');
                }
            });
            correctCup.classList.add('selected');
            ball.classList.add('in-cup');
            startBtn.disabled = false;
        }, 2000);
    }

    function resetGame() {
        score = 0;
        scoreElement.textContent = score;
        isPlaying = false;
        correctCup = null;
        ball.style.visibility = 'hidden';
        ball.classList.remove('in-cup');
        clearInterval(timerInterval);
        timeLeft = 10;
        updateTimer();
        timerElement.parentElement.classList.remove('warning');
        cups.forEach(cup => {
            cup.style.transform = '';
            cup.classList.remove('lifted', 'hiding-ball', 'shuffling', 'selected');
        });
        startBtn.disabled = false;
        showMessage('Нажмите "Начать игру" чтобы играть!');
    }

    async function placeBallUnderCup(cup) {
        const cupRect = cup.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        const ballX = cupRect.left - gameAreaRect.left + (cupRect.width - ball.offsetWidth) / 2;
        const ballY = cupRect.top - gameAreaRect.top + cupRect.height - ball.offsetHeight - 15;
        
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        
        return new Promise(resolve => {
            ball.style.visibility = 'visible';
            ball.classList.add('in-cup');
            setTimeout(resolve, 500);
        });
    }

    async function hideBallUnderCup(cup) {
        return new Promise(async resolve => {
            cup.classList.add('hiding-ball');
            ball.classList.add('hiding');
            
            // Ждем начала анимации
            await new Promise(r => setTimeout(r, 50));
            
            // Скрываем шарик в процессе анимации
            setTimeout(() => {
                ball.style.visibility = 'hidden';
                ball.classList.remove('hiding');
            }, 400);
            
            // Завершаем анимацию
            setTimeout(() => {
                cup.classList.remove('hiding-ball');
                resolve();
            }, 600);
        });
    }

    function getShufflePositions(count) {
        const positions = [];
        
        // Ensure at least 2 left-right swaps
        positions.push([0, 2]); // Left to right
        positions.push([2, 0]); // Right to left
        
        // Add remaining random swaps
        for (let i = 2; i < count; i++) {
            const pos1 = Math.floor(Math.random() * 3);
            let pos2 = Math.floor(Math.random() * 3);
            
            // Increase probability of left-right swaps
            if (Math.random() < 0.4) {
                pos2 = (pos1 === 0) ? 2 : 0;
            } else {
                // Ensure different positions
                while (pos2 === pos1) {
                    pos2 = Math.floor(Math.random() * 3);
                }
            }
            positions.push([pos1, pos2]);
        }
        
        return positions;
    }

    async function shuffleCups() {
        const shuffleTime = 2500; // Increased total shuffle time
        const shuffleCount = 8; // Increased number of swaps
        const shuffleDelay = shuffleTime / shuffleCount;
        const positions = getShufflePositions(shuffleCount);
        
        ball.style.visibility = 'hidden';
        ball.classList.remove('in-cup');
        
        // Уменьшаем расстояние между стаканами
        const spacing = 180; // Уменьшили с 220px до 180px
        cups.forEach((cup, index) => {
            cup.style.transform = `translateX(${(index - 1) * spacing}px)`;
        });
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        for (const [pos1, pos2] of positions) {
            const cup1 = cups[pos1];
            const cup2 = cups[pos2];
            
            // Получаем текущие позиции и ограничиваем их
            const transform1 = cup1.style.transform;
            const transform2 = cup2.style.transform;
            
            cup1.classList.add('shuffling');
            cup2.classList.add('shuffling');
            
            // Меняем позиции
            cup1.style.transform = transform2;
            cup2.style.transform = transform1;
            
            if (cup1 === correctCup) {
                correctCup = cup2;
            } else if (cup2 === correctCup) {
                correctCup = cup1;
            }
            
            await new Promise(resolve => setTimeout(resolve, shuffleDelay + 50));
            
            cup1.classList.remove('shuffling');
            cup2.classList.remove('shuffling');
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Меняем порядок в DOM
            const parent = cup1.parentNode;
            const cup2Next = cup2.nextSibling;
            parent.insertBefore(cup2, cup1);
            parent.insertBefore(cup1, cup2Next);
        }
        
        // Плавно возвращаем стаканы на место
        cups.forEach(cup => {
            cup.classList.add('shuffling');
            cup.style.transform = '';
        });
        
        // Ждем завершения анимации возврата
        await new Promise(resolve => setTimeout(resolve, 500));
        
        cups.forEach(cup => {
            cup.classList.remove('shuffling');
        });
    }

    async function startRound() {
        startBtn.disabled = true;
        isPlaying = true;
        
        cups.forEach(cup => {
            cup.style.transform = '';
            cup.classList.remove('lifted', 'hiding-ball', 'shuffling', 'selected');
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        const randomCupIndex = Math.floor(Math.random() * 3);
        correctCup = cups[randomCupIndex];
        
        showMessage('Смотрите внимательно!');
        
        await placeBallUnderCup(correctCup);
        await new Promise(resolve => setTimeout(resolve, 1500));
        await hideBallUnderCup(correctCup);
        await new Promise(resolve => setTimeout(resolve, 300));
        await shuffleCups();
        
        showMessage('Где шарик? Выберите стакан!');
        startTimer(); // Запускаем таймер после завершения перемешивания
    }

    async function handleCupClick(cup) {
        if (!isPlaying) return;
        
        isPlaying = false;
        clearInterval(timerInterval); // Останавливаем таймер при выборе стакана
        
        const isCorrect = cup === correctCup;
        
        cups.forEach(c => {
            c.classList.add('lifted');
        });
        
        ball.classList.remove('in-cup');
        await placeBallUnderCup(correctCup);

        if (isCorrect) {
            score++;
            scoreElement.textContent = score;
            showMessage('Правильно! +1 очко');
        } else {
            showMessage('Неправильно! Попробуйте еще раз', false);
        }

        setTimeout(() => {
            cups.forEach(c => {
                if (c !== correctCup) {
                    c.classList.remove('lifted');
                }
            });
            correctCup.classList.add('selected');
            ball.classList.add('in-cup');
            startBtn.disabled = false;
        }, 2000);
    }

    // Event Listeners
    startBtn.addEventListener('click', () => {
        if (correctCup) {
            correctCup.classList.remove('selected', 'lifted');
        }
        startRound();
    });
    resetBtn.addEventListener('click', resetGame);
    cups.forEach(cup => {
        cup.addEventListener('click', () => handleCupClick(cup));
    });

    // Initialize game
    resetGame();
}); 