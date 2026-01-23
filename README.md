# 🚀 Indie-Go-Chain | Decentralized Crowdfunding Platform
### פלטפורמת מימון המונים מבוזרת מבוססת Ethereum Blockchain

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.0-363636.svg)
![Web3](https://img.shields.io/badge/Web3.js-1.x-orange.svg)

**Indie-Go-Chain** היא אפליקציית DApp (Decentralized Application) המאפשרת לאמנים ויוצרים לגייס כספים לפרויקטים עתידיים בצורה שקופה, מאובטחת ומבוססת חוזים חכמים. המערכת מיישמת מנגנון נאמנות (Escrow) חכם, בו הכספים משתחררים ליוצר רק לאחר עמידה באבני דרך (Milestones) מוכחות.

---

## ✨ פיצ'רים מרכזיים (Key Features)

* **🪙 מטבע פנימי (ERC20):** שימוש ב-`IndieToken` לביצוע עסקאות בפלטפורמה.
* **🎨 בעלות דיגיטלית (NFT - ERC721):** כל פרויקט מיוצג כ-NFT ייחודי, המכיל את המידע, הבעלות וההיסטוריה שלו.
* **🔒 מנגנון נאמנות (Smart Escrow):**
    * ברכישה: 10% עוברים מיד לאמן כמקדמה.
    * היתרה (90%) ננעלת בחוזה חכם.
    * שחרור כספים הדרגתי לפי אבני דרך (30%, 40%, 30%).
* **📜 היסטוריה מלאה (Full Audit Log):** תיעוד של כל פעולה (יצירה, קניה, שחרור שלב) על הבלוקצ'יין, כולל תאריכים וסכומים.
* **🔄 מסחר משני:** תמיכה בהעברת בעלות ומכירה חוזרת (Resale).
* **⚡ חווית משתמש (UX):** זיהוי אוטומטי של ארנק, בדיקת אישורים (Allowance/Approve) וממשק ניהול דינמי ליוצרים.

---

## 🛠️ טכנולוגיות (Tech Stack)

| Component | Technology | Description |
|-----------|------------|-------------|
| **Smart Contracts** | Solidity | ERC721, ERC20, ReentrancyGuard |
| **Frontend** | HTML5, Bootstrap 5 | ממשק רספונסיבי ונקי |
| **Blockchain Interaction** | Web3.js | תקשורת בין הדפדפן לבלוקצ'יין |
| **Wallet** | Metamask | ניהול זהות וחתימה על עסקאות |
| **Development** | Remix IDE | פיתוח, בדיקות ופריסה (Deploy) |

---

## 🏗️ ארכיטקטורת המערכת

```mermaid
graph TD
    User[משתמש / משקיע] -->|Web3.js| Frontend[ממשק Web]
    Frontend -->|Transactions| Metamask[ארנק Metamask]
    Metamask -->|Sign & Send| Blockchain[Ethereum Network / Sepolia]
    
    subgraph Smart Contracts
        NFT[IndieGoNFT Contract]
        Token[IndieToken {ERC20}]
        
        NFT -->|Checks Balance| Token
        NFT -->|Transfers Funds| Token
    end
    
    Blockchain --> NFT
    Blockchain --> Token
```
# 🛠️ מדריך התקנה והפעלה (Installation Guide)

מדריך זה מפרט את השלבים לפריסת החוזים החכמים והרצת המערכת המקומית.

## 📋 דרישות קדם
1.  **Metamask:** ארנק מותקן בדפדפן, מחובר לרשת **Sepolia Testnet**.
2.  **Sepolia ETH:** יתרה בארנק לתשלום עמלות (ניתן להשיג ב-Faucets).
3.  **VS Code + Live Server (Extension):** להרצת ממשק ה-Web.

---

## שלב 1: פריסת החוזים ב-Remix IDE

### א. פריסת המטבע (ERC20)
1.  פתח את [Remix](https://remix.ethereum.org).
2.  צור קובץ `IndieToken.sol` והדבק את הקוד.
3.  בצע **Compile**.
4.  בלשונית **Deploy**: בחר `Injected Provider - MetaMask`.
5.  לחץ **Deploy** ואשר בארנק.
6.  📋 **העתק ושמור בצד את כתובת החוזה שנוצר (Token Address).**

### ב. פריסת המערכת (NFT)
1.  צור קובץ `IndieGoNFT.sol` והדבק את הקוד.
2.  בצע **Compile**.
3.  בלשונית **Deploy**:
    * בתיבת הטקסט ליד כפתור ה-Deploy (ה-Constructor), **הדבק את כתובת ה-Token מהשלב הקודם**.
4.  לחץ **Deploy** ואשר בארנק.
5.  📋 **העתק ושמור את כתובת חוזה ה-NFT.**

---

## שלב 2: הגדרת הממשק (Frontend)

1.  פתח את התיקייה ב-VS Code.
2.  פתח את הקובץ `app.js`.
3.  בשורה הראשונה, עדכן את הכתובות לכתובות החדשות שיצרת:

```javascript
// עדכן כאן את הכתובות מ-Remix
const NFT_ADDRESS = "0xYOUR_NFT_ADDRESS_HERE"; 
const TOKEN_ADDRESS = "0xYOUR_TOKEN_ADDRESS_HERE";
```
4. שמור את הקובץ

## שלב 3: הרצה
1. ב-VS Code, לחץ קליק ימני על index.html.
2. בחר Open with Live Server.
3. הדפדפן יפתח בכתובת http://127.0.0.1:5500.