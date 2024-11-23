const openAiApiKey = ''; // Replace with OpenAI API key
const weatherApiKey = '839affe97e615679d4dbb8d01a9d02aa'; // Replace with Weather API key
const googleMapsApiKey = ''; // Replace with Google Maps API key
const unsplashApiKey = 'rBKbGl1OWYfS4cY6-rqeQt10GkTtk4BY8h0SMa5_d98'; // Replace with Unsplash API key
const newsApiKey = ''; // Replace with News API key

// Initialize Speech Recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;

// Text-to-Speech Function
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
}

// Start listening with voice recognition
function startVoiceRecognition() {
    document.getElementById("queryInput").value = '';
    recognition.start();

    recognition.onresult = async (event) => {
        if (event.results.length > 0) {
            const voiceQuery = event.results[0][0].transcript;
            document.getElementById('queryInput').value = voiceQuery;
            await handleQuery();
        } else {
            speak("I couldn't hear you. Please try again.");
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        speak("Sorry, an error occurred with voice recognition.");
    };
}

// Handle user queries
async function handleQuery() {
    recognition.stop();
    const query = document.getElementById("queryInput").value.toLowerCase();
    const responseElement = document.getElementById("response");
    const featureImage = document.getElementById("featureImage");

    responseElement.innerHTML = "Thinking...";
    featureImage.style.display = "none";

    let responseText = "";
    let imageUrl = "";

    try {
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

        responseElement.innerHTML = responseText;
        if (imageUrl) {
            featureImage.src = imageUrl;
            featureImage.style.display = 'block';
        } else {
            featureImage.style.display = 'none';
        }
        speak(responseText);
    } catch (error) {
        console.error("Error handling query:", error);
        responseElement.innerHTML = "Sorry, I couldn't process your request.";
        speak("Sorry, something went wrong. Please try again.");
    }
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
        const response = await fetch(apiUrl, { method: "POST", headers, body });
        const data = await response.json();
        return data.choices?.[0]?.message?.content.trim() || "I couldn't find an answer to your question.";
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "An error occurred while fetching the AI response.";
    }
}

// Fetch weather information
async function getWeather(query) {
    const location = query.split("in ")[1]?.trim() || "New York";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${weatherApiKey}&units=metric`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.weather && data.main) {
            const description = data.weather[0].description;
            const temp = data.main.temp;
            return `The weather in ${location} is ${description} with a temperature of ${temp}°C.`;
        } else {
            return `I couldn't find weather information for ${location}.`;
        }
    } catch (error) {
        console.error("Weather API Error:", error);
        return "Unable to fetch weather data.";
    }
}

// Fetch news headlines
async function fetchNews() {
    const newsUrl = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`;
    try {
        const res = await fetch(newsUrl);
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
            return `Here's the top news: ${data.articles[0].title}`;
        } else {
            return "No news found.";
        }
    } catch (error) {
        console.error("News API Error:", error);
        return "Unable to fetch news.";
    }
}

// Fetch user location using Google Maps API
async function getUserLocation() {
    if (!navigator.geolocation) {
        return "Geolocation is not supported by your browser.";
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${googleMapsApiKey}`;

            try {
                const res = await fetch(url);
                const data = await res.json();
                const address = data.results?.[0]?.formatted_address || "Location not found";
                resolve(`Your current location is ${address}`);
            } catch (error) {
                reject("Error fetching location details.");
            }
        }, () => {
            reject("Permission to access location was denied.");
        });
    });
}

// Search for an image on Unsplash
async function searchImage(query) {
    const url = `https://api.unsplash.com/search/photos?query=${query}&client_id=${unsplashApiKey}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.results?.[0]?.urls?.regular || null;
    } catch (error) {
        console.error("Image Search Error:", error);
        return null;
    }
}

// Wake-up trigger using Annyang.js
if (window.annyang) {
    const commands = { "hey buddy": startVoiceRecognition };
    annyang.addCommands(commands);
    annyang.start({ continuous: true });
} else {
    console.error("Annyang.js is not supported in this browser.");
}
