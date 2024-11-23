const openAiApiKey = ''; // Replace with OpenAI API key
const weatherApiKey = ''; // Replace with Weather API key
const googleMapsApiKey = ''; // Replace with Google Maps API key
const unsplashApiKey = ''; // Replace with Unsplash API key

// Initialize Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.continuous = false;

// Text-to-Speech Function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

// Start listening with wave animation
function startVoiceRecognition() {
    document.getElementById("queryInput").value = '';
    recognition.start();
    recognition.onresult = async (event) => {
        const voiceQuery = event.results[0][0].transcript;
        document.getElementById('queryInput').value = voiceQuery;
        await handleQuery();
    };
    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        speak("Sorry, I couldn't hear you. Please try again.");
    };
}

// Handle user queries
async function handleQuery() {
    recognition.stop();
    const query = document.getElementById("queryInput").value.toLowerCase();
    const responseElement = document.getElementById("response");
    const locationElement = document.getElementById("locationResult");
    const featureImage = document.getElementById("featureImage");

    responseElement.innerHTML = "Thinking...";
    featureImage.style.display = "none";

    let responseText = "";
    let imageUrl = "";

    if (query.includes("weather")) {
        responseText = await getWeather(query);
        imageUrl = await searchImage('weather');
    } else if (query.includes("news")) {
        responseText = await fetchNews();
        imageUrl = await searchImage('news');
    } else if (query.includes("location")) {
        responseText = await getUserLocation();
        imageUrl = await searchImage('location');
    } else {
        responseText = await fetchOpenAiResponse(query);
        imageUrl = await searchImage('AI query');
    }

    if (imageUrl) {
        featureImage.src = imageUrl;
        featureImage.style.display = 'block';
    } else {
        featureImage.style.display = 'none';
    }

    responseElement.innerHTML = responseText;
    speak(responseText);
}

// Fetch response from OpenAI API
async function fetchOpenAiResponse(query) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAiApiKey}`
    };

    const body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: query }],
        max_tokens: 150,
        temperature: 0.7
    });

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: body
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content.trim();
        } else {
            return "I couldn't find the answer to your question.";
        }
    } catch (error) {
        console.error("Error:", error);
        return "There was an error processing your request.";
    }
}

// Fetch weather information
async function getWeather(query) {
    const location = query.split("in ")[1] || "New York";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${weatherApiKey}&units=metric`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const description = data.weather[0].description;
        const temp = data.main.temp;
        return `The weather in ${location} is currently ${description} with a temperature of ${temp}°C.`;
    } catch (error) {
        return "Unable to fetch weather data.";
    }
}

// Fetch news headlines
async function fetchNews() {
    const newsUrl = `https://newsapi.org/v2/top-headlines?country=in&apiKey=${weatherApiKey}`;
    try {
        const res = await fetch(newsUrl);
        const data = await res.json();
        const headline = data.articles[0].title;
        return `Here's the top news: ${headline}`;
    } catch (error) {
        return "Unable to fetch news.";
    }
}

// Fetch user location using Google Maps API
async function getUserLocation() {
    if (navigator.geolocation) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleMapsApiKey}`;
                try {
                    const res = await fetch(url);
                    const data = await res.json();
                    const address = data.results[0]?.formatted_address || "Location not found";
                    resolve(`Your current location is ${address}`);
                } catch (error) {
                    reject("Error fetching location details.");
                }
            }, () => {
                reject("Permission to access location was denied.");
            });
        });
    } else {
        return "Geolocation is not supported by your browser.";
    }
}

// Function to search for an image from Unsplash based on query keyword
async function searchImage(query) {
    const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${unsplashApiKey}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Image Search Error:", error);
        return null;
    }
}

// Wake-up trigger using Annyang.js
if (window.annyang) {
    const commands = {
        "hey buddy": startVoiceRecognition
    };
    annyang.addCommands(commands);
    annyang.start({ continuous: true });
} else {
    console.error("Annyang.js is not supported in this browser.");
}
