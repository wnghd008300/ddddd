let img_navbar;
let img_adBanner;
let img_product;
let img_gnb;
let img_aiIcon;
let img_green;
let img_textBox;

let state = 0;

let apiKey = "AIzaSyDf3rp_tJJouyo3uU2Ccyl-z744dXDzfpc";
const systemPrompt =
    "You are a helpful AI assistant; given the information in the PDF file, please provide accurate responses in fewer than three sentences.";
let conversationHistory = [];
let ai_response;

let pdfInput;
let encodedPDF = null;
let pdfAdded = false;

function preload() {
    img_navbar = loadImage("01_NavBar.png");
    img_adBanner = loadImage("02_AdBanner.png");
    img_product = loadImage("03_Product.png");
    img_gnb = loadImage("04_GNB.png");
    img_aiIcon = loadImage("05_ai_icon.png");
    img_green = loadImage("06_green.png");
    img_textBox = loadImage("07_textbox.png");
}

function setup() {
    createCanvas(393, 852);

    if (!("webkitSpeechRecognition" in window)) {
        console.log("Speech recognition is not supported in this browser.");
        noLoop();
    } else {
        speechRecognition = new webkitSpeechRecognition();
        speechRecognition.lang = "ko-KR";
        speechRecognition.continuous = true;
        speechRecognition.onresult = speechResult;
    }

    pdfInput = createFileInput(handleFile);
    pdfInput.attribute("accept", ".pdf");
    pdfInput.style("opacity", "0");
    pdfInput.style("position", "absolute");
    pdfInput.position(0, 0);
    pdfInput.size(width, 100);
}

function draw() {
    background(255);
    if (state == 0) {
        image(img_navbar, 0, 0, 393, 128);
        image(img_adBanner, 0, 128, 393, 284);
        image(img_product, 0, 412, 393, 440);
        image(img_gnb, 0, 764, 393, 88);
        image(img_aiIcon, 320, 688, 60, 60);
    } else if (state == 1) {
        image(img_navbar, 0, 0, 393, 128);
        image(img_adBanner, 0, 128, 393, 284);
        image(img_product, 0, 412, 393, 440);
        image(img_green, 0, 612, 393, 152);
        image(img_gnb, 0, 764, 393, 88);
        image(img_aiIcon, 320, 688, 60, 60);
    } else if (state == 2) {
        image(img_navbar, 0, 0, 393, 128);
        image(img_adBanner, 0, 128, 393, 284);
        image(img_product, 0, 412, 393, 440);
        image(img_textBox, 27, 176, 340, 514);
        image(img_gnb, 0, 764, 393, 88);
        image(img_aiIcon, 320, 688, 60, 60);

        fill(255);
        textSize(18);
        textAlign(CENTER, CENTER);
        textWrap(WORD);
        text(ai_response, 47, height / 2, 300);
    }
}

function mouseClicked() {
    if (mouseX >= 320 && mouseX <= 380) {
        if (mouseY >= 688 && mouseY <= 748) {
            if (state == 0) {
                state = 1;
                startSpeechRecognition();
            } else if (state == 1) {
                state = 0;
            } else if (state == 2) {
                state = 0;
            }
        }
    }
}

function startSpeechRecognition() {
    if (speechRecognition) {
        speechRecognition.start();
    }
}

function speechResult(event) {
    let speechInput = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

    if (event.results[event.results.length - 1].isFinal) {
        generateResponse(speechInput);
        speechRecognition.stop();
    }
}

async function generateResponse(question) {
    let url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    let systemInstruction = systemPrompt;

    if (encodedPDF && !pdfAdded) {
        conversationHistory.push({
            role: "user",
            parts: [
                {
                    inline_data: {
                        mime_type: "application/pdf",
                        data: encodedPDF,
                    },
                },
            ],
        });
        pdfAdded = true;
    }

    conversationHistory.push({ role: "user", parts: [{ text: question }] });

    let requestBody = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: conversationHistory,
    };

    try {
        let response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        let data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            responseText = data.candidates[0].content.parts[0].text;
        } else {
            responseText = "No response received.";
        }

        console.log("Answer:", responseText);
        ai_response = responseText;
        speakText(responseText);
        state = 2;

        conversationHistory.push({
            role: "model",
            parts: [{ text: responseText }],
        });
    } catch (error) {
        console.log("Error: " + error.message);
    }
}

function handleFile(file) {
    if (
        file.type === "application/pdf" ||
        (file.name && file.name.toLowerCase().endsWith(".pdf"))
    ) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let dataUrl = e.target.result;
            encodedPDF = dataUrl.split(",")[1];
            pdfAdded = false;
        };
        reader.readAsDataURL(file.file);
    } else {
        console.log("Uploaded file is not a PDF.");
    }
}

async function speakText(text) {
  let ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  let requestBody = {
    audioConfig: {
      audioEncoding: "MP3",
      effectsProfileId: ["telephony-class-application"],
      pitch: 0,
      speakingRate: 1,
    },
    input: {
      text: text,
    },
    voice: {
      languageCode: "ko-KR",
      name: "ko-KR-Chirp3-HD-Puck",
    },
  };

  try {
    let response = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    let data = await response.json();
    if (data.audioContent) {
      let audioData = "data:audio/mp3;base64," + data.audioContent;
      let audio = new Audio(audioData);
      audio.play();
    }
  } catch (error) {
    console.log("Error: " + error.message);
  }
}
