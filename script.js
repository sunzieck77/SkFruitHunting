        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzp1WN50cgX2ypgqR4cR68GgEbfkBMhoWV2A7kzSPoLJuHaOgDYckt3H0fUWtTg0sGK/exec';
        
        let currentUser = null;
        let zonesData = [];
        let allQuestionsData = {};
        let isDataLoaded = false;
        let devMode = false;
        let currentQuiz = {
            zoneId: null,
            questions: [],
            currentIndex: 0,
            answers: [],
            score: 0,
            startTime: null,
            endTime: null,
            timerInterval: null
        };
        let teacherData = [];
        let teacherSortField = 'name';
        let teacherSortAsc = true;

        const defaultConfig = {
            app_title: 'ล่าสมบัติผลไม้'
        };

        async function onConfigChange(config) {
            const title = config.app_title || defaultConfig.app_title;
            const titleElements = document.querySelectorAll('h1');
            titleElements.forEach(el => {
                if (el.textContent.includes('ล่าสมบัติผลไม้')) {
                    el.textContent = `🍎 ${title} 🍊`;
                }
            });
        }

        function mapToCapabilities(config) {
            return {
                recolorables: [],
                borderables: [],
                fontEditable: undefined,
                fontSizeable: undefined
            };
        }

        function mapToEditPanelValues(config) {
            return new Map([
                ['app_title', config.app_title || defaultConfig.app_title]
            ]);
        }

        if (window.elementSdk) {
            window.elementSdk.init({
                defaultConfig,
                onConfigChange,
                mapToCapabilities,
                mapToEditPanelValues
            });
        }

        // โหลดข้อมูลทั้งหมดตอนเริ่มต้น
        async function preloadAllData() {
            if (isDataLoaded) return;
            
            try {
                let progress = 0;
                const totalSteps = 7; // 1 สำหรับโซน + 6 สำหรับข้อสอบ
                
                // โหลดข้อมูลโซน
                updateLoadingProgress(progress);
                const zonesResponse = await sendToGoogleSheets('getZones', {});
                zonesData = zonesResponse.data || [];
                progress++;
                updateLoadingProgress((progress / totalSteps) * 100);
                
                // โหลดข้อสอบทุกโซน
                for (let i = 1; i <= 6; i++) {
                    updateLoadingProgress((progress / totalSteps) * 100);
                    try {
                        const questionsResponse = await sendToGoogleSheets('getQuestions', { zoneId: i });
                        allQuestionsData[i] = questionsResponse.data || [];
                    } catch (error) {
                        console.error(`Error loading questions for zone ${i}:`, error);
                        allQuestionsData[i] = [];
                    }
                    progress++;
                    updateLoadingProgress((progress / totalSteps) * 100);
                }
                
                updateLoadingProgress(100);
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                }, 500);
                
                isDataLoaded = true;
            } catch (error) {
                console.error('Error preloading data:', error);
                updateLoadingProgress(100);
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                }, 1000);
            }
        }

        function updateLoadingProgress(percent) {
            document.getElementById('loadingPercent').textContent = Math.round(percent);
        }

        // เริ่มโหลดข้อมูลทันทีที่หน้าเว็บโหลด
        document.addEventListener('DOMContentLoaded', () => {
            preloadAllData();
            
            // ปิดเมนูเมื่อคลิกนอกพื้นที่
            document.addEventListener('click', (e) => {
                const aboutButton = document.getElementById('aboutButton');
                const aboutMenu = document.getElementById('aboutMenu');
                if (aboutButton && aboutMenu && !aboutButton.contains(e.target)) {
                    aboutMenu.classList.add('hidden');
                }
            });
        });

        function toggleAboutMenu() {
            const menu = document.getElementById('aboutMenu');
            menu.classList.toggle('hidden');
        }

        function showHowToPlay() {
            document.getElementById('aboutMenu').classList.add('hidden');
            Swal.fire({
                title: '📖 วิธีเล่นกิจกรรม',
                html: `
                    <div class="text-left space-y-3">
                        <div class="bg-purple-50 p-3 rounded-lg">
                            <h4 class="font-bold text-purple-600 mb-2">🎯 เป้าหมาย</h4>
                            <p class="text-sm">รวบรวมไอเท็มจากทั้ง 6 โซน โดยการทำข้อสอบให้ผ่านในแต่ละโซน</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <h4 class="font-bold text-blue-600 mb-2">📝 การทำข้อสอบ</h4>
                            <ul class="text-sm space-y-1 list-disc list-inside">
                                <li>แต่ละโซนมีข้อสอบ 10 ข้อ</li>
                                <li>ต้องได้คะแนนขั้นต่ำเพื่อผ่าน</li>
                                <li>ผ่านแล้วจะได้ไอเท็มของโซนนั้น</li>
                                <li>แต่ละโซนทำได้เพียงครั้งเดียว</li>
                            </ul>
                        </div>
                        <div class="bg-green-50 p-3 rounded-lg">
                            <h4 class="font-bold text-green-600 mb-2">🎁 รางวัล</h4>
                            <p class="text-sm">เมื่อรวบรวมไอเท็มครบทั้ง 6 โซน จะสามารถแลกของรางวัลได้</p>
                        </div>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'เข้าใจแล้ว',
                width: '600px'
            });
        }

        function showContact() {
            document.getElementById('aboutMenu').classList.add('hidden');
            Swal.fire({
                title: '📞 ติดต่อผู้ดูแล',
                html: `
                    <div class="text-left space-y-3">
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-sm mb-2"><strong>📧 อีเมล:</strong></p>
                            <p class="text-sm text-gray-700">admin@example.com</p>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-sm mb-2"><strong>📱 โทรศัพท์:</strong></p>
                            <p class="text-sm text-gray-700">02-XXX-XXXX</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-sm mb-2"><strong>🏫 สถานที่:</strong></p>
                            <p class="text-sm text-gray-700">โรงเรียน/สถาบัน</p>
                        </div>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'ปิด',
                width: '500px'
            });
        }

        function sendToGoogleSheets(action, data) {
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonpCallback_' + Date.now();
                
                window[callbackName] = function(response) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    
                    if (response.status === 'success') {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || 'เกิดข้อผิดพลาด'));
                    }
                };

                const params = new URLSearchParams({
                    action: action,
                    callback: callbackName,
                    data: JSON.stringify(data)
                });

                const script = document.createElement('script');
                script.src = `${SCRIPT_URL}?${params.toString()}`;
                script.onerror = () => {
                    delete window[callbackName];
                    reject(new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'));
                };
                
                document.body.appendChild(script);
            });
        }

        function showLoginForm() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
        }

        function showRegisterForm() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('registerForm').classList.remove('hidden');
        }

        async function handleRegister() {
            const firstname = document.getElementById('regFirstname').value.trim();
            const lastname = document.getElementById('regLastname').value.trim();
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            if (!firstname || !lastname || !username || !password) {
                Swal.fire('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
                return;
            }

            if (password !== confirmPassword) {
                Swal.fire('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน', 'error');
                return;
            }

            Swal.fire({
                title: 'กำลังบันทึกข้อมูล...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await sendToGoogleSheets('register', {
                    firstname,
                    lastname,
                    username,
                    password
                });

                Swal.fire('สำเร็จ!', 'ลงทะเบียนเรียบร้อยแล้ว', 'success');
                showLoginForm();
                
                document.getElementById('regFirstname').value = '';
                document.getElementById('regLastname').value = '';
                document.getElementById('regUsername').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regConfirmPassword').value = '';
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.message, 'error');
            }
        }

        async function handleLogin() {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'error');
                return;
            }

            Swal.fire({
                title: 'กำลังเข้าสู่ระบบ...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await sendToGoogleSheets('login', { username, password });
                
                if (response.data) {
                    currentUser = response.data;
                    
                    // โหลดข้อมูลผู้ใช้ล่าสุดจาก Google Sheets เพื่อให้แน่ใจว่าได้ข้อมูลที่อัปเดตแล้ว
                    try {
                        const userDataResponse = await sendToGoogleSheets('getUserData', { stdId: currentUser.STD_ID });
                        if (userDataResponse.status === 'success' && userDataResponse.data) {
                            currentUser = userDataResponse.data;
                        }
                    } catch (error) {
                        console.error('Error loading user data:', error);
                        // ใช้ข้อมูลจาก login ถ้าโหลดข้อมูลล่าสุดไม่สำเร็จ
                    }
                    
                    Swal.close();
                    showGameScreen();
                } else {
                    Swal.fire('ข้อผิดพลาด', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
                }
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', error.message, 'error');
            }
        }

        async function showGameScreen() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('aboutButton').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            
            document.getElementById('profileName').textContent = `${currentUser.FIRSTNAME} ${currentUser.LASTNAME}`;
            
            // รอให้ข้อมูลโหลดเสร็จก่อน
            if (!isDataLoaded) {
                document.getElementById('loadingScreen').classList.remove('hidden');
                await preloadAllData();
            }
            
            renderZones();
            updateProgress();
        }



        function renderZones() {
            const grid = document.getElementById('zonesGrid');
            grid.innerHTML = '';

            zonesData.forEach((zone, index) => {
                const zoneId = index + 1;
                const isUnlocked = currentUser[`ZONE_ID_${zoneId}`] === 'TRUE';
                
                const card = document.createElement('div');
                card.className = 'zone-card glass-card p-4 text-center';
                card.onclick = () => showZonePinPrompt(zoneId, zone);
                
                card.innerHTML = `
                    <img src="${zone.ITEM_IMG_URL}" alt="โซน: ${zone.ZONE_NAME}" 
                         class="w-full h-32 object-contain mb-3 ${isUnlocked ? 'item-unlocked' : 'item-locked'}"
                         onerror="this.src=''; this.alt='ไม่สามารถโหลดรูปภาพได้'; this.style.display='none';">
                    <h3 class="font-bold text-lg text-purple-600">โซน: ${zone.ZONE_NAME}</h3>
                    <p class="text-sm ${isUnlocked ? 'text-green-600' : 'text-gray-500'}">
                        ${isUnlocked ? '✅ ปลดล็อกแล้ว' : '🔒 ยังไม่ปลดล็อก'}
                    </p>
                `;
                
                grid.appendChild(card);
            });
        }

        function updateProgress() {
            let completed = 0;
            for (let i = 1; i <= 6; i++) {
                if (currentUser[`ZONE_ID_${i}`] === 'TRUE') {
                    completed++;
                }
            }
            
            const percent = Math.round((completed / 6) * 100);
            document.getElementById('progressPercent').textContent = percent;
            document.getElementById('progressBar').style.width = percent + '%';
            
            // แสดงปุ่มแลกของรางวัล (ถ้ายังไม่ได้แลก)
            if (completed === 6 && currentUser.GIFT !== 'COMPLETED') {
                document.getElementById('rewardSection').classList.remove('hidden');
                document.getElementById('certificateSection').classList.add('hidden');
            } 
            // แสดงปุ่มดูตราผ่าน (ถ้าแลกของรางวัลแล้ว)
            else if (completed === 6 && currentUser.GIFT === 'COMPLETED') {
                document.getElementById('rewardSection').classList.add('hidden');
                document.getElementById('certificateSection').classList.remove('hidden');
            } 
            // ซ่อนทั้งสองปุ่ม (ถ้ายังไม่ผ่านครบ)
            else {
                document.getElementById('rewardSection').classList.add('hidden');
                document.getElementById('certificateSection').classList.add('hidden');
            }
        }

        async function showZonePinPrompt(zoneId, zone) {
            // ตรวจสอบว่าโซนนี้ปลดล็อกแล้วหรือยัง
            const isUnlocked = currentUser[`ZONE_ID_${zoneId}`] === 'TRUE';
            
            if (isUnlocked) {
                // แสดงประวัติการทำข้อสอบของโซนนี้
                await showZoneHistory(zoneId, zone);
                return;
            }

            const { value: pin } = await Swal.fire({
                title: `เข้าสู่โซน: ${zone.ZONE_NAME}`,
                input: 'text',
                inputLabel: 'กรุณาใส่ PIN ของโซน',
                inputPlaceholder: 'ใส่ PIN',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก',
                confirmButtonText: 'ยืนยัน'
            });

            if (pin) {
                // ตรวจสอบ devmode
                if (pin === 'devmode1') {
                    devMode = true;
                    await startQuiz(zoneId, zone);
                } else if (pin === String(zone.ZONE_PIN)) {
                    devMode = false;
                    await startQuiz(zoneId, zone);
                } else {
                    Swal.fire('ข้อผิดพลาด', 'PIN ไม่ถูกต้อง', 'error');
                }
            }
        }

        async function showZoneHistory(zoneId, zone) {
            Swal.fire({
                title: 'กำลังโหลดข้อมูล...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await sendToGoogleSheets('getStudentDetail', { stdId: currentUser.STD_ID });
                const studentData = response.data;
                
                if (!studentData || !studentData.quizResults) {
                    Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลประวัติ', 'error');
                    return;
                }

                // กรองเฉพาะผลลัพธ์ของโซนนี้
                const zoneResults = studentData.quizResults.filter(result => result.ZONE_ID === zoneId);
                
                let html = `
                    <div class="text-left space-y-3">
                        <div class="bg-green-100 p-4 rounded-lg text-center mb-4">
                            <div class="text-4xl mb-2">✅</div>
                            <h4 class="font-bold text-green-600 text-lg">โซนนี้ปลดล็อกแล้ว</h4>
                            <p class="text-sm text-gray-600 mt-1">คุณได้ทำข้อสอบโซนนี้ผ่านแล้ว</p>
                        </div>
                        
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <h4 class="font-bold text-purple-600 mb-3">📊 ประวัติการทำข้อสอบ (${zoneResults.length} ครั้ง)</h4>
                `;

                if (zoneResults.length > 0) {
                    html += '<div class="space-y-2">';
                    zoneResults.forEach((result, index) => {
                        const passed = result.ITEM == true;
                        const date = new Date(result.TIMESTAMP).toLocaleDateString('th-TH', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        html += `
                            <div class="bg-${passed ? 'green' : 'red'}-50 p-3 rounded border-2 border-${passed ? 'green' : 'red'}-200">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-bold text-sm">ครั้งที่ ${index + 1}</span>
                                    <span class="text-xl">${passed ? '✅' : '❌'}</span>
                                </div>
                                <div class="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span class="text-gray-600">คะแนน:</span>
                                        <span class="font-bold ml-1">${result.SCORE}/10</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-600">เวลา:</span>
                                        <span class="font-bold ml-1">${result.TIME || '-'}</span>
                                    </div>
                                </div>
                                <div class="text-xs text-gray-500 mt-2">${date}</div>
                            </div>
                        `;
                    });
                    html += '</div>';
                } else {
                    html += '<p class="text-sm text-gray-500 text-center py-4">ไม่พบประวัติการทำข้อสอบ</p>';
                }

                html += `
                        </div>
                    </div>
                `;

                Swal.fire({
                    title: `โซน: ${zone.ZONE_NAME}`,
                    html: html,
                    icon: 'info',
                    confirmButtonText: 'ปิด',
                    width: '600px'
                });
                
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
            }
        }

        async function startQuiz(zoneId, zone) {
            try {
                // ใช้ข้อมูลที่โหลดไว้แล้วจาก preload
                const allQuestions = allQuestionsData[zoneId] || [];
                
                if (allQuestions.length === 0) {
                    Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อสอบสำหรับโซนนี้', 'error');
                    return;
                }
                
                // สุ่มข้อสอบและเลือก 10 ข้อ
                const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, Math.min(10, allQuestions.length));
                
                currentQuiz = {
                    zoneId,
                    zoneName: zone.ZONE_NAME,
                    questions: selected,
                    currentIndex: 0,
                    answers: new Array(selected.length).fill(null),
                    score: 0,
                    maxScore: selected[0]?.MAX_SCORE || 10,
                    minScore: selected[0]?.MINIMUM || 7,
                    startTime: new Date(),
                    endTime: null,
                    timerInterval: null
                };

                showQuizScreen();
            } catch (error) {
                console.error('Error loading quiz:', error);
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อสอบได้ กรุณาลองใหม่อีกครั้ง', 'error');
            }
        }

        function updateQuizTimer() {
            if (!currentQuiz.startTime) return;
            
            const now = new Date();
            const elapsed = Math.floor((now - currentQuiz.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            document.getElementById('quizTimer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        function showQuizScreen() {
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('quizScreen').classList.remove('hidden');
            
            document.getElementById('quizZoneName').textContent = `โซน: ${currentQuiz.zoneName}`;
            document.getElementById('totalQuestions').textContent = currentQuiz.questions.length;
            
            // แสดง devmode controls หาก devmode เปิดอยู่
            if (devMode) {
                document.getElementById('devModeControls').classList.remove('hidden');
            } else {
                document.getElementById('devModeControls').classList.add('hidden');
            }
            
            // เริ่มจับเวลา
            if (currentQuiz.timerInterval) {
                clearInterval(currentQuiz.timerInterval);
            }
            currentQuiz.timerInterval = setInterval(updateQuizTimer, 1000);
            updateQuizTimer();
            
            renderQuestion();
        }

        function renderQuestion() {
            const question = currentQuiz.questions[currentQuiz.currentIndex];
            const index = currentQuiz.currentIndex;
            
            document.getElementById('currentQuestion').textContent = index + 1;
            document.getElementById('questionText').textContent = question.QUESTION;
            
            const progress = ((index + 1) / currentQuiz.questions.length) * 100;
            document.getElementById('quizProgress').style.width = progress + '%';
            
            const choicesContainer = document.getElementById('choicesContainer');
            choicesContainer.innerHTML = '';
            
            const choices = [
                { text: question.CHOICE1, index: 0 },
                { text: question.CHOICE2, index: 1 },
                { text: question.CHOICE3, index: 2 },
                { text: question.CHOICE4, index: 3 }
            ];
            
            choices.forEach(choice => {
                const div = document.createElement('div');
                div.className = 'quiz-option border-2 border-gray-300 rounded-lg p-4';
                div.textContent = choice.text;
                
                if (currentQuiz.answers[index] === choice.index) {
                    div.classList.add('selected');
                }
                
                // แสดงเฉลยใน devmode
                if (devMode && document.getElementById('showAnswers').checked && choice.index === parseInt(question.ANSWER_INDEX)) {
                    div.classList.add('correct');
                    div.innerHTML = choice.text + ' <span class="text-green-600 font-bold">✓ เฉลย</span>';
                }
                
                div.onclick = () => selectAnswer(choice.index);
                choicesContainer.appendChild(div);
            });
            
            document.getElementById('prevBtn').disabled = index === 0;
            
            // ปิดใช้งานปุ่มถัดไปถ้ายังไม่ได้เลือกคำตอบ
            const nextBtn = document.getElementById('nextBtn');
            const submitBtn = document.getElementById('submitBtn');
            const hasAnswer = currentQuiz.answers[index] !== null;
            
            if (index === currentQuiz.questions.length - 1) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
                submitBtn.disabled = !hasAnswer;
                submitBtn.classList.toggle('opacity-50', !hasAnswer);
                submitBtn.classList.toggle('cursor-not-allowed', !hasAnswer);
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
                nextBtn.disabled = !hasAnswer;
                nextBtn.classList.toggle('opacity-50', !hasAnswer);
                nextBtn.classList.toggle('cursor-not-allowed', !hasAnswer);
            }
        }

        function selectAnswer(choiceIndex) {
            currentQuiz.answers[currentQuiz.currentIndex] = choiceIndex;
            renderQuestion();
        }

        function toggleAnswers() {
            renderQuestion();
        }

        function previousQuestion() {
            if (currentQuiz.currentIndex > 0) {
                currentQuiz.currentIndex--;
                renderQuestion();
            }
        }

        function nextQuestion() {
            if (currentQuiz.currentIndex < currentQuiz.questions.length - 1) {
                currentQuiz.currentIndex++;
                renderQuestion();
            }
        }

        async function submitQuiz() {
            const unanswered = currentQuiz.answers.filter(a => a === null).length;
            if (unanswered > 0) {
                Swal.fire({
                    title: 'กรุณาตอบคำถามให้ครบ',
                    text: `คุณยังไม่ได้ตอบคำถาม ${unanswered} ข้อ กรุณาตอบให้ครบทุกข้อก่อนส่งคำตอบ`,
                    icon: 'warning',
                    confirmButtonText: 'ตกลง'
                });
                return;
            }

            // หยุดตัวจับเวลา
            if (currentQuiz.timerInterval) {
                clearInterval(currentQuiz.timerInterval);
                currentQuiz.timerInterval = null;
            }

            currentQuiz.endTime = new Date();
            const timeSpentMs = currentQuiz.endTime - currentQuiz.startTime;
            const minutes = Math.floor(timeSpentMs / 60000);
            const seconds = Math.floor((timeSpentMs % 60000) / 1000);
            const timeSpentFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            let score = 0;
            currentQuiz.questions.forEach((q, i) => {
                if (currentQuiz.answers[i] === parseInt(q.ANSWER_INDEX)) {
                    score++;
                }
            });

            currentQuiz.score = score;
            const passed = score >= currentQuiz.minScore;

            Swal.fire({
                title: 'กำลังบันทึกผล...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                // ดึงข้อมูลจำนวนครั้งที่ทำข้อสอบ
                const attemptsResponse = await sendToGoogleSheets('getQuizAttempts', {
                    stdId: currentUser.STD_ID,
                    zoneId: currentQuiz.zoneId
                });
                const attempts = (attemptsResponse.data || 0) + 1;

                const saveData = {
                    stdId: currentUser.STD_ID,
                    firstname: currentUser.FIRSTNAME,
                    lastname: currentUser.LASTNAME,
                    zoneId: currentQuiz.zoneId,
                    score: score,
                    item: passed,
                    time: timeSpentFormatted
                };

                await sendToGoogleSheets('saveQuizResult', saveData);

                if (passed) {
                    currentUser[`ZONE_ID_${currentQuiz.zoneId}`] = 'TRUE';
                }

                Swal.close();
                showQuizSummary(score, attempts, timeSpentFormatted, passed);
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกผลได้', 'error');
            }
        }

        function showQuizSummary(score, attempts, timeSpent, passed) {
            document.getElementById('quizScreen').classList.add('hidden');
            document.getElementById('quizSummaryScreen').classList.remove('hidden');
            
            // Set basic info
            document.getElementById('summaryZoneName').textContent = `โซน: ${currentQuiz.zoneName}`;
            document.getElementById('summaryScoreDisplay').textContent = score;
            document.getElementById('summaryMaxScore').textContent = `/ ${currentQuiz.maxScore}`;
            document.getElementById('summaryScoreDetail').textContent = `${score}/${currentQuiz.maxScore}`;
            document.getElementById('summaryAttempts').textContent = attempts;
            document.getElementById('summaryTime').textContent = timeSpent;
            
            // Style based on pass/fail
            const circle = document.getElementById('summaryCircle');
            const glowRing = document.getElementById('summaryGlowRing');
            const statusBadge = document.getElementById('summaryStatusBadge');
            const statusIcon = document.getElementById('summaryStatusIcon');
            const statusText = document.getElementById('summaryStatusText');
            const scoreDisplay = document.getElementById('summaryScoreDisplay');
            
            // Get zone item data
            const zoneData = zonesData[currentQuiz.zoneId - 1];
            const itemContainer = document.getElementById('summaryItemContainer');
            
            if (passed) {
                // Passed styling - Green theme
                circle.className = 'relative w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-green-400 bg-gradient-to-br from-green-50 to-green-100';
                glowRing.className = 'absolute inset-0 rounded-full bg-green-400 opacity-20 animate-pulse';
                statusBadge.className = 'inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-md bg-gradient-to-r from-green-400 to-green-500 text-white';
                statusIcon.textContent = '✅';
                statusText.textContent = 'ผ่าน';
                scoreDisplay.className = 'text-4xl md:text-5xl font-bold text-green-600';
                
                // Show colored item with unlock message
                itemContainer.innerHTML = `
                    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-300">
                        <div class="text-green-600 font-bold mb-2 text-sm md:text-base">🎉 ปลดล็อกไอเท็มแล้ว!</div>
                        <img src="${zoneData.ITEM_IMG_URL}" alt="${zoneData.ZONE_NAME}" 
                             class="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto drop-shadow-lg"
                             onerror="this.style.display='none';">
                        <div class="text-sm text-gray-700 mt-2 font-semibold">${zoneData.ZONE_NAME}</div>
                    </div>
                `;
            } else {
                // Failed styling - Red theme
                circle.className = 'relative w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-red-400 bg-gradient-to-br from-red-50 to-red-100';
                glowRing.className = 'absolute inset-0 rounded-full bg-red-400 opacity-20 animate-pulse';
                statusBadge.className = 'inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-md bg-gradient-to-r from-red-400 to-red-500 text-white';
                statusIcon.textContent = '❌';
                statusText.textContent = 'ไม่ผ่าน';
                scoreDisplay.className = 'text-4xl md:text-5xl font-bold text-red-600';
                
                // Show grayscale item with locked message
                itemContainer.innerHTML = `
                    <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-300">
                        <div class="text-gray-600 font-bold mb-2 text-sm md:text-base">🔒 ยังไม่ผ่าน</div>
                        <img src="${zoneData.ITEM_IMG_URL}" alt="${zoneData.ZONE_NAME}" 
                             class="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto grayscale opacity-50"
                             onerror="this.style.display='none';">
                        <div class="text-sm text-gray-600 mt-2">ลองใหม่อีกครั้ง</div>
                    </div>
                `;
            }
        }

        function exitQuizSummary() {
            document.getElementById('quizSummaryScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            renderZones();
            updateProgress();
        }

        function exitQuiz() {
            // หยุดตัวจับเวลา
            if (currentQuiz.timerInterval) {
                clearInterval(currentQuiz.timerInterval);
                currentQuiz.timerInterval = null;
            }

            document.getElementById('quizScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            
            document.getElementById('nextBtn').onclick = nextQuestion;
            document.getElementById('prevBtn').onclick = previousQuestion;
            document.getElementById('submitBtn').onclick = submitQuiz;
            document.getElementById('submitBtn').textContent = 'ส่งคำตอบ';
            
            renderZones();
            updateProgress();
        }

        async function redeemReward() {
            const result = await Swal.fire({
                title: 'ยืนยันการแลกของรางวัล',
                text: 'คุณสามารถแลกของรางวัลได้เพียงครั้งเดียวเท่านั้น',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'ยืนยัน',
                cancelButtonText: 'ยกเลิก'
            });

            if (!result.isConfirmed) return;

            Swal.fire({
                title: 'กำลังบันทึก...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                await sendToGoogleSheets('redeemGift', { stdId: currentUser.STD_ID });
                currentUser.GIFT = 'COMPLETED';
                
                Swal.close();
                showRewardDisplay();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถแลกของรางวัลได้', 'error');
            }
        }

        function showRewardDisplay() {
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('rewardDisplayScreen').classList.remove('hidden');
            document.getElementById('rewardProfileName').textContent = `${currentUser.FIRSTNAME} ${currentUser.LASTNAME}`;
        }

        function backToGame() {
            document.getElementById('rewardDisplayScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
            updateProgress();
        }

        function showCertificate() {
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('certificateScreen').classList.remove('hidden');
            document.getElementById('certificateName').textContent = `${currentUser.FIRSTNAME} ${currentUser.LASTNAME}`;
            
            // โหลดไอเท็มทั้ง 6 โซน
            const itemsContainer = document.getElementById('certificateItems');
            itemsContainer.innerHTML = '';
            
            zonesData.forEach((zone, index) => {
                const zoneId = index + 1;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'glass-item rounded-2xl p-6 transform hover:scale-105 transition-all duration-300';
                
                itemDiv.innerHTML = `
                    <div class="relative z-10">
                        <img src="${zone.ITEM_IMG_URL}" 
                             alt="${zone.ZONE_NAME}" 
                             class="w-32 h-32 object-contain mx-auto mb-3 drop-shadow-lg"
                             onerror="this.src=''; this.alt='ไม่สามารถโหลดรูปภาพได้'; this.style.display='none';">
                        <h5 class="font-bold text-lg text-purple-600">${zone.ZONE_NAME}</h5>
                        <p class="text-sm text-green-600 font-semibold mt-2">✅ รวบรวมแล้ว</p>
                    </div>
                `;
                
                itemsContainer.appendChild(itemDiv);
            });
        }

        function closeCertificate() {
            document.getElementById('certificateScreen').classList.add('hidden');
            document.getElementById('gameScreen').classList.remove('hidden');
        }

        function handleLogout() {
            currentUser = null;
            devMode = false;
            document.getElementById('gameScreen').classList.add('hidden');
            document.getElementById('aboutButton').classList.remove('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }

        async function showTeacherLogin() {
            const { value: password } = await Swal.fire({
                title: 'เข้าสู่ระบบครู',
                input: 'password',
                inputLabel: 'กรุณาใส่รหัสผ่าน',
                inputPlaceholder: 'รหัสผ่าน',
                showCancelButton: true,
                cancelButtonText: 'ยกเลิก',
                confirmButtonText: 'เข้าสู่ระบบ'
            });

            if (password === '==teacher') {
                await loadTeacherDashboard();
            } else if (password) {
                Swal.fire('ข้อผิดพลาด', 'รหัสผ่านไม่ถูกต้อง', 'error');
            }
        }

        async function loadTeacherDashboard() {
            Swal.fire({
                title: 'กำลังโหลดข้อมูล...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await sendToGoogleSheets('getAllStudents', {});
                teacherData = response.data || [];

                Swal.close();
                
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('gameScreen').classList.add('hidden');
                document.getElementById('aboutButton').classList.add('hidden');
                document.getElementById('teacherScreen').classList.remove('hidden');
                
                filterTeacherData();
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้: ' + error.message, 'error');
            }
        }

        function filterTeacherData() {
            const zoneFilterEl = document.getElementById('zoneFilter');
            const zoneFilter = zoneFilterEl ? zoneFilterEl.value : 'all';  // ✅ ป้องกัน error
            const searchText = document.getElementById('searchStudent').value.toLowerCase();
            
            let filtered = teacherData.filter(student => {
                const nameMatch = `${student.FIRSTNAME} ${student.LASTNAME}`.toLowerCase().includes(searchText) ||
                                student.USERNAME.toLowerCase().includes(searchText);
                
                if (zoneFilter === 'all') {
                    return nameMatch;
                } else {
                    const zoneKey = `ZONE_ID_${zoneFilter}`;
                    return nameMatch && student[zoneKey] === 'TRUE';
                }
            });
            
            renderTeacherTable(filtered);
        }

        function sortTeacherData(field) {
            if (teacherSortField === field) {
                teacherSortAsc = !teacherSortAsc;
            } else {
                teacherSortField = field;
                teacherSortAsc = true;
            }
            
            filterTeacherData();
        }

        function renderTeacherTable(data) {
            const tbody = document.getElementById('teacherTableBody');
            tbody.innerHTML = '';
            
            const sorted = [...data].sort((a, b) => {
                let aVal, bVal;
                
                if (teacherSortField === 'name') {
                    aVal = `${a.FIRSTNAME} ${a.LASTNAME}`;
                    bVal = `${b.FIRSTNAME} ${b.LASTNAME}`;
                } else {
                    aVal = a.USERNAME;
                    bVal = b.USERNAME;
                }
                
                if (teacherSortAsc) {
                    return aVal.localeCompare(bVal, 'th');
                } else {
                    return bVal.localeCompare(aVal, 'th');
                }
            });
            
            sorted.forEach(student => {
                const tr = document.createElement('tr');
                tr.className = 'border-b hover:bg-purple-50';
                
                let html = `
                    <td class="px-3 md:px-4 py-3 text-sm md:text-base">${student.FIRSTNAME} ${student.LASTNAME}</td>
                    <td class="px-3 md:px-4 py-3 text-sm md:text-base">${student.USERNAME}</td>
                    <td class="px-3 md:px-4 py-3 text-center">
                        <button onclick="showStudentDetail('${student.STD_ID}')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition whitespace-nowrap">
                            ดูรายละเอียด
                        </button>
                    </td>
                `;
                
                tr.innerHTML = html;
                tbody.appendChild(tr);
            });
        }

        async function refreshTeacherData() {
            await loadTeacherDashboard();
            Swal.fire({
                title: 'สำเร็จ',
                text: 'รีเฟรชข้อมูลเรียบร้อยแล้ว',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }

        async function showStudentDetail(stdId) {
            Swal.fire({
                title: 'กำลังโหลดข้อมูล...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            try {
                const response = await sendToGoogleSheets('getStudentDetail', { stdId });
                const studentData = response.data;
                
                if (!studentData) {
                    Swal.fire('ข้อผิดพลาด', 'ไม่พบข้อมูลนักเรียน', 'error');
                    return;
                }

                Swal.close();
                
                document.getElementById('modalStudentName').textContent = `${studentData.student.FIRSTNAME} ${studentData.student.LASTNAME}`;
                
                let html = `
                    <div class="mb-6">
                        <h4 class="text-base md:text-lg font-bold text-purple-600 mb-3">ข้อมูลทั่วไป</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="bg-purple-50 p-3 rounded">
                                <span class="font-semibold text-sm md:text-base">ชื่อ-นามสกุล:</span><br class="md:hidden">
                                <span class="text-sm md:text-base">${studentData.student.FIRSTNAME} ${studentData.student.LASTNAME}</span>
                            </div>
                            <div class="bg-purple-50 p-3 rounded">
                                <span class="font-semibold text-sm md:text-base">Username:</span><br class="md:hidden">
                                <span class="text-sm md:text-base">${studentData.student.USERNAME}</span>
                            </div>
                        </div>
                    </div>

                    <!-- สถานะการปลดล็อกโซน -->
                    <div class="mb-6">
                        <h4 class="text-base md:text-lg font-bold text-purple-600 mb-3">สถานะการปลดล็อกโซน</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                `;
                
                for (let i = 1; i <= 6; i++) {
                    const unlocked = studentData.student[`ZONE_ID_${i}`] == true;
                    const zoneName = zonesData[i - 1]?.ZONE_NAME || `โซน ${i}`;
                    html += `
                        <div class="bg-${unlocked ? 'green' : 'gray'}-100 p-2 md:p-3 rounded text-center">
                            <div class="text-xl md:text-2xl mb-1">${unlocked ? '✅' : '🔒'}</div>
                            <div class="text-xs md:text-sm font-semibold">${zoneName}</div>
                            <div class="text-xs text-gray-600">${unlocked ? 'ผ่านแล้ว' : 'ยังไม่ผ่าน'}</div>
                        </div>
                    `;
                }
                
                html += `
                        </div>
                    </div>

                    <!-- สถานะของรางวัล -->
                    <div class="mb-6">
                        <h4 class="text-base md:text-lg font-bold text-purple-600 mb-3">สถานะของรางวัล</h4>
                        <div class="bg-${studentData.student.GIFT === 'COMPLETED' ? 'green' : 'gray'}-100 p-4 rounded text-center">
                            <div class="text-3xl md:text-4xl mb-2">${studentData.student.GIFT === 'COMPLETED' ? '🎁' : '📦'}</div>
                            <div class="font-semibold text-sm md:text-base">${studentData.student.GIFT === 'COMPLETED' ? 'ได้รับของรางวัลแล้ว' : 'ยังไม่ได้รับของรางวัล'}</div>
                        </div>
                    </div>
                `;

                // ประวัติการทำข้อสอบ - จัดกลุ่มตามโซน
                html += `
                    <div class="mb-6">
                        <h4 class="text-base md:text-lg font-bold text-purple-600 mb-3">ประวัติการทำข้อสอบ</h4>
                `;

                if (studentData.quizResults && studentData.quizResults.length > 0) {
                    // จัดกลุ่มผลลัพธ์ตามโซน
                    const resultsByZone = {};
                    studentData.quizResults.forEach(result => {
                        if (!resultsByZone[result.ZONE_ID]) {
                            resultsByZone[result.ZONE_ID] = [];
                        }
                        resultsByZone[result.ZONE_ID].push(result);
                    });

                    // แสดงผลแต่ละโซน
                    for (let zoneId = 1; zoneId <= 6; zoneId++) {
                        const zoneName = zonesData[zoneId - 1]?.ZONE_NAME || `โซน ${zoneId}`;
                        const zoneResults = resultsByZone[zoneId] || [];
                        
                        if (zoneResults.length > 0) {
                            html += `
                                <div class="mb-4 border-2 border-purple-200 rounded-lg p-3">
                                    <h5 class="font-bold text-purple-600 mb-2 text-sm md:text-base">โซน: ${zoneName} (ทำแล้ว ${zoneResults.length} ครั้ง)</h5>
                                    <div class="space-y-2">
                            `;
                            
                            zoneResults.forEach((result, index) => {
                                const passed = result.ITEM == true;
                                const date = new Date(result.TIMESTAMP).toLocaleDateString('th-TH', { 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                
                                // แปลงเวลาจาก 1899-12-30T00:15:00.000Z เป็น 15 วินาที หรือ 1:30 (1 นาที 30 วินาที)
                                let timeDisplay = '-';
                                if (result.TIME) {
                                    if (result.TIME.includes('T')) {
                                        // กรณีเป็น ISO format - ดึงเฉพาะนาทีและวินาที
                                        const timeDate = new Date(result.TIME);
                                        const totalMinutes = timeDate.getUTCHours() * 60 + timeDate.getUTCMinutes();
                                        const seconds = timeDate.getUTCSeconds();
                                        
                                        if (totalMinutes > 0) {
                                            timeDisplay = `${totalMinutes}:${seconds.toString().padStart(2, '0')}`;
                                        } else {
                                            timeDisplay = `${seconds} วินาที`;
                                        }
                                    } else {
                                        // กรณีเป็น format ปกติ เช่น 0:15 หรือ 1:30
                                        timeDisplay = result.TIME;
                                    }
                                }
                                
                                html += `
                                    <div class="bg-${passed ? 'green' : 'red'}-50 p-2 md:p-3 rounded flex flex-wrap items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span class="font-semibold text-sm md:text-base">ครั้งที่ ${index + 1}</span>
                                            <span class="text-xl">${passed ? '✅' : '❌'}</span>
                                        </div>
                                        <div class="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm">
                                            <span class="font-semibold">คะแนน: ${result.SCORE}/10</span>
                                            <span>เวลาที่ใช้: ${timeDisplay}</span>
                                            <span class="text-gray-600">${date}</span>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            html += `
                                    </div>
                                </div>
                            `;
                        }
                    }
                } else {
                    html += `
                        <div class="text-center py-6 text-gray-500 text-sm md:text-base">
                            <p>ยังไม่มีประวัติการทำข้อสอบ</p>
                        </div>
                    `;
                }

                html += `</div>`;

                document.getElementById('studentDetailContent').innerHTML = html;
                document.getElementById('studentDetailModal').classList.remove('hidden');
                
            } catch (error) {
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้', 'error');
            }
        }

        function closeStudentDetail() {
            document.getElementById('studentDetailModal').classList.add('hidden');
        }

        function exitTeacherDashboard() {
            document.getElementById('teacherScreen').classList.add('hidden');
            
            if (currentUser) {
                document.getElementById('gameScreen').classList.remove('hidden');
                document.getElementById('aboutButton').classList.add('hidden');
            } else {
                document.getElementById('loginScreen').classList.remove('hidden');
                document.getElementById('aboutButton').classList.remove('hidden');
            }
        }