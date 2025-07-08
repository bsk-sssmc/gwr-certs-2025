// Use globally loaded jsPDF instead of importing
const { jsPDF } = window.jspdf;

const API_VALIDATE = "api/validate-email";
const qs = (sel) => document.querySelector(sel);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canvas = qs("#certificateCanvas");
const ctx = canvas.getContext("2d");

const TEMPLATE_WIDTH = 3627;
const TEMPLATE_HEIGHT = 2599;

const TEMPLATE_MAP = {
  PARTICIPANT: "cert-participation-template.png",
  MODERATOR: "cert-moderator-template.png",
  HOST: "cert-host-template.png",
};

let category = null;

function startOver() {
  qs("#email").value = "";  // Clear email input manually
  qs("#emailForm").hidden = false;
  qs("#done").hidden = true;
  qs("#emailMsg").textContent = "";
  qs("#thankYouMsg").textContent = "";
}

qs("#reset").onclick = startOver;

// Handle Enter key on email input
qs("#email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    qs("#validateBtn").click();
  }
});

qs("#validateBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = qs("#email").value.trim();

  if (!emailRe.test(email)) {
    qs("#emailMsg").textContent = "❌ Please enter a valid email address.";
    return;
  }

  qs("#emailMsg").textContent = "⏳ Checking…";

  try {
    const res = await fetch(API_VALIDATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json());

    if (!res.valid) {
      qs("#emailMsg").textContent = "❌ Email not recognised.";
      return;
    }

    category = res.category ? res.category.toUpperCase() : "PARTICIPANT";
    const name = res.name ? res.name.trim().toUpperCase() : "";
    const certId = res.id;

    qs("#emailForm").hidden = true;

    const thankYou = `
      Thank you for participating in the Collective Chanting of Sai Gayatri for Global Peace on June 15, 2025.<br>
      The Sri Sathya Sai Media Centre is pleased to offer you this digital certificate in recognition of your participation in this sacred event as a ${category}.
    `;
    qs("#thankYouMsg").innerHTML = thankYou;

    const templateURL = TEMPLATE_MAP[category] || TEMPLATE_MAP.PARTICIPANT;
    
    try {
      await generateCertificate(name, certId, templateURL);
    } catch (certError) {
      qs("#emailMsg").textContent = "❌ Error generating certificate. Please try again.";
      qs("#emailForm").hidden = false;
    }
  } catch (err) {
    qs("#emailMsg").textContent = "❌ Server error. Try again.";
  }
});

async function generateCertificate(name, certId, templateURL) {
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

        // Name in center
        ctx.fillStyle = "#333";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let fontSize = 120;
        const maxWidth = TEMPLATE_WIDTH * 0.7;

        ctx.font = `${fontSize}px serif`;
        let metrics = ctx.measureText(name);

        while (metrics.width > maxWidth && fontSize > 40) {
          fontSize -= 2;
          ctx.font = `${fontSize}px serif`;
          metrics = ctx.measureText(name);
        }

        const x = TEMPLATE_WIDTH / 2;
        const y = 1300;

        ctx.fillText(name, x, y);

        // ID at bottom-right
        ctx.fillStyle = "#F7F2EC";
        ctx.font = `36px monospace`;
        ctx.textAlign = "right";
        ctx.fillText(`ID: ${certId}`, TEMPLATE_WIDTH - 200, TEMPLATE_HEIGHT - 50);

        qs("#done").hidden = false;
        
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = templateURL;
  });
}

async function downloadCertificate() {
  console.log("🔥 Download button clicked — generating PDF");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [TEMPLATE_WIDTH, TEMPLATE_HEIGHT],
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.9);
  console.log("🔥 Got canvas data URL");
  pdf.addImage(imgData, "JPEG", 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  pdf.save(`certificate.pdf`);
  console.log("🔥 PDF save triggered");
}


qs("#downloadBtn").addEventListener("click", () => downloadCertificate());
