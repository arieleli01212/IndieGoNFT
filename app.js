let web3, userAccount;
let nftContract, tokenContract;

// *** חשוב: וודא שהכתובות מעודכנות לאחר ה-Deploy האחרון ***
const NFT_ADDRESS = "0xF5ae303cc8fB43f2AC9305379116a6AF4E9197d3"; 
const TOKEN_ADDRESS = "0xeA924557C3F82ebF625e3614B1937bf13B6B644c";

// ה-ABI המלא והמעודכן
const NFT_ABI = [
    { "inputs": [{"internalType": "string","name": "_title","type": "string"},{"internalType": "uint256","name": "_price","type": "uint256"},{"internalType": "string","name": "m1","type": "string"},{"internalType": "string","name": "m2","type": "string"},{"internalType": "string","name": "m3","type": "string"}],"name": "createProject","outputs": [],"stateMutability": "nonpayable","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],"name": "buyProject","outputs": [],"stateMutability": "nonpayable","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],"name": "completeMilestone","outputs": [],"stateMutability": "nonpayable","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "","type": "uint256"}],"name": "projects","outputs": [{"internalType": "string","name": "title","type": "string"},{"internalType": "address payable","name": "creator","type": "address"},{"internalType": "uint256","name": "price","type": "uint256"},{"internalType": "uint256","name": "balance","type": "uint256"},{"internalType": "bool","name": "isSold","type": "bool"},{"internalType": "uint256","name": "currentMilestoneIndex","type": "uint256"}],"stateMutability": "view","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],"name": "getHistory","outputs": [{"internalType": "address[]","name": "","type": "address[]"}],"stateMutability": "view","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],"name": "getFullHistory","outputs": [{"components": [{"internalType": "string","name": "actionType","type": "string"},{"internalType": "address","name": "user","type": "address"},{"internalType": "uint256","name": "timestamp","type": "uint256"},{"internalType": "uint256","name": "amount","type": "uint256"}],"internalType": "struct IndieGoNFT.HistoryRecord[]","name": "","type": "tuple[]"}],"stateMutability": "view","type": "function" },
    { "inputs": [{"internalType": "uint256","name": "_id","type": "uint256"}],"name": "getMilestones","outputs": [{"components": [{"internalType": "string","name": "description","type": "string"},{"internalType": "uint256","name": "payPercent","type": "uint256"},{"internalType": "bool","name": "isCompleted","type": "bool"}],"internalType": "struct IndieGoNFT.Milestone[3]","name": "","type": "tuple[3]"}],"stateMutability": "view","type": "function" },
    { "inputs": [],"name": "nextId","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function" }
];

const TOKEN_ABI = [
    { "inputs": [{"internalType": "address","name": "spender","type": "address"},{"internalType": "uint256","name": "amount","type": "uint256"}],"name": "approve","outputs": [{"internalType": "bool","name": "","type": "bool"}],"stateMutability": "nonpayable","type": "function" },
    { "inputs": [{"internalType": "address","name": "owner","type": "address"},{"internalType": "address","name": "spender","type": "address"}],"name": "allowance","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function" },
    { "inputs": [{"internalType": "address","name": "account","type": "address"}],"name": "balanceOf","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"stateMutability": "view","type": "function" },
    { "inputs": [],"name": "faucet","outputs": [],"stateMutability": "nonpayable","type": "function" }
];

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            nftContract = new web3.eth.Contract(NFT_ABI, NFT_ADDRESS);
            tokenContract = new web3.eth.Contract(TOKEN_ABI, TOKEN_ADDRESS);
            
            updateUI();
            loadProjects();
            
            window.ethereum.on('accountsChanged', function (accounts) {
                userAccount = accounts[0];
                updateUI();
                loadProjects();
            });

        } catch (error) { showAlert("החיבור נכשל", "danger"); }
    } else { showAlert("נא להתקין Metamask", "warning"); }
}

function updateUI() {
    const btn = document.getElementById('connectBtn');
    if(userAccount) {
        btn.innerText = `🦊 ${userAccount.substring(0, 6)}...`;
        btn.classList.replace('btn-light', 'btn-success');
        checkBalance();
    }
}

async function checkBalance() {
    try {
        const bal = await tokenContract.methods.balanceOf(userAccount).call();
        document.getElementById('userBalance').innerText = `יתרה: ${web3.utils.fromWei(bal, 'ether')} IND`;
    } catch (e) {}
}

async function createProject() {
    const title = document.getElementById('projTitle').value;
    const price = document.getElementById('newPrice').value;
    const m1 = document.getElementById('m1Desc').value;
    const m2 = document.getElementById('m2Desc').value;
    const m3 = document.getElementById('m3Desc').value;

    if (!title || !price || !m1) { showAlert("נא למלא את כל השדות", "warning"); return; }
    const priceWei = web3.utils.toWei(price, 'ether');
    
    try {
        showAlert("ממתין לאישור...", "info");
        await nftContract.methods.createProject(title, priceWei, m1, m2, m3).send({ from: userAccount });
        showAlert("הפרויקט נוצר בהצלחה!", "success");
        loadProjects();
    } catch (e) { showAlert("שגיאה ביצירה", "danger"); }
}

async function handleBuy(id, priceWei) {
    try {
        showAlert("בודק אישור משיכה...", "info");
        const allowance = await tokenContract.methods.allowance(userAccount, NFT_ADDRESS).call();
        
        if (BigInt(allowance) < BigInt(priceWei)) {
            showAlert("נדרש Approve...", "warning");
            await tokenContract.methods.approve(NFT_ADDRESS, priceWei).send({ from: userAccount });
        }

        await nftContract.methods.buyProject(id).send({ from: userAccount });
        showAlert("רכישה בוצעה!", "success");
        loadProjects();
        checkBalance();

    } catch (e) { showAlert("נכשל: " + e.message, "danger"); }
}

async function completeMilestone(id) {
    try {
        await nftContract.methods.completeMilestone(id).send({ from: userAccount });
        showAlert("אבן דרך אושרה!", "success");
        loadProjects();
    } catch (e) { showAlert("שגיאה: " + e.message, "danger"); }
}

// --- התיקון נמצא בפונקציה הזו ---
async function openProjectDetails(id) {
    try {
        const p = await nftContract.methods.projects(id).call();
        const milestones = await nftContract.methods.getMilestones(id).call();
        const history = await nftContract.methods.getFullHistory(id).call();

        document.getElementById('modalTitle').innerText = `${p.title} (פרויקט #${id})`;
        document.getElementById('modalPrice').innerText = `שווי פרויקט: ${web3.utils.fromWei(p.price, 'ether')} IND`;

        let milestonesHTML = '';
        milestones.forEach((m, index) => {
            const statusClass = m.isCompleted ? 'status-done' : 'status-pending';
            const icon = m.isCompleted ? '✅' : '⏳';
            const statusText = m.isCompleted ? 'הושלם ושולם' : 'ממתין לביצוע';
            
            // המרה ל-Number כדי למנוע שגיאות הדפסה
            const percent = Number(m.payPercent);

            milestonesHTML += `
                <div class="p-3 mb-2 rounded ${statusClass} d-flex justify-content-between align-items-center">
                    <div>
                        <strong>אבן דרך ${index + 1}: ${m.description}</strong>
                        <div class="small text-muted">${percent}% מהיתרה</div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-light text-dark border">${statusText} ${icon}</span>
                    </div>
                </div>
            `;
        });
        document.getElementById('modalMilestones').innerHTML = milestonesHTML;

        let historyHTML = '';
        [...history].reverse().forEach(rec => {
            // *** תיקון ה-BigInt ***
            // המרה של ה-timestamp מ-BigInt למספר רגיל לפני ההכפלה ב-1000
            const timestampNum = Number(rec.timestamp);
            const date = new Date(timestampNum * 1000).toLocaleString('he-IL');
            
            const amount = web3.utils.fromWei(rec.amount, 'ether');
            historyHTML += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between">
                        <strong>${rec.actionType}</strong>
                        <span class="text-muted small">${date}</span>
                    </div>
                    <div class="small text-muted">משתמש: ${rec.user.substring(0,6)}... | סכום: ${amount} IND</div>
                </div>
            `;
        });
        document.getElementById('modalHistory').innerHTML = historyHTML;

        const myModal = new bootstrap.Modal(document.getElementById('projectModal'));
        myModal.show();

    } catch (e) { console.error("Error showing details:", e); }
}

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    const adminList = document.getElementById('myProjectsList');
    grid.innerHTML = "";
    adminList.innerHTML = "";

    try {
        const total = await nftContract.methods.nextId().call();

        for (let i = 0; i < total; i++) {
            const p = await nftContract.methods.projects(i).call();
            const priceEth = web3.utils.fromWei(p.price, 'ether');
            
            // המרה למספר כדי למנוע בעיות BigInt
            const currentMsIndex = Number(p.currentMilestoneIndex);

            // --- 1. כרטיס לשוק (Market) ---
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 p-3 shadow-sm">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-light text-dark border">#${i}</span>
                            ${p.isSold ? 
                                (currentMsIndex >= 3 ? '<span class="badge bg-success">הושלם בהצלחה 🏆</span>' : '<span class="badge bg-secondary">נמכר - בעבודה</span>') 
                                : '<span class="badge bg-success">זמין למכירה</span>'}
                        </div>
                        
                        <h4 class="fw-bold mb-1">${p.title}</h4>
                        <p class="text-muted small">יוצר: ${p.creator.substring(0,6)}...</p>
                        <h3 class="text-primary my-3">${priceEth} IND</h3>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="openProjectDetails(${i})">ℹ️ פרטים, אבני דרך והיסטוריה</button>
                            ${!p.isSold ? 
                                `<button class="btn btn-gradient" onclick="handleBuy(${i}, '${p.price}')">קנה עכשיו</button>` : 
                                `<button class="btn btn-secondary" disabled>בבעלות משקיע</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;

            // --- 2. אזור הניהול (Admin) - השינוי הגדול כאן ---
            if (userAccount && p.creator.toLowerCase() === userAccount.toLowerCase()) {
                
                let adminActionHTML = '';

                // בדיקה: האם הפרויקט הושלם? (3 אבני דרך)
                if (currentMsIndex >= 3) {
                    // אם הושלם - הצג הודעה ירוקה נקייה
                    adminActionHTML = `
                        <div class="alert alert-success m-0 py-2 d-flex justify-content-between align-items-center w-100">
                            <strong>🏆 כל אבני הדרך הושלמו!</strong>
                            <button class="btn btn-sm btn-outline-success" onclick="openProjectDetails(${i})">צפה בסיכום</button>
                        </div>
                    `;
                } else {
                    // אם לא הושלם - הצג את הכפתורים הרגילים
                    adminActionHTML = `
                        <div class="d-flex justify-content-between align-items-center w-100">
                            <div><strong>${p.title}</strong> <span class="text-muted small">(שלב ${currentMsIndex + 1} מתוך 3)</span></div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-outline-dark" onclick="openProjectDetails(${i})">👁️ פרטים</button>
                                <button class="btn btn-primary btn-sm" 
                                    onclick="completeMilestone(${i})" 
                                    ${(currentMsIndex >= 3 || !p.isSold) ? 'disabled' : ''}>
                                    ${!p.isSold ? '⏳ ממתין לקונה' : '✅ אשר שלב'}
                                </button>
                            </div>
                        </div>
                    `;
                }

                adminList.innerHTML += `
                    <div class="col-12 mb-3">
                        <div class="card p-3 border-${currentMsIndex >= 3 ? 'success' : 'primary'}">
                            ${adminActionHTML}
                        </div>
                    </div>
                `;
            }
        }
    } catch (e) { console.error(e); }
}

function showAlert(msg, type) {
    document.getElementById('alertArea').innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show">
            ${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
}