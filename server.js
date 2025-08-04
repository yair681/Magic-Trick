const express = require("express");
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// אובייקט בזיכרון לאחסון הקלפים
const cards = {};

// עמוד ניהול
app.get("/admin", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>ניהול קסם</title>
<style>
body { font-family: Arial; text-align: center; margin-top: 50px; }
input, button, select { font-size: 18px; padding: 8px; margin: 5px; }
#linkBox { margin-top: 20px; }
</style>
</head>
<body>
<h1>🎩 ניהול קסם</h1>

<h2>1. יצירת קישור למשתתף</h2>
<button onclick="generateLink()">צור קישור חדש</button>
<div id="linkBox" style="display:none;">
    <p>שלח את הקישור הזה למשתתף:</p>
    <input type="text" id="viewerLink" readonly style="width: 400px;">
</div>

<hr>

<h2>2. הזנת הקלף לאחר שהמשתתף אמר אותו</h2>
<label>מזהה משתתף:</label>
<input type="text" id="id" placeholder="העתק את המזהה מהקישור"><br>
<label>ערך הקלף:</label>
<input type="text" id="cardValue" placeholder="לדוגמה: King"><br>
<label>צורת הקלף:</label>
<select id="cardSuit">
    <option value="♣">תלתן</option>
    <option value="♦">יהלום</option>
    <option value="♥">לב</option>
    <option value="♠">עלה</option>
</select><br>
<button onclick="setCard()">שמור קלף</button>

<script>
async function generateLink() {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const link = window.location.origin + "/viewer?id=" + id;

    document.getElementById("id").value = id;
    document.getElementById("viewerLink").value = link;
    document.getElementById("linkBox").style.display = "block";
}

async function setCard() {
    const id = document.getElementById("id").value;
    const cardValue = document.getElementById("cardValue").value;
    const cardSuit = document.getElementById("cardSuit").value;
    const fullCard = cardValue + " " + cardSuit;

    if (!id || !cardValue || !cardSuit) {
        alert("נא למלא את כל השדות.");
        return;
    }

    const res = await fetch("/set-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, card: fullCard }),
    });

    if (res.ok) {
        alert("הקלף נשמר בהצלחה!");
    } else {
        alert("שגיאה בשמירת הקלף.");
    }
}
</script>
</body>
</html>
    `);
});

// עמוד הצפייה של המשתתף - עודכן להצגת טקסט של הצורה בעיניים
app.get("/viewer", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>צפייה בקסם</title>
<style>
body { font-family: Arial; text-align: center; }
.image-container {
    position: relative;
    display: inline-block;
    margin-top: 50px;
}
.eye-text {
    position: absolute;
    font-family: Arial, sans-serif;
    /* גודל פונט מוקטן */
    font-size: 10px;
    font-weight: normal;
    color: #888;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    background-color: transparent;
}
.eye-text.show {
    opacity: 1;
}
/* ---- מיקום ושינוי גודל (מוקטן) ---- */
.left-eye {
    top: 29.0%;
    left: 70.0%;
    transform: translate(-50%, -50%);
}
.right-eye {
    top: 29.8%;
    right: 47.7%;
    transform: translate(50%, -50%);
}
</style>
</head>
<body>
<h1>🔮 קסם הקלף</h1>
<div class="image-container">
    <img id="magician-image" src="magician.png.jpg" alt="עיני הקוסם">
    <span id="left-eye-text" class="eye-text left-eye"></span>
    <span id="right-eye-text" class="eye-text right-eye"></span>
</div>

<script>
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
async function checkCard() {
    if (!id) return;
    const res = await fetch(window.location.origin + "/get-card/" + id);
    const data = await res.json();
    if (data.card) {
        const fullCard = data.card.trim();
        const parts = fullCard.split(' ');
        if (parts.length >= 2) {
            const cardValue = parts[0];
            const cardSuit = parts[1];

            const leftEyeText = document.getElementById("left-eye-text");
            const rightEyeText = document.getElementById("right-eye-text");

            rightEyeText.innerText = cardValue;

            let suitText = '';
            if (cardSuit === '♥') {
                suitText = 'לב';
            } else if (cardSuit === '♦') {
                suitText = 'יהלום';
            } else if (cardSuit === '♣') {
                suitText = 'תלתן';
            } else if (cardSuit === '♠') {
                suitText = 'עלה';
            }
            leftEyeText.innerText = suitText;

            setTimeout(() => {
                leftEyeText.classList.add("show");
                rightEyeText.classList.add("show");
            }, 500);
        }
    }
}
setInterval(checkCard, 1000);
</script>
</body>
</html>
    `);
});

// API - שמירת קלף
app.post("/set-card", (req, res) => {
    const { id, card } = req.body;
    if (!id || !card) return res.status(400).send({ error: "Missing ID or card." });

    cards[id] = card;
    res.send({ status: "ok" });
});

// API - קבלת קלף
app.get("/get-card/:id", (req, res) => {
    const card = cards[req.params.id];
    res.send({ card });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
